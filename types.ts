
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'free' | 'active';

export interface Package {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  voiceEnabled: boolean;
  creditsIncluded: number;
  modelLimit: number; // New field: 2, 10, or -1 (unlimited)
  description: string;
  features: string[];
  color: string;
}

export type SubscriptionTier = 'Free' | 'Plus' | 'Pro' | 'VIP';

export interface UserProfile {
  uid: string;
  id?: string; // Compatibility
  email: string;
  name: string;
  photoURL: string;
  avatar?: string; // Compatibility
  role: UserRole;
  status: UserStatus;
  isAdmin?: boolean; // Helper
  
  // Subscription
  packageId: string | null;
  packageStart: Timestamp | null;
  packageEnd: Timestamp | null;
  isPremium?: boolean; // Helper
  subscriptionExpiry?: string | Date; // Helper
  tier?: SubscriptionTier; // Helper
  
  // Economy
  credits: number;
  unlockedModels: string[]; // Array of modelIds
  unlockedContent: string[]; // Array of exclusiveContent IDs
  unlockedContentIds?: string[]; // Helper/Alias
  
  // Referral (User to User)
  referralCode: string;
  referredBy: string | null; // UID of referrer
  referralEarnings: number;
  referralsCount?: number;
  
  // Legacy config (can be ignored now for influencers)
  influencerConfig?: any;
  
  joinedDate: Timestamp;
}

// Standalone Influencer Type
export interface Influencer {
  id?: string;
  name: string;
  code: string;
  commissionRate: number; // Percentage
  discountAmount: number; // Taka
  paymentMethod: string;
  paymentNumber: string;
  earnings: number;
  totalSales: number;
  totalPaid?: number; // Total amount paid out lifetime
  isActive: boolean;
}

// Log for Influencer Payouts
export interface InfluencerPayout {
  id: string;
  influencerId: string;
  influencerName: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  paymentNumber: string;
}

export interface Purchase {
  id: string;
  uid: string;
  userName: string;
  type: 'package' | 'credits' | 'subscription';
  itemId?: string; // packageId or creditPackageId
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string; // 'bkash'
  transactionId: string;
  bkashNumber: string;
  createdAt: string; // ISO String
  approvedAt?: string;
  tier?: string;
  creditPackageId?: string;
  referralCodeUsed?: string;
}

// PaymentRequest type used in AdminPanel and Purchase Modals
export interface PaymentRequest {
  id: string;
  userId?: string;
  uid?: string;
  userName?: string;
  type: 'package' | 'credits' | 'subscription';
  tier?: string;
  creditPackageId?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  bkashNumber: string;
  trxId: string; // Alias for transactionId
  timestamp: string; // Alias for createdAt
  referralCodeUsed?: string;
  discountApplied?: number;
  referrerId?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'Bkash' | 'Nagad';
  number: string;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: string;
  paidAt?: string;
}

export interface ModelExclusiveContent {
  id: string;
  type: 'image' | 'video';
  url: string;
  creditCost: number;
  title: string;
  shortNote: string;
}

export interface ProfileGalleryItem {
  id: string; // Changed to required
  type: 'image' | 'video';
  url: string;
  isExclusive?: boolean;
  creditCost?: number;
  title?: string;
  tease?: string; // Seductive note
}

export type ModelMode = 'Friend' | 'Girlfriend' | 'Wife' | 'Sexy';

export interface GirlfriendProfile {
  id: string;
  name: string;
  age: number;
  intro: string;
  image: string; // Primary avatar
  mode: ModelMode; // Friend, Girlfriend, Wife, Sexy
  personality: string;
  systemPrompt: string;
  voiceName: string;
  
  appearance: {
    ethnicity: string;
    eyeColor: string;
    bodyType: string;
    measurements?: string; // e.g. 34-24-36
    height?: string;
    breastSize: string;
    hairStyle: string;
    hairColor: string;
    outfit: string;
  };
  character: {
    relationship: string;
    occupation: string;
    kinks: string[];
  };
  
  gallery: ProfileGalleryItem[];
  
  // Compatibility fields for legacy Model type
  type?: string; 
  description?: string;
  avatarImage?: string;
  galleryImages?: string[];
  exclusiveContent?: ModelExclusiveContent[];
  voiceEnabled?: boolean; 
  active?: boolean;
  introMessage?: string;
}

export type Model = GirlfriendProfile;
export type PersonalityType = string;

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'model';
  text: string;
  timestamp: Date | string;
  attachment?: {
    type: 'image';
    url: string;
  };
}

export interface ReferralData {
  id: string; // usually same as user UID
  code: string;
  uid: string;
  referredUsers: string[];
  commissionEarned: number;
}

export type ViewState = 
  | 'landing' 
  | 'auth' 
  | 'dashboard' 
  | 'model-view' 
  | 'admin' 
  | 'profile' 
  | 'packages'
  | 'chat'
  | 'subscription'
  | 'profile-selection'
  | 'account'
  | 'admin-panel';

export type View = ViewState;

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  name: string;
  badge?: string;
}
