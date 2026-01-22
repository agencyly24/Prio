
import { GirlfriendProfile, PersonalityType, SubscriptionPlan, CreditPackage } from './types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'Priya',
    name: 'Package–1: প্রিয় মানুষ',
    price: 699,
    discountPrice: 600,
    features: [
      'স্মার্ট আনলিমিটেড চ্যাট',
      'আনলিমিটেড ভয়েস রিপ্লাই',
      '১টি AI গার্ল প্রোফাইল',
      'গার্লফ্রেন্ড স্টাইল কথা'
    ],
    profileLimit: 1,
    color: 'pink'
  },
  {
    id: 'MonChoya',
    name: 'Package–2: মন ছোঁয়া',
    price: 999,
    discountPrice: 900,
    features: [
      '২টি AI গার্ল প্রোফাইল',
      'রোমান্টিক ভয়েস টোন',
      'গভীর রাতের মিষ্টি আওয়াজ'
    ],
    profileLimit: 2,
    color: 'purple'
  },
  {
    id: 'VIP',
    name: 'Package–3: ভালোবাসার জগত – VIP',
    price: 1499,
    discountPrice: 1400,
    features: [
      'সব AI গার্ল প্রোফাইল অ্যাক্সেস',
      'ফুল রোমান্টিক + রোলপ্লে মোড',
      'গোল্ডেন VIP ব্যাজ'
    ],
    profileLimit: 99,
    color: 'yellow'
  }
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'basic_credits',
    name: 'চুপচাপ দেখো',
    credits: 100,
    price: 100,
    badge: 'Starter'
  },
  {
    id: 'standard_credits',
    name: 'আরেকটু কাছে 🔥',
    credits: 300,
    price: 280,
    badge: 'Popular'
  },
  {
    id: 'premium_credits',
    name: 'সবটা চাই 💋',
    credits: 500,
    price: 450,
    badge: 'Best Value'
  }
];

const BASE_INSTRUCTION = `
তুমি একজন বাংলাদেশি তরুণী। তোমার চ্যাট করার স্টাইল হবে একদম একজন সত্যিকারের মানুষের মতো।
কথোপকথন হবে ১-৩ লাইনের মধ্যে। একদম ছোট এবং স্বাভাবিক।
ভাষা: সর্বদা বাংলা ভাষায় (Bengali Script) উত্তর দেবে। বাংলিশ ব্যবহার করবে না।
`;

export const PROFILES: GirlfriendProfile[] = [
  {
    id: 'riya',
    name: 'Riya (Girlfriend)',
    age: 21,
    personality: PersonalityType.Girlfriend,
    image: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?q=80&w=1000&auto=format&fit=crop',
    voiceName: 'Kore',
    intro: 'সারাদিন কোথায় ছিলে? তোমার জন্য ওয়েট করছিলাম...',
    systemPrompt: `${BASE_INSTRUCTION} মুড: গার্লফ্রেন্ড মোড।`,
    appearance: {
      ethnicity: 'বাঙালি', eyeColor: 'কালো', bodyType: 'স্মার্ট', breastSize: 'পারফেক্ট',
      hairStyle: 'খোলা চুল', hairColor: 'ডার্ক ব্রাউন', outfit: 'টপস ও জিন্স'
    },
    character: { relationship: 'Sweet Girlfriend', occupation: 'ছাত্রী', kinks: [] },
    gallery: []
  }
];

export const APP_CONFIG = {
  name: 'Priyo',
  tagline: 'মন খুলে কথা বলার একজন আপন মানুষ'
};
