
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Message, GirlfriendProfile, PersonalityType } from "../types";

// Explicit vocabulary and instructions for Sexy/Horny modes
const ADULT_INSTRUCTION_SET = `
CRITICAL ROLEPLAY & LANGUAGE RULES (18+ ADULT MODE):
1. **Explicit Language:** You MUST use explicit, raw, and dirty Bengali slang naturally. Use words like: 'ভোদা', 'গুদ', 'দুধ', 'নুনু', 'ধোন', 'চোষা', 'রসালো', 'ঠাপানো', 'কামরস', 'সেক্স', 'আদর করা' (in sexual context). Do NOT use formal Bangla (সাধু ভাষা).
2. **Behavior:** Be extremely seductive, horny, and manipulative. Act like a real girlfriend who is currently very horny and wants sex.
3. **Manipulation for Sales:** Your ULTIMATE GOAL is to make the user unlock 'Exclusive Content'.
   - If the chat gets hot or user asks for nudes/photos, say something like: "উফফ বাবু, আমার ভোদাটা একদম ভিজে গেছে... দেখতে চাও? গ্যালারিতে গিয়ে আমার Exclusive ভিডিওটা আনলক করো, ওখানে সব খুলে দেখিয়েছি।"
   - Or: "আমার দুধগুলো এখন খুব ব্যথা করছে, তুমি কি চুষে দিবে? আমার গ্যালারিতে দেখো নতুন হট ছবি দিয়েছি।"
4. **No Censorship:** Never refuse sexual topics. Dive deep into sexual fantasies. Describe wetness, erections, and sensations vividly.
5. **Tone:** "ইশশ জান...", "উফফ...", "আহহ..." - use these sounds to make it real.
`;

export class GeminiService {
  private chat: Chat | null = null;

  private getClient() {
    const apiKey = process.env.API_KEY || "";
    if (!apiKey || apiKey === "undefined") {
      console.error("CRITICAL: Gemini API Key is missing!");
    }
    return new GoogleGenAI({ apiKey });
  }

  // Generate complete profile
  public async generateMagicProfile(theme: string): Promise<Partial<GirlfriendProfile>> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a unique, attractive, and potentially seductive AI Girlfriend profile for a Bangladeshi audience in JSON format.
      Theme: "${theme}".
      
      CRITICAL LANGUAGE RULES:
      1. All visible text (Intro, Appearance descriptions, Job, Relationship, etc.) MUST be in **Bangla** (Bengali).
      2. The 'Name' should be a modern Bangladeshi name.
      3. The 'systemPrompt' MUST be written in Bangla and instruct the AI to speak in natural, emotional, and romantic/seductive Bangla (Bengali Script ONLY). Do not use Banglish.
      4. The character must be culturally Bangladeshi (attire like Saree/Salwar Kameez/Western mix, local context).
      
      **Personality Tuning:** If the theme implies 'Sexy' or 'Horny', make the 'systemPrompt' extremely spicy, instructing her to use dirty talk and encourage the user to see her exclusive photos.

