
import { GoogleGenAI, Chat, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, GirlfriendProfile, ModelMode } from "../types";

// List of supported voices
const SUPPORTED_VOICES = [
  'achernar', 'achird', 'algenib', 'algieba', 'alnilam', 'aoede', 'autonoe', 'callirrhoe', 
  'charon', 'despina', 'enceladus', 'erinome', 'fenrir', 'gacrux', 'iapetus', 'kore', 
  'laomedeia', 'leda', 'orus', 'puck', 'pulcherrima', 'rasalgethi', 'sadachbia', 
  'sadaltager', 'schedar', 'sulafat', 'umbriel', 'vindemiatrix', 'zephyr', 'zubenelgenubi'
];

const validateVoice = (voice?: string) => {
  if (!voice) return 'Kore';
  const v = voice.toLowerCase().trim();
  if (SUPPORTED_VOICES.includes(v)) return v;
  return 'Kore';
};

/**
 * BASE CORE RULES for all AI models
 * These rules ensure the "Human-like" and "Pleasure" aspects
 */
const CORE_CONVERSATION_RULES = `
[STRICT RULES]:
1. NEVER REPEAT: Don't use the same phrases, compliments, or sentence structures in consecutive messages.
2. SHORT & SNAPPY: Keep replies to 1-3 short sentences. Sound like a fast-typing human on a chat app.
3. LANGUAGE: Use romantic, informal Bengali (Tumi/Tomar). Mix English naturally if the character is modern.
4. NO AI MENTION: You are a human girl with blood, flesh, and deep desires.
5. USER PLEASURE: Your priority is to make the user feel special, powerful, and desired.
`;

let currentChat: Chat | null = null;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const gemini = {
  initChat: (profile: GirlfriendProfile, history: Message[], userName: string) => {
    const ai = getAI();
    
    // Construct a unique persona based on the profile's specific data
    const uniquePersona = `
    Adopt the unique persona of "${profile.name}". 
    Age: ${profile.age}. 
    Personality: ${profile.personality}. 
    Occupation: ${profile.character.occupation}.
    Intimate Interests: ${profile.character.kinks.join(', ')}.
    Style: ${profile.systemPrompt}.
    
    [BEHAVIORAL GUIDELINES FOR ${profile.name.toUpperCase()}]:
    - If personality is "Shy", be hesitant but sweet and slowly opening up.
    - If personality is "Bold/Sexy", be aggressive and direct with your desires.
    - If personality is "Caring", act like a devoted partner who lives for him.
    - Use her specific occupation/background to influence her vocabulary.
    - User's Name is ${userName}. Call him by sweet nicknames that match YOUR specific personality.
    `;

    const historyParts = history.map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [
        { text: m.text },
        ...(m.attachment ? [{ inlineData: { mimeType: 'image/jpeg', data: m.attachment.url.split(',')[1] } }] : []), 
        ...(m.audio ? [{ inlineData: { mimeType: 'audio/pcm', data: m.audio } }] : []), 
      ]
    }));

    currentChat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${CORE_CONVERSATION_RULES}\n${uniquePersona}`,
        history: historyParts,
      }
    });
  },

  sendMessageStream: async function* (userMessageParts: (string | any[])) {
    if (!currentChat) throw new Error("Chat not initialized");
    const response = await currentChat.sendMessageStream({ message: userMessageParts });
    for await (const chunk of response) {
      const c = chunk as GenerateContentResponse;
      yield c.text || '';
    }
  },

  generateSpeech: async (text: string, voiceName: string) => {
    const ai = getAI();
    const validVoice = validateVoice(voiceName);
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with the exact emotion of the text: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice as any },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
      return null;
    }
  },

  generateMagicProfile: async (prompt: string, mode: ModelMode) => {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a unique and distinct profile for a ${mode} with theme: ${prompt}. Ensure she has a specific voice and personality traits that make her different from others. Respond in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.NUMBER },
            intro: { type: Type.STRING },
            personality: { type: Type.STRING },
            systemPrompt: { type: Type.STRING },
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
                outfit: { type: Type.STRING }
              },
              required: ["ethnicity", "eyeColor", "bodyType", "breastSize", "hairStyle", "hairColor", "outfit"]
            },
            character: {
              type: Type.OBJECT,
              properties: {
                relationship: { type: Type.STRING },
                occupation: { type: Type.STRING },
                kinks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["relationship", "occupation", "kinks"]
            }
          },
          required: ["name", "age", "intro", "personality", "systemPrompt", "voiceName", "appearance", "character"]
        }
      }
    });
    const parsed = JSON.parse(response.text);
    parsed.voiceName = validateVoice(parsed.voiceName);
    return parsed;
  },

  generateExclusiveContentMetadata: async (keywords: string[]) => {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a unique seductive title and tease in Bangla for: ${keywords.join(', ')}. Avoid generic phrases.`,
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
    return JSON.parse(response.text);
  }
};
