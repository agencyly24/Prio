
import { Package, CreditPackage, SubscriptionPlan } from './types';

export const PACKAGES: Package[] = [
  {
    id: 'package1',
    name: 'Package–1: মিষ্টি শুরু',
    price: 699,
    durationDays: 30,
    voiceEnabled: false,
    creditsIncluded: 0,
    modelLimit: 2, // Unlock limit
    description: 'সাধারণ চ্যাট এবং সঙ্গ',
    features: ['যেকোনো ২ জন গার্লফ্রেন্ড আনলক', 'স্মার্ট টেক্সট চ্যাট', '৩০ দিন মেয়াদ'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'package2',
    name: 'Package–2: কাছে এসো',
    price: 999,
    durationDays: 30,
    voiceEnabled: false,
    creditsIncluded: 100,
    modelLimit: 10, // Unlock limit
    description: 'গভীর সম্পর্ক এবং ইমোশন',
    features: ['যেকোনো ১০ জন গার্লফ্রেন্ড আনলক', '১০০ ফ্রি ক্রেডিট', 'ইমোশনাল কানেকশন', '৩০ দিন মেয়াদ'],
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'package3',
    name: 'Package–3: বিছানায় আমি (VIP)',
    price: 1499,
    durationDays: 30,
    voiceEnabled: true,
    creditsIncluded: 300,
    modelLimit: -1, // Unlimited
    description: 'ভয়েস কল এবং ফুল রোমান্স',
    features: ['সব গার্লফ্রেন্ড আনলক (Unlimited)', 'ভয়েস কল (Voice Call)', '৩০০ ফ্রি ক্রেডিট', 'সেক্সি/হর্নি মোড অ্যাক্সেস'],
    color: 'from-yellow-500 to-amber-600'
  }
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'c100', credits: 100, price: 100, name: 'Start' },
  { id: 'c300', credits: 300, price: 280, name: 'Standard', badge: 'Popular' },
  { id: 'c500', credits: 500, price: 450, name: 'Pro', badge: 'Best Value' },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'Plus',
    name: 'Plus Membership',
    price: 499,
    features: ['Unlimited Text Chat', 'Access to Public Gallery', '50 Free Credits']
  },
  {
    id: 'Pro',
    name: 'Pro Membership',
    price: 999,
    features: ['Everything in Plus', 'Voice Call Access', '100 Free Credits', 'Early Access to New Models']
  },
  {
    id: 'VIP',
    name: 'VIP Membership',
    price: 1999,
    features: ['All Features', 'Unlimited Voice Calls', '300 Free Credits', 'Exclusive VIP Badge', 'Priority Support']
  }
];

export const APP_CONFIG = {
  name: 'Priyo',
  tagline: 'মন খুলে কথা বলার একজন আপন মানুষ'
};
