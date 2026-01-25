
import { db } from "./firebase";
import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp, increment, Timestamp, orderBy, limit 
} from "firebase/firestore";
import { UserProfile, Purchase, Model, Package, PaymentRequest, GirlfriendProfile, Influencer, WithdrawalRequest, InfluencerPayout } from "../types";
import { PACKAGES } from "../constants";

const COLLECTIONS = {
  USERS: 'users',
  MODELS: 'models',
  PACKAGES: 'packages',
  PURCHASES: 'purchases',
  INFLUENCERS: 'influencers',
  INFLUENCER_PAYOUTS: 'influencer_payouts',
  WITHDRAWALS: 'withdrawals' 
};

export const cloudStore = {
  // --- USER MANAGEMENT ---
  async initializeUser(uid: string, email: string, name: string, photoURL: string): Promise<UserProfile> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(userRef);

    let userData: UserProfile;

    if (snap.exists()) {
      userData = snap.data() as UserProfile;
      // Check expiration
      if (userData.status === 'active' && userData.packageEnd) {
        if (new Date() > userData.packageEnd.toDate()) {
          // EXPIRED: Downgrade and LOCK models
          await updateDoc(userRef, {
            status: 'free',
            packageId: null,
            packageStart: null,
            packageEnd: null,
            unlockedModels: [] // Clear unlocked models on expiration
          });
          userData.status = 'free'; // local update
          userData.packageId = null;
          userData.unlockedModels = [];
        }
      }
    } else {
      // New User
      const cleanName = (name || 'User').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const referralCode = `${cleanName}${randomDigits}`;

      let referredBy = null;
      const storedRef = localStorage.getItem('priyo_ref_code');
      // We store the ref code even if it's an influencer code, handled in approval
      if (storedRef) {
         // Check if it's a user referrer just to link uid, otherwise we link code
        const q = query(collection(db, COLLECTIONS.USERS), where('referralCode', '==', storedRef));
        const refSnap = await getDocs(q);
        if (!refSnap.empty) {
          referredBy = refSnap.docs[0].id;
        }
      }

      userData = {
        uid, email, name, photoURL,
        role: email === 'admin@priyo.com' ? 'admin' : 'user',
        status: 'free',
        packageId: null, packageStart: null, packageEnd: null,
        credits: 0,
        unlockedModels: [], unlockedContent: [],
        referralCode,
        referredBy,
        referralEarnings: 0,
        referralsCount: 0,
        joinedDate: Timestamp.now()
      };

      await setDoc(userRef, userData);
    }
    
    return {
      ...userData,
      id: uid,
      avatar: userData.photoURL || photoURL,
      unlockedModels: userData.unlockedModels || [],
      unlockedContent: userData.unlockedContent || [],
      unlockedContentIds: userData.unlockedContent || [],
      isPremium: userData.status === 'active',
      tier: userData.packageId === 'package3' ? 'VIP' : (userData.status === 'active' ? 'Plus' : 'Free'),
      isAdmin: userData.role === 'admin'
    };
  },

  async getUserByReferralCode(code: string): Promise<UserProfile | null> {
    const q = query(collection(db, COLLECTIONS.USERS), where('referralCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id } as UserProfile;
  },

  // --- STANDALONE INFLUENCER MANAGEMENT ---
  
  async createInfluencer(data: Partial<Influencer>) {
      const id = `inf_${Date.now()}`;
      await setDoc(doc(db, COLLECTIONS.INFLUENCERS, id), {
          ...data,
          id,
          earnings: 0,
          totalSales: 0,
          totalPaid: 0,
          isActive: true
      });
  },

  async updateInfluencer(id: string, data: Partial<Influencer>) {
      await updateDoc(doc(db, COLLECTIONS.INFLUENCERS, id), data);
  },

  async deleteInfluencer(id: string) {
      await deleteDoc(doc(db, COLLECTIONS.INFLUENCERS, id));
  },

  async getAllInfluencers(): Promise<Influencer[]> {
      const snap = await getDocs(collection(db, COLLECTIONS.INFLUENCERS));
      // Robust mapping: ensure ID comes from doc.id if missing in data
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Influencer));
  },

  async getInfluencerByCode(code: string): Promise<Influencer | null> {
      const q = query(collection(db, COLLECTIONS.INFLUENCERS), where('code', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { ...snap.docs[0].data(), id: snap.docs[0].id } as Influencer;
  },

  // VIP Influencer Payout Function
  async payoutInfluencer(influencer: Influencer) {
      if (!influencer.id) throw new Error("Influencer ID missing");
      const currentEarnings = Number(influencer.earnings);
      
      if (currentEarnings <= 0) return; // Guard clause if 0 or negative

      const payoutId = `pay_${Date.now()}`;
      const payout: InfluencerPayout = {
          id: payoutId,
          influencerId: influencer.id,
          influencerName: influencer.name,
          amount: currentEarnings,
          paidAt: new Date().toISOString(),
          paymentMethod: influencer.paymentMethod,
          paymentNumber: influencer.paymentNumber
      };

      // 1. Log the payout
      await setDoc(doc(db, COLLECTIONS.INFLUENCER_PAYOUTS, payoutId), payout);

      // 2. Update Influencer: Reset earnings to 0, Increment totalPaid
      await updateDoc(doc(db, COLLECTIONS.INFLUENCERS, influencer.id), {
          earnings: 0,
          totalPaid: increment(currentEarnings)
      });
  },

  async resetInfluencerEarnings(id: string) {
      // Deprecated, use payoutInfluencer instead, keeping for legacy safety
      await updateDoc(doc(db, COLLECTIONS.INFLUENCERS, id), { earnings: 0 });
  },

  // --- ADMIN ---
  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.USERS));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
  },

  async updateUser(userId: string, data: Partial<UserProfile>) {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), data);
  },
  
  async deleteUser(userId: string) {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  },

  // Restored: For regular users
  async resetUserReferralEarnings(userId: string) {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      referralEarnings: 0
    });
  },

  // --- WITHDRAWALS (NEW) ---
  
  async createWithdrawalRequest(req: WithdrawalRequest) {
      await setDoc(doc(db, COLLECTIONS.WITHDRAWALS, req.id), req);
  },

  async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
      const q = query(collection(db, COLLECTIONS.WITHDRAWALS), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as WithdrawalRequest).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async approveWithdrawal(req: WithdrawalRequest) {
      // 1. Mark Request as Paid
      await updateDoc(doc(db, COLLECTIONS.WITHDRAWALS, req.id), {
          status: 'paid',
          paidAt: new Date().toISOString()
      });

      // 2. Deduct from User Earnings
      const userRef = doc(db, COLLECTIONS.USERS, req.userId);
      // NOTE: We decrement earnings because we paid them out.
      await updateDoc(userRef, {
          referralEarnings: increment(-req.amount)
      });
  },

  // --- PACKAGES & MODELS ---
  async getPackages(): Promise<Package[]> {
    return PACKAGES;
  },

  async getModels(): Promise<Model[]> {
    const q = query(collection(db, COLLECTIONS.MODELS));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Model);
  },

  async loadModels(): Promise<GirlfriendProfile[]> {
    const q = query(collection(db, COLLECTIONS.MODELS));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GirlfriendProfile);
  },

  async saveModel(model: Model) {
    await setDoc(doc(db, COLLECTIONS.MODELS, model.id), model);
  },

  // --- MODEL UNLOCKING ---
  async unlockModelSlot(uid: string, modelId: string): Promise<{success: boolean, message?: string}> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, message: 'User not found' };

    const userData = userSnap.data() as UserProfile;
    
    // Check Status
    if (userData.status !== 'active' || !userData.packageId) {
      return { success: false, message: 'No active subscription' };
    }

    // Check if already unlocked
    const currentUnlocked = userData.unlockedModels || [];
    if (currentUnlocked.includes(modelId)) {
      return { success: true }; // Already unlocked
    }

    // Get Package Limits
    const pkg = PACKAGES.find(p => p.id === userData.packageId);
    if (!pkg) return { success: false, message: 'Invalid package' };

    const limit = pkg.modelLimit;
    
    // Check Limit (-1 is unlimited)
    if (limit !== -1 && currentUnlocked.length >= limit) {
      return { success: false, message: 'Limit Reached' };
    }

    // Unlock
    await updateDoc(userRef, {
      unlockedModels: [...currentUnlocked, modelId]
    });

    return { success: true };
  },

  // --- PURCHASES ---
  async createPurchase(purchase: Purchase) {
    await setDoc(doc(db, COLLECTIONS.PURCHASES, purchase.id), purchase);
  },

  async getPendingPurchases(): Promise<Purchase[]> {
    const q = query(collection(db, COLLECTIONS.PURCHASES), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Purchase).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async loadPendingPayments(): Promise<PaymentRequest[]> {
    const purchases = await this.getPendingPurchases();
    return purchases.map(p => ({
        id: p.id,
        userId: p.uid,
        userName: p.userName,
        type: p.type,
        amount: p.amount,
        status: p.status,
        bkashNumber: p.bkashNumber,
        trxId: p.transactionId,
        timestamp: p.createdAt,
        tier: p.tier,
        referralCodeUsed: p.referralCodeUsed,
        creditPackageId: p.creditPackageId
    } as PaymentRequest));
  },

  async approvePurchase(purchaseId: string) {
    const pRef = doc(db, COLLECTIONS.PURCHASES, purchaseId);
    const pSnap = await getDoc(pRef);
    if (!pSnap.exists()) return;
    
    const purchase = pSnap.data() as Purchase;
    if (purchase.status !== 'pending') return;

    const userRef = doc(db, COLLECTIONS.USERS, purchase.uid);

    // 1. Update Purchase Status
    await updateDoc(pRef, { status: 'approved', approvedAt: new Date().toISOString() });

    // 2. Grant Benefits to Buyer
    if (purchase.type === 'package') {
      const pkg = PACKAGES.find(p => p.id === purchase.itemId);
      if (pkg) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.durationDays);

        await updateDoc(userRef, {
          status: 'active',
          packageId: pkg.id,
          packageStart: Timestamp.fromDate(startDate),
          packageEnd: Timestamp.fromDate(endDate),
          credits: increment(pkg.creditsIncluded),
        });
      }
    } else if (purchase.type === 'credits') {
      await updateDoc(userRef, {
        credits: increment(purchase.amount)
      });
    } else if (purchase.type === 'subscription') {
       // Legacy fallback
       await updateDoc(userRef, {
          status: 'active',
          packageId: purchase.itemId || 'package_sub',
          credits: increment(purchase.amount === 1999 ? 300 : purchase.amount === 999 ? 100 : 50)
        });
    }

    // 3. COMMISSION LOGIC (Priority: Independent Influencer -> then User Referral)
    if (purchase.referralCodeUsed) {
        
        // A. Check Independent Influencer List First
        const influencer = await this.getInfluencerByCode(purchase.referralCodeUsed);
        
        if (influencer) {
            // Found a Pro Influencer
            const commission = Math.floor(purchase.amount * (influencer.commissionRate / 100));
            await updateDoc(doc(db, COLLECTIONS.INFLUENCERS, influencer.id!), {
                earnings: increment(commission),
                totalSales: increment(1)
            });
            console.log(`Commission of ${commission} added to Influencer ${influencer.name}`);
        } else {
            // B. Fallback to User-to-User Referral
            const refUser = await this.getUserByReferralCode(purchase.referralCodeUsed);
            if (refUser) {
                 // UPDATED: 10% commission for regular users
                 const commission = Math.floor(purchase.amount * 0.10); 
                 await updateDoc(doc(db, COLLECTIONS.USERS, refUser.id!), {
                    referralEarnings: increment(commission),
                    referralsCount: increment(1)
                 });
            }
        }
    }
  },

  async approvePayment(req: PaymentRequest) {
    await this.approvePurchase(req.id);
  },

  async rejectPurchase(purchaseId: string) {
    await updateDoc(doc(db, COLLECTIONS.PURCHASES, purchaseId), { status: 'rejected' });
  },

  async rejectPayment(id: string) {
    await this.rejectPurchase(id);
  },

  // --- UNLOCKS ---
  async unlockContent(uid: string, contentId: string, cost: number) {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const list = userSnap.data()?.unlockedContent || [];
    
    await updateDoc(userRef, {
      credits: increment(-cost),
      unlockedContent: [...list, contentId]
    });
  },

  // --- ADMIN STATS ---
  async getAdminStats() {
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const purchasesSnap = await getDocs(collection(db, COLLECTIONS.PURCHASES));
    const influencersSnap = await getDocs(collection(db, COLLECTIONS.INFLUENCERS));
    const withdrawalsSnap = await getDocs(collection(db, COLLECTIONS.WITHDRAWALS));
    
    // 1. Total Revenue
    const revenue = purchasesSnap.docs
      .map(d => d.data() as Purchase)
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    // 2. Total Commission (Money owed or paid to affiliates)
    
    // A. VIP Influencers (Current Earnings + Total Lifetime Paid)
    const infCommission = influencersSnap.docs
      .map(d => d.data() as Influencer)
      .reduce((sum, i) => sum + (Number(i.earnings) || 0) + (Number(i.totalPaid) || 0), 0);

    // B. User Affiliates (Current Wallet)
    const userWalletCommission = usersSnap.docs
      .map(d => d.data() as UserProfile)
      .reduce((sum, u) => sum + (Number(u.referralEarnings) || 0), 0);

    // C. User Affiliates (Already Paid via Withdrawals)
    const userPaidCommission = withdrawalsSnap.docs
      .map(d => d.data() as WithdrawalRequest)
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + Number(w.amount), 0);

    const totalCommission = infCommission + userWalletCommission + userPaidCommission;

    // 3. Net Income (Revenue - Commissions)
    const netIncome = revenue - totalCommission;

    return { 
      totalUsers: usersSnap.size, 
      revenue, 
      totalCommission, 
      netIncome 
    };
  }
};