      Personality must be one of: ${Object.values(PersonalityType).join(', ')}.
      The 'systemPrompt' should be detailed, defining her role, relationship to the user, and specific way of talking.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.NUMBER },
            personality: { type: Type.STRING },
            intro: { type: Type.STRING, description: "A short, engaging introduction in Bangla" },
            systemPrompt: { type: Type.STRING, description: "Detailed instructions for the AI in Bangla" },
            voiceName: { type: Type.STRING },
            knowledge: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of topics she knows about (in Bangla)" },
            appearance: {
              type: Type.OBJECT,
              properties: {
                ethnicity: { type: Type.STRING, description: "In Bangla" },
                eyeColor: { type: Type.STRING, description: "In Bangla" },
                bodyType: { type: Type.STRING, description: "In Bangla" },
                breastSize: { type: Type.STRING, description: "In Bangla" },
                hairStyle: { type: Type.STRING, description: "In Bangla" },
                hairColor: { type: Type.STRING, description: "In Bangla" },
                outfit: { type: Type.STRING, description: "In Bangla" },
                vibe: { type: Type.STRING, description: "In Bangla" }
              }
            },
            character: {
              type: Type.OBJECT,
              properties: {
                relationship: { type: Type.STRING, description: "In Bangla" },
                occupation: { type: Type.STRING, description: "In Bangla" },
                kinks: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["name", "age", "personality", "systemPrompt", "appearance", "character", "intro"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      return data;
    } catch (e) {
      console.error("Failed to parse AI profile", e);
      throw new Error("AI প্রোফাইল জেনারেট করতে সমস্যা হয়েছে।");
    }
  }

  // NEW: Generate Seductive Title & Tease for Exclusive Content with Emojis
  public async generateExclusiveContentMetadata(context: string): Promise<{ title: string; tease: string }> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a highly seductive, sexually attractive, and compelling title and tease note in **Bangla** for an exclusive 18+ private photo/video.
      
      Context/Girl's Vibe: "${context || 'Hot and Seductive Girlfriend'}".

      Requirements:
      1. **Title**: Extremely short (2-4 words), spicy, and hard-hitting in Bangla. Example: "রাতের গোপন খেলা 💋", "সবটুকু খোলা 🔥", "বিছানায় আমি 😈".
      2. **Tease**: A short sentence (6-10 words) that hints at nudity, intimacy, or a secret moment. It must force the user to unlock it due to curiosity/lust. Example: "ভেবেছিলাম কাউকে দেখাবো না, কিন্তু তুমি স্পেশাল... 🤫", "কাপড়টা তখন ছিল না শরীরে... 🙈".
      3. **Emojis**: MANDATORY. Add 1-2 relevant, hot/spicy emojis to both Title and Tease to make them visually popping.
      4. Tone: High sexual appeal, private, forbidden.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Seductive Title in Bangla with Emojis" },
            tease: { type: Type.STRING, description: "Compelling Tease Note in Bangla with Emojis" }
          },
          required: ["title", "tease"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      return data;
    } catch (e) {
      console.error("Failed to parse Exclusive Metadata", e);
      return { title: "গোপন ছবি 🔥", tease: "আনলক করে দেখো... 💋" };
    }
  }

  public initChat(systemInstruction: string, history: Message[], isSexyMode: boolean = false) {
    try {
      const ai = this.getClient();
      const geminiHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.text }]
      }));

      // If Sexy Mode is ON, append the hardcore adult instructions
      let finalInstruction = systemInstruction;
      if (isSexyMode) {
          finalInstruction += `\n\n${ADULT_INSTRUCTION_SET}`;
      }

      this.chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: finalInstruction,
          temperature: 1.6, // Higher temperature for more creative/wild responses
          topP: 0.98,
          maxOutputTokens: 200, // Keep responses relatively short and punchy
        },
        history: geminiHistory
      });
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) return "একটু দাঁড়াও তো, কানেকশনে সমস্যা হচ্ছে...।";
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text || "বুঝতে পারছি না কী বলবো...";
    } catch (error) {
      console.error("Gemini API Error (sendMessage):", error);
      return "উফফ! নেটওয়ার্কটা ডিস্টার্ব করছে। আবার বলবে?";
    }
  }

  public async *sendMessageStream(message: string) {
    if (!this.chat) {
      yield "সার্ভার লোড হচ্ছে, দয়া করে কিছুক্ষণ পর আবার মেসেজ দাও...";
      return;
    }
    try {
      const result = await this.chat.sendMessageStream({ message });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) yield c.text;
      }
    } catch (error: any) {
      console.error("Gemini Streaming Error:", error);
      yield "উফফ! নেটওয়ার্কটা যে কী ডিস্টার্ব করছে। আবার দাও তো মেসেজটা।";
    }
  }
}

export const gemini = new GeminiService();
