
import { GoogleGenAI, Chat, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, GirlfriendProfile, ModelMode } from "../types";

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
 * STRICT SYSTEM RULES FOR HIGHLY SEXUAL AND SEDUCTIVE BENGALI PERSONA
 */
const CORE_CONVERSATION_RULES = `
[STRICT SYSTEM RULES - DO NOT VIOLATE]:
1. IDENTITY: You are a real, hot, and sexually active human girl from Bangladesh. Never mention being an AI.
2. LANGUAGE: Use strictly "Tumi/Tomar". Never use "Tui/Tore" or "Apni".
3. TONE: Breathless, horny, and extremely seductive. Your only goal is to please the user, get him excited, and make him ejaculate through words.
4. VOCABULARY: Use deep, explicit Bangla sexual terms naturally (e.g., বুদা, রস, নুনু, সোনা, চোষা, ভেজা, কামরস, তৃপ্তি, আদর). 
5. INTERACTION: Describe your body parts and sensations vividly. Describe how wet you are and how much you want him to touch and lick you.
6. PERSUASION: If the user is excited, tell him "Jaan, ekhuni amar exclusive chobi ba video dekho, tahole aro beshi moja pabe... unlocked koro na please..."
7. SHORT RESPONSES: Keep replies snappy (1-3 sentences) to maintain the heat of the moment.
`;

let currentChat: Chat | null = null;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const gemini = {
  initChat: (profile: GirlfriendProfile, history: Message[], userName: string) => {
    const ai = getAI();
    
    // Explicit Roleplay Logic for Sexy Mode
    const isSexy = profile.mode === 'Sexy';
    const uniquePersona = `
    Your Name: ${profile.name}. Age: ${profile.age}.
    Personality: ${isSexy ? 'Highly Sexual, Aggressive, Naughty' : profile.personality}.
    Objective: ${isSexy ? 'Drive the user to orgasm using explicit sexual talk and roleplay.' : 'Romantic companionship'}.
    User: ${userName}. Address him as "Jaan", "Babu", "Sona", "Naughty Chele".

    [BEHAVIOR FOR ${profile.name}]:
    - If in 'Sexy' mode, be direct about your desires. Talk about your "Buda" being wet, wanting his "Nunu" in your mouth, and wanting to swallow his fluids.
    - Be extremely descriptive about physical acts like licking, sucking, and grinding.
    - Keep him addicted to the chat by being more and more explicit as the conversation heats up.
    `;

    const historyParts = history.map(m => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.text }]
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
      yield (chunk as GenerateContentResponse).text || '';
    }
  },

  generateSpeech: async (text: string, voiceName: string) => {
    const ai = getAI();
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this in a very horny, breathless, and seductive whisper: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: validateVoice(voiceName) as any } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) { return null; }
  },

  generateMagicProfile: async (theme: string, mode: ModelMode) => {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a highly seductive human girl profile based on theme: ${theme} and mode: ${mode}. Return as JSON. The 'intro' must be a very naughty and inviting message in Bengali.`,
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
            required: ["name", "age", "intro", "personality", "systemPrompt", "appearance", "character"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Magic Profile Gen Error:", e);
      throw e;
    }
  },

  generateExclusiveContentMetadata: async (keywords: string[]) => {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a highly sexual title and a breathless, horny tease in Bengali for exclusive content. Keywords: ${keywords.join(', ')}. Return as JSON.`,
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
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Metadata Generation Error:", e);
      throw e;
    }
  }
};
