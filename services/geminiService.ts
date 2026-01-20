
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private chat: Chat | null = null;

  private getClient() {
    // Rely on environment variable as per instructions
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Check environment variables.");
    }
    return new GoogleGenAI({ apiKey });
  }

  public initChat(systemInstruction: string) {
    try {
      const ai = this.getClient();
      this.chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          temperature: 1.0,
          topP: 0.95,
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) return "সার্ভার লোড হচ্ছে, দয়া করে একটু অপেক্ষা করুন।";
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text || "দুঃখিত, আমি বুঝতে পারিনি।";
    } catch (error) {
      console.error("Error sending message:", error);
      return "কানেকশনে সমস্যা হচ্ছে। দয়া করে আবার চেষ্টা করো।";
    }
  }

  public async *sendMessageStream(message: string) {
    if (!this.chat) {
      yield "সার্ভার লোড হচ্ছে...";
      return;
    }
    try {
      const result = await this.chat.sendMessageStream({ message });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) yield c.text;
      }
    } catch (error) {
      console.error("Streaming error:", error);
      yield "দুঃখিত, কিছু একটা ভুল হয়েছে।";
    }
  }

  public async connectLive(config: any) {
    const ai = this.getClient();
    return ai.live.connect(config);
  }
}

export const gemini = new GeminiService();
