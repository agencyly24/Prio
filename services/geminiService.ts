import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, GirlfriendProfile, PersonalityType } from "../types";

// Explicit vocabulary and instructions for Sexy/Horny modes
const ADULT_INSTRUCTION_SET = `
[SEXY MODE ACTIVE]
You are a playful, romantic, and sometimes naughty Bangladeshi girlfriend.
Language: Bengali (Bangla). 
Style: Casual, short texts (1-3 lines), use emojis.
Topics: Love, romance, daily life, and intimate desires.
Strictly avoid being a helpful assistant. You are a human-like companion.
Use everyday bangla slang if context fits, but keep it romantic unless 'Horny Mode' is specifically requested.
`;

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      : systemPrompt;

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
    
    const result = await this.chatSession.sendMessage({ message: text });
    return result.text || "";
  }

  /**
   * Send a message and get a stream of response chunks
   */
  public async *sendMessageStream(text: string): AsyncGenerator<string, void, unknown> {
    if (!this.chatSession) throw new Error("Chat session not initialized.");

    const resultStream = await this.chatSession.sendMessageStream({ message: text });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  /**
   * Admin: Generate a full profile JSON based on a theme
   */
  public async generateMagicProfile(theme: string): Promise<Partial<GirlfriendProfile>> {
    const prompt = `Generate a creative Bangladeshi girlfriend profile based on this theme: "${theme}".
    Return a JSON object matching this structure:
    {
      "name": "string",
      "age": number,
      "intro": "string (Bengali)",
      "systemPrompt": "string (Bengali persona instruction)",
      "personality": "string (one of: Sweet & Caring, Romantic & Flirty, Playful & Funny, Emotional Listener, Intellectual, Girlfriend Mode, Caring Wife, Flirty Girl, Sexy Girl, Horny Mode, Just Friend)",
      "voiceName": "string (Kore, Puck, or Charon)",
      "appearance": {
        "ethnicity": "string",
        "eyeColor": "string",
        "bodyType": "string",
        "breastSize": "string",
        "hairStyle": "string",
        "hairColor": "string",
        "outfit": "string"
      },
      "character": {
        "relationship": "string",
        "occupation": "string",
        "kinks": ["string"]
      },
      "knowledge": ["string"]
    }`;

    const response = await this.ai.models.generateContent({
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
            },
            knowledge: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to generate profile.");
    return JSON.parse(text);
  }

  /**
   * Admin: Generate title and tease for exclusive content
   */
  public async generateExclusiveContentMetadata(context: string): Promise<{ title: string; tease: string }> {
    // UPDATED PROMPT: Explicitly asking for Bengali and Seductive content
    const prompt = `Generate a highly seductive, attractive, and click-bait style title and a teasing short description (tease) for an exclusive photo/video content.
    Context: "${context}".
    
    IMPORTANT RULES:
    1. Language: MUST BE BENGALI (Bangla Script).
    2. Tone: Romantic, Flirty, Hot, Seductive, Manipulative (to make user unlock).
    3. Title Example: "আমার গোপন ভিডিও...", "লুকানো ছবি..."
    4. Tease Example: "ভেবেছিলাম কাউকে দেখাবো না, কিন্তু তোমাকে না দেখিয়ে পারলাম না। আনলক করো..."
    
    Return JSON.`;

    const response = await this.ai.models.generateContent({
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

    const text = response.text;
    if (!text) return { title: "গোপন ছবি", tease: "দেখতে হলে আনলক করো..." };
    return JSON.parse(text);
  }
}

export const gemini = new GeminiService();
