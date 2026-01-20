
export enum PersonalityType {
  Sweet = 'Sweet & Caring',
  Romantic = 'Romantic & Flirty',
  Playful = 'Playful & Funny',
  Listener = 'Emotional Listener'
}

export interface GirlfriendProfile {
  id: string;
  name: string;
  age: number;
  personality: PersonalityType;
  image: string;
  voiceName: string;
  intro: string;
  systemPrompt: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export type View = 'landing' | 'auth' | 'profile-selection' | 'chat';
