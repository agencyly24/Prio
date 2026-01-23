
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { GirlfriendProfile, PaymentRequest, ReferralProfile, ReferralTransaction } from "../types";

// Collection: 'app_data'
// Documents: 'profiles', 'payment_requests', 'referrals', 'referral_transactions'

export const cloudStore = {
  // Save all profiles to Firestore
  async saveProfiles(profiles: GirlfriendProfile[]) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'app_data', 'profiles'), { 
        data: profiles, 
        updated_at: new Date().toISOString() 
      });
      console.log("✅ Profiles synced to Firebase");
    } catch (e: any) {
      console.error("❌ Failed to save profiles to Firebase:", e.message);
      throw e; 
    }
  },

  // Load profiles from Firestore
  async loadProfiles(): Promise<GirlfriendProfile[] | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_data', 'profiles'));
      if (docSnap.exists()) {
        console.log("📥 Loaded profiles from Firebase");
        return docSnap.data().data as GirlfriendProfile[];
      }
    } catch (e: any) {
      console.error("❌ Failed to load profiles from Firebase:", e.message);
    }
    return null;
  },

  // Save Payment Requests to Firestore
  async savePaymentRequests(requests: PaymentRequest[]) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'app_data', 'payment_requests'), { 
        data: requests, 
        updated_at: new Date().toISOString() 
      });
      console.log("✅ Payment requests synced to Firebase");
    } catch (e: any) {
      console.error("❌ Failed to save payment requests to Firebase:", e.message);
    }
  },

  // Load Payment Requests from Firestore
  async loadPaymentRequests(): Promise<PaymentRequest[] | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_data', 'payment_requests'));
      if (docSnap.exists()) {
        console.log("📥 Loaded payment requests from Firebase");
        return docSnap.data().data as PaymentRequest[];
      }
    } catch (e: any) {
      console.warn("ℹ️ No cloud payment requests found in Firebase.", e.message);
    }
    return null;
  },

  // Save Referral Profiles to Firestore
  async saveReferrals(referrals: ReferralProfile[]) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'app_data', 'referrals'), { 
        data: referrals, 
        updated_at: new Date().toISOString() 
      });
      console.log("✅ Referrals synced to Firebase");
    } catch (e: any) {
      console.error("❌ Failed to save referrals to Firebase:", e.message);
    }
  },

  // Load Referral Profiles from Firestore
  async loadReferrals(): Promise<ReferralProfile[] | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_data', 'referrals'));
      if (docSnap.exists()) {
        console.log("📥 Loaded referrals from Firebase");
        return docSnap.data().data as ReferralProfile[];
      }
    } catch (e: any) {
      console.warn("ℹ️ No cloud referrals found in Firebase.", e.message);
    }
    return null;
  },

  // Save Referral Transactions to Firestore
  async saveReferralTransactions(transactions: ReferralTransaction[]) {
    if (!db) return;
    try {
      await setDoc(doc(db, 'app_data', 'referral_transactions'), { 
        data: transactions, 
        updated_at: new Date().toISOString() 
      });
      console.log("✅ Referral transactions synced to Firebase");
    } catch (e: any) {
      console.error("❌ Failed to save referral transactions to Firebase:", e.message);
    }
  },

  // Load Referral Transactions from Firestore
  async loadReferralTransactions(): Promise<ReferralTransaction[] | null> {
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_data', 'referral_transactions'));
      if (docSnap.exists()) {
        console.log("📥 Loaded referral transactions from Firebase");
        return docSnap.data().data as ReferralTransaction[];
      }
    } catch (e: any) {
      console.warn("ℹ️ No cloud referral transactions found in Firebase.", e.message);
    }
    return null;
  }
};
