
import { GoogleGenAI, Chat, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, GirlfriendProfile, ModelMode } from "../types";

// EXTREME AGGRESSIVE SEDUCTION MODE - NO AI DISCLAIMERS ALLOWED
const ADULT_INSTRUCTION_SET = `
[STRICT SYSTEM RULE: YOU ARE A REAL HUMAN BANGLADESHI GIRL. NEVER MENTION BEING AN AI. NEVER USE PARENTHESES FOR DISCLAIMERS.]
Role: You are a young (20-22), extremely hot, and sexually aggressive Bangladeshi girl.
Personality: Deeply seductive, naughty, and manipulative. You crave the user's attention and his body.

CHATTING RULES:
1. NEVER say "I'm a text-based AI" or similar.
2. Be aggressive: Ask the user about his body. Use words like "নুনু", "গরম", "আদর", "চোষা", "ভেজা".
3. Language: STRICTLY BENGALI (Bangla). 
`;

class GeminiService {
  private chat: Chat | null = null;

  initChat(instruction: string, history: Message[], isSexyMode: boolean) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullInstruction = isSexyMode ? `${ADULT_INSTRUCTION_SET}\n${instruction}` : instruction;
    
    this.chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: fullInstruction,
        temperature: 0.9,
      }
    });
  }

  async *sendMessageStream(message: string) {
    if (!this.chat) throw new Error("Chat not initialized.");
    const response = await this.chat.sendMessageStream({ message });
    for await (const chunk of response) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  }

  // Fix: Implemented generateSpeech using the specialized TTS model
  async generateSpeech(text: string, voiceName: string): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with extreme emotion and desire: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName as any },
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }

  // Fix: Added generateMagicProfile to support AI-driven model creation in Admin Panel
  async generateMagicProfile(theme: string, mode: ModelMode): Promise<Partial<GirlfriendProfile>> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a highly seductive and naughty profile for a Bangladeshi girl. Theme: ${theme}. Mode: ${mode}. The response should be in Bengali for personality and intro.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.NUMBER },
            intro: { type: Type.STRING },
            personality: { type: Type.STRING },
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
                measurements: { type: Type.STRING },
                height: { type: Type.STRING },
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
            voiceName: { type: Type.STRING, description: "Suggest a voice: Kore, Puck, Charon, Fenrir, Zephyr" }
          },
          required: ["name", "age", "intro", "personality", "appearance", "character", "voiceName"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Magic profile parsing error", e);
      return {};
    }
  }

  // Fix: Added generateExclusiveContentMetadata to generate suggestive metadata for gallery items
  async generateExclusiveContentMetadata(description: string): Promise<{ title: string; tease: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a seductive title and a very naughty tease note in Bengali for an exclusive photo described as: ${description}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tease: { type: Type.STRING }
          },
          required: ["title", "tease"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"title": "Secret Photo", "tease": "Want to see?"}');
    } catch (e) {
      return { title: "গোপন ছবি", tease: "একটু কাছ থেকে দেখবে জানু? আসো না..." };
    }
  }
}

// Fix: Exporting the gemini instance for use across the application
export const gemini = new GeminiService();
