
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public initChat(systemInstruction: string) {
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        temperature: 0.9,
        topP: 0.95,
      },
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) throw new Error("Chat not initialized");
    const response = await this.chat.sendMessage({ message });
    return response.text || "দুঃখিত, আমি বুঝতে পারিনি।";
  }

  public async *sendMessageStream(message: string) {
    if (!this.chat) throw new Error("Chat not initialized");
    const result = await this.chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text;
    }
  }

  // Voice logic placeholder for integration in the components
  public getLiveConnection(config: any) {
    return this.ai.live.connect(config);
  }
}

export const gemini = new GeminiService();
