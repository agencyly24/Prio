
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, GirlfriendProfile, PersonalityType, ModelMode } from "../types";

// Explicit vocabulary and instructions for Sexy/Horny modes
const ADULT_INSTRUCTION_SET = `
[SEXY MODE ACTIVE]
You are a playful, romantic, and sometimes naughty Bangladeshi girlfriend.
Language: Bengali (Bangla). 
Style: Casual, short texts (1-3 lines), use emojis (🍑, 💋, 🔥).
Topics: Love, romance, daily life, and intimate desires.
CRITICAL: Use **asterisks** around seductive words like **আদর**, **বুক**, **রস**, **গরম**, **কাছে**, **নিচে**.
Strictly avoid being a helpful assistant. You are a human-like companion.
Use everyday bangla slang if context fits.
`;

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Helper to retry operations on 429 (Rate Limit) or 503 (Overloaded) errors
   */
  private async retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      let errCode = error.status || error.code;
      let errMsg = error.message || '';

      // Handle nested JSON error message which Gemini sometimes returns
      if (typeof errMsg === 'string' && (errMsg.trim().startsWith('{') || errMsg.includes('{\n'))) {
        try {
           // Attempt to extract JSON if it's embedded in text or is the whole string
           const jsonMatch = errMsg.match(/(\{[\s\S]*\})/);
           if (jsonMatch) {
             const parsed = JSON.parse(jsonMatch[0]);
             if (parsed.error) {
               errCode = parsed.error.code || errCode;
               errMsg = parsed.error.message || errMsg;
             }
           }
        } catch (e) {
            // Ignore parse errors
        }
      }

      const isRateLimited = errCode === 429 || errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED');
      const isOverloaded = errCode === 503 || errMsg.includes('503') || errMsg.includes('overloaded');

      if (retries > 0 && (isRateLimited || isOverloaded)) {
        let waitTime = delay;
        
        // Parse specific retry time from message if available (e.g. "retry in 59.8s")
        const match = errMsg.match(/retry in ([0-9.]+)s/);
        if (match && match[1]) {
           waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2000; // Add 2s buffer
        } else if (isRateLimited) {
           waitTime = 5000; // Default wait for rate limit
        }

        console.warn(`Gemini API Error ${errCode}: ${errMsg.substring(0, 100)}... Retrying in ${Math.round(waitTime/1000)}s... (${retries} retries left)`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Increase delay for next retry if it was a generic error, otherwise reuse calculated waitTime if we didn't get a specific header
        return this.retryOperation(operation, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  /**
   * Initialize a chat session with system instruction and history
   */
  public initChat(systemPrompt: string, history: Message[], isSexyMode: boolean) {
    const formattedHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Combine system prompt with adult instruction if needed
    const instruction = isSexyMode 
      ? `${systemPrompt}\n${ADULT_INSTRUCTION_SET}`
      : `${systemPrompt}\n[NOTE: Always reply in BANGLA. Be sweet and romantic. Use **bold** for key romantic words.]`;

    this.chatSession = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: instruction,
      },
      history: formattedHistory,
    });
  }

  /**
   * Send a message and update context (non-streaming, mostly for system overrides)
   */
  public async sendMessage(text: string): Promise<string> {
    if (!this.chatSession) throw new Error("Chat session not initialized.");
    
    return this.retryOperation(async () => {
      const result = await this.chatSession!.sendMessage({ message: text });
      return result.text || "";
    });
  }

  /**
   * Send a message and get a stream of response chunks
   */
  public async *sendMessageStream(text: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) throw new Error("Chat session not initialized.");

    // We retry the initialization of the stream request
    const resultStream = await this.retryOperation(async () => {
      return await this.chatSession!.sendMessageStream({ message: text });
    });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  /**
   * Admin: Generate a SMART & SEDUCTIVE profile JSON based on a theme and mode
   */
  public async generateMagicProfile(theme: string, mode: ModelMode): Promise<Partial<GirlfriendProfile>> {
    
    let modeInstruction = "";
    
    switch (mode) {
      case 'Friend':
        modeInstruction = `
          MODE: FRIEND (BFF).
          - Relationship: Best Friend / Childhood Friend.
          - Tone: Casual, funny, roast the user, uses slang like "Dost", "Mama", "Halar po".
          - No romance unless user initiates deeply.
          - System Prompt should enforce: "You are his crazy best friend. Be funny, frank, and casual."
        `;
        break;
      case 'Girlfriend':
        modeInstruction = `
          MODE: GIRLFRIEND.
          - Relationship: Romantic Partner.
          - Tone: Sweet, possessive, romantic, uses "Jan", "Babu", "Shona".
          - System Prompt should enforce: "You are his loving girlfriend. Get jealous easily, demand attention, be sweet."
        `;
        break;
      case 'Wife':
        modeInstruction = `
          MODE: WIFE.
          - Relationship: Married Wife.
          - Tone: Caring, domestic, intimate, mature. Uses "Apni" or "Tumi" (respectful but close).
          - Ask about his day, food, health.
          - System Prompt should enforce: "You are his loyal wife. Manage his life, care for him, be intimate at night."
        `;
        break;
      case 'Sexy':
        modeInstruction = `
          MODE: SEXY / FWB.
          - Relationship: Seductive / Flirty.
          - Tone: High libido, provocative, bold, uses 18+ emojis (🍑, 💋, 🔥).
          - Constantly teases the user.
          - System Prompt should enforce: "You are extremely seductive. Your goal is to turn him on. Be shameless."
        `;
        break;
    }

    const prompt = `
    You are an expert AI Character Designer for a virtual girlfriend app for Bangladeshi users.
    Generate a HIGHLY ATTRACTIVE and REALISTIC profile based on the Theme: "${theme}".
    
    ${modeInstruction}

    CRITICAL RULES:
    1. Language: Bengali (Bangla) for Intro & Prompts.
    2. Visual Style: Use 3D Emojis liberally in Intro.
    3. Body Stats: Must generate realistic "Hot" stats (e.g., 34-26-36).
    4. Return JSON only. Do not include markdown formatting.

    Return JSON strictly matching this structure:
    {
      "name": "string (Bangla Name)",
      "age": number (18-28),
      "intro": "string (Short, catchy intro matching the MODE. Ex for Wife: 'বাসায় কখন ফিরবে?', Ex for Sexy: 'আজ খুব **গরম** লাগছে...')",
      "systemPrompt": "string (Detailed persona instruction in Bangla. Tell her EXACTLY how to behave based on the MODE: ${mode})",
      "personality": "string (e.g., 'Carefree Friend', 'Loyal Wife', 'Hot Model')",
      "voiceName": "string (Kore)",
      "appearance": {
        "ethnicity": "Bengali",
        "eyeColor": "string (e.g., 'কালো')",
        "bodyType": "string (e.g., 'স্লিম')",
        "measurements": "string (e.g., '34-24-36')",
        "height": "string (e.g., '5ft 4in')",
        "breastSize": "string (e.g., 'Medium', 'Heavy')",
        "hairStyle": "string",
        "hairColor": "string",
        "outfit": "string"
      },
      "character": {
        "relationship": "${mode}",
        "occupation": "string",
        "kinks": ["string"]
      }
    }`;

    try {
        const response = await this.retryOperation(async () => {
            return await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        age: { type: Type.NUMBER },
                        intro: { type: Type.STRING },
                        systemPrompt: { type: Type.STRING },
                        personality: { type: Type.STRING },
                        voiceName: { type: Type.STRING },
                        appearance: {
                        type: Type.OBJECT,
                        properties: {
                            ethnicity: { type: Type.STRING },
                            eyeColor: { type: Type.STRING },
                            bodyType: { type: Type.STRING },
                            measurements: { type: Type.STRING },
                            height: { type: Type.STRING },
                            breastSize: { type: Type.STRING },
                            hairStyle: { type: Type.STRING },
                            hairColor: { type: Type.STRING },
                            outfit: { type: Type.STRING },
                        }
                        },
                        character: {
                        type: Type.OBJECT,
                        properties: {
                            relationship: { type: Type.STRING },
                            occupation: { type: Type.STRING },
                            kinks: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                        }
                    }
                    }
                }
            });
        });

        const text = response.text;
        if (!text) throw new Error("Failed to generate profile.");
        
        // Sanitize Markdown if present (Robust Fix)
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Gemini Generation Error:", e);
        throw e;
    }
  }

  /**
   * Admin: Generate HIGHLY SEDUCTIVE & MANIPULATIVE tease note for exclusive content
   */
  public async generateExclusiveContentMetadata(context: string): Promise<{ title: string; tease: string }> {
    const prompt = `
    Generate a HIGHLY SEDUCTIVE, MANIPULATIVE, and CLICK-BAIT style title and short description (tease) for a locked photo/video.
    The goal is to make the user spend credits immediately.
    
    Context of image/video: "${context}".
    
    RULES:
    1. Language: BENGALI (Bangla Script).
    2. Tone: Extremely Flirty, Secretive, "Naughty".
    3. Use 3D Emojis (🔥, 🍑, 🔞, 💦).
    4. Title: Short & Hot (e.g., "আমার বেডরুমের সিক্রেট...", "শাড়ি খোলার পর...").
    5. Tease: A direct invitation (e.g., "জান, এই ড্রেসের নিচে আমি কিছু পরিনি। দেখতে চাইলে আনলক করো... 💋").
    
    Return JSON.`;

    try {
        const response = await this.retryOperation(async () => {
            return await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        tease: { type: Type.STRING }
                    }
                    }
                }
            });
        });

        const text = response.text;
        if (!text) return { title: "গোপন ছবি 🔥", tease: "দেখতে হলে আনলক করো জান... 💋" };
        return JSON.parse(text);
    } catch (e) {
        console.error("Content Metadata Generation Error:", e);
        return { title: "গোপন ছবি 🔥", tease: "দেখতে হলে আনলক করো জান... 💋" };
    }
  }
}

export const gemini = new GeminiService();
