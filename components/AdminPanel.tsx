
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  PaymentRequest, UserProfile, GirlfriendProfile,
  PersonalityType, ProfileGalleryItem, ReferralProfile, ReferralTransaction
} from '../types';
import { gemini } from '../services/geminiService';
import { cloudStore } from '../services/cloudStore';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

interface AdminPanelProps {
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  profiles: GirlfriendProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<GirlfriendProfile[]>>;
  referrals: ReferralProfile[];
  setReferrals: React.Dispatch<React.SetStateAction<ReferralProfile[]>>;
  referralTransactions: ReferralTransaction[];
  setReferralTransactions: React.SetStateAction<ReferralTransaction[]>;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  paymentRequests, setPaymentRequests, 
  userProfile, setUserProfile, 
  profiles, setProfiles,
  referrals, setReferrals,
  referralTransactions, setReferralTransactions,
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'users' | 'influencers' | 'models'>('dashboard');
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]); // New state for user management
  
  // --- States for Smart Model Creator ---
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [activeModelTab, setActiveModelTab] = useState<'basic' | 'persona' | 'appearance' | 'gallery'>('basic'); // Internal tab for model modal
  
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  
  const [mainImageUrlInput, setMainImageUrlInput] = useState('');
  
  // Gallery inputs
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryUrlType, setGalleryUrlType] = useState<'image' | 'video'>('image');
  const [exclusiveForm, setExclusiveForm] = useState({ title: '', tease: '', creditCost: '50', isExclusive: false });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [refForm, setRefForm] = useState({ name: '', couponCode: '', commissionRate: '20', discountAmount: '100', paymentInfo: '' });

  const [compForm, setCompForm] = useState<Partial<GirlfriendProfile>>({
    name: '', age: 21, personality: PersonalityType.Girlfriend, voiceName: 'Kore',
    intro: '', image: '', systemPrompt: '', knowledge: [],
    appearance: { 
      ethnicity: 'বাঙালি', eyeColor: 'কালো', bodyType: 'স্মার্ট', breastSize: 'পারফেক্ট', 
      hairStyle: 'খোলা চুল', hairColor: 'ডার্ক ব্রাউন', outfit: 'টপস ও জিন্স',
    },
    character: { relationship: 'Girlfriend', occupation: 'ছাত্রী', kinks: [] },
    gallery: []
  });

  // Fetch users when entering 'users' tab
  useEffect(() => {
    if (activeTab === 'users' && isAuthenticated) {
        fetchUsers();
    }
  }, [activeTab, isAuthenticated]);

  const fetchUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersList(users);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
  };

  const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { approved: !currentStatus });
        // Update local list
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, approved: !currentStatus } : u));
    } catch (error) {
        alert("Failed to update status");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'Mishela') setIsAuthenticated(true); 
    else setPasscode('');
  };

  const stats = useMemo(() => {
    const totalRevenue = paymentRequests.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
    const pendingRevenue = paymentRequests.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    return { totalRevenue, pendingRevenue };
  }, [paymentRequests]);

  // --- Payment Approval Logic ---
  const handleApprovePayment = async (req: PaymentRequest) => {
    try {
        if (!db) throw new Error("Firebase Firestore is not initialized.");
        
        let updateData: any = {};
        const userRef = doc(db, 'users', req.userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) throw new Error("User profile not found in database.");
        const userData = userSnap.data();
        
        if (req.creditPackageId && req.amount) {
           const creditsToAdd = req.amount >= 450 ? 500 : req.amount >= 280 ? 300 : 100;
           updateData.credits = (userData?.credits || 0) + creditsToAdd;
        }

        if (req.tier) {
           const expiryDate = new Date();
           expiryDate.setDate(expiryDate.getDate() + 30);
           updateData.tier = req.tier;
           updateData.is_premium = true;
           updateData.is_vip = req.tier === 'VIP';
           updateData.subscription_expiry = expiryDate.toISOString();
        }

        // Also ensure user is approved if payment is successful
        updateData.approved = true; 

        await updateDoc(userRef, updateData);

        const updatedRequests = paymentRequests.map(r => r.id === req.id ? { ...r, status: 'approved' as const } : r);
        setPaymentRequests(updatedRequests);
        await cloudStore.savePaymentRequests(updatedRequests);

        // Handle referral commission if any...
        if (req.referralId) {
             // ... existing logic
        }
        alert(`✅ Payment Approved!`);
    } catch (error: any) {
        alert(`❌ Error: ${error.message}`);
    }
  };

  const handleRejectPayment = async (id: string) => {
    const updatedRequests = paymentRequests.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r);
    setPaymentRequests(updatedRequests);
    await cloudStore.savePaymentRequests(updatedRequests);
  };

  // --- Model Saving Logic ---
  const handleSaveCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name || !compForm.image) return alert('Name & Image required');
    
    const newProfile = { 
        ...compForm as GirlfriendProfile, 
        id: editingCompanionId || 'comp_' + Math.random().toString(36).substr(2, 9) 
    };

    let updatedProfiles: GirlfriendProfile[];
    if (editingCompanionId) {
        updatedProfiles = profiles.map(p => p.id === editingCompanionId ? newProfile : p);
    } else {
        updatedProfiles = [...profiles, newProfile];
    }
    
    setProfiles(updatedProfiles);
    try {
        await cloudStore.saveProfiles(updatedProfiles);
        alert('✅ Model Profile Saved!');
        setIsAddingCompanion(false);
        setEditingCompanionId(null);
    } catch (err: any) {
        alert('❌ Save failed: ' + err.message);
    }
  };

  const handleMagicGenerate = async () => {
    if (!aiTheme.trim()) return alert("থিম লিখুন!");
    setIsAiGenerating(true);
    try {
      const generated = await gemini.generateMagicProfile(aiTheme);
      setCompForm(prev => ({ 
        ...prev, 
        ...generated, 
        appearance: { ...prev.appearance, ...generated.appearance }, 
        character: { ...prev.character, ...generated.character },
        gallery: prev.gallery || [] 
      }));
    } catch (e) { alert("AI Error"); } finally { setIsAiGenerating(false); }
  };

  const handleAddMainImageLink = () => {
    if(!mainImageUrlInput.trim()) return;
    setCompForm(prev => ({ ...prev, image: mainImageUrlInput.trim() }));
    setMainImageUrlInput('');
  };

  const handleAddGalleryItem = () => {
    if (!galleryUrlInput.trim()) return;
    const newItem: ProfileGalleryItem = { 
        id: 'media_' + Math.random().toString(36).substr(2, 9),
        type: galleryUrlType, 
        url: galleryUrlInput.trim(),
        isExclusive: exclusiveForm.isExclusive,
        creditCost: exclusiveForm.isExclusive ? parseInt(exclusiveForm.creditCost) : undefined,
        title: exclusiveForm.isExclusive ? exclusiveForm.title : undefined,
        tease: exclusiveForm.isExclusive ? exclusiveForm.tease : undefined
    };
    setCompForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), newItem] }));
    setGalleryUrlInput('');
    setExclusiveForm({ title: '', tease: '', creditCost: '50', isExclusive: false }); 
  };

  const handleDeleteGalleryItem = (id: string) => {
      setCompForm(prev => ({
          ...prev,
          gallery: prev.gallery?.filter(item => item.id !== id)
      }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (target === 'main') {
      const reader = new FileReader();
      reader.onload = (ev) => setCompForm(prev => ({ ...prev, image: ev.target?.result as string }));
      reader.readAsDataURL(files[0] as Blob);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
         setGalleryUrlInput(ev.target?.result as string);
      };
      reader.readAsDataURL(files[0] as Blob);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.name || !refForm.couponCode) return alert('Name & Coupon required');
    const newReferral: ReferralProfile = {
      id: 'ref_' + Math.random().toString(36).substr(2, 9),
      name: refForm.name,
      couponCode: refForm.couponCode.toUpperCase().trim(),
      commissionRate: Number(refForm.commissionRate),
      discountAmount: Number(refForm.discountAmount),
      status: 'active',
      paymentInfo: refForm.paymentInfo
    };
    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    await cloudStore.saveReferrals(updatedReferrals);
    setRefForm({ name: '', couponCode: '', commissionRate: '20', discountAmount: '100', paymentInfo: '' });
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0f0518] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-12 rounded-[3.5rem] border-white/10 text-center bg-black/40">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Admin Portal</h2>
          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="Passcode" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-black focus:outline-none focus:border-blue-500 transition-colors" />
            <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all shadow-lg shadow-blue-600/30">Authorize</button>
          </form>
          <button onClick={onBack} className="mt-8 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Return to App</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0518] text-white flex flex-col md:flex-row animate-in fade-in duration-500">
        <aside className="w-full md:w-64 bg-slate-900/50 border-r border-white/5 flex flex-col p-6 backdrop-blur-md">
           <div className="mb-10 flex items-center gap-3 px-2">
              <span className="font-black text-lg tracking-tight">Priyo Admin</span>
           </div>
           <nav className="space-y-2 flex-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
                { id: 'finance', label: 'Finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1' },
                { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                { id: 'influencers', label: 'Influencers', icon: 'M17 20h2a2 2 0 002-2V7.429a2 2 0 00-.634-1.464L18.428 3.536A2 2 0 0017 3H7a2 2 0 00-1.464.634L3.536 5.999A2 2 0 003 7.429V18a2 2 0 002 2h2m0 0V9a2 2 0 012-2h4a2 2 0 012 2v11m-8-7a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'models', label: 'Models', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {item.label}
                </button>
              ))}
           </nav>
           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-4">Back to App</button>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
           {activeTab === 'dashboard' && (
             <div className="space-y-8 animate-in fade-in">
                <h1 className="text-3xl font-black">Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Revenue</p>
                      <h3 className="text-3xl font-black text-green-400">৳{stats.totalRevenue}</h3>
                   </div>
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Pending</p>
                      <h3 className="text-3xl font-black text-yellow-500">৳{stats.pendingRevenue}</h3>
                   </div>
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Models</p>
                      <h3 className="text-3xl font-black text-blue-500">{profiles.length}</h3>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'finance' && (
             <div className="space-y-6">
                <h2 className="text-2xl font-black mb-6">Payment Requests</h2>
                {paymentRequests.map(req => (
                  <div key={req.id} className="glass p-6 rounded-3xl flex justify-between items-center border border-white/5 bg-black/20">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-bold text-lg">{req.userName}</h4>
                           <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-gray-400">{req.tier || 'Credits'}</span>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">TrxID: {req.trxId} • Bkash: {req.bkashNumber}</p>
                        <p className="text-2xl font-black mt-2 text-white">৳{req.amount} <span className="text-xs font-normal text-gray-500">requested</span></p>
                     </div>
                     <div className="flex gap-3">
                        {req.status === 'pending' ? (
                           <>
                             <button onClick={() => handleApprovePayment(req)} className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl text-black font-bold shadow-lg">Approve</button>
                             <button onClick={() => handleRejectPayment(req.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold border border-red-500/20">Reject</button>
                           </>
                        ) : (
                           <span className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-widest ${req.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>{req.status}</span>
                        )}
                     </div>
                  </div>
                ))}
             </div>
           )}
           
           {activeTab === 'users' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black">User Management</h2>
                  <button onClick={fetchUsers} className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20">Refresh</button>
                </div>
                
                <div className="space-y-4">
                  {usersList.map((user: any) => (
                    <div key={user.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 bg-black/20">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-full bg-pink-600 p-0.5">
                           <img src={user.photoURL || user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (user.displayName || user.name)} className="h-full w-full rounded-full bg-slate-900" />
                         </div>
                         <div>
                            <h4 className="font-bold">{user.displayName || user.name || 'Unknown'}</h4>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                               <span className="text-[10px] bg-white/10 px-2 rounded text-gray-300">{user.role || 'user'}</span>
                               <span className={`text-[10px] px-2 rounded ${user.approved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                 {user.approved ? 'Approved' : 'Pending'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleToggleApproval(user.id, user.approved)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${user.approved ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500 text-white hover:bg-green-600'}`}
                      >
                        {user.approved ? 'Revoke' : 'Approve'}
                      </button>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {activeTab === 'influencers' && (
             <div className="space-y-8 animate-in fade-in">
                <h2 className="text-3xl font-black mb-6">Influencer Management</h2>
                <div className="glass p-8 rounded-[3rem] border border-white/10 bg-black/40">
                    <h3 className="text-2xl font-black mb-6">Create New Referral</h3>
                    <form onSubmit={handleCreateReferral} className="space-y-6">
                        <input type="text" placeholder="Name" value={refForm.name} onChange={e => setRefForm({...refForm, name: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none" required />
                        <input type="text" placeholder="Code (RIYA99)" value={refForm.couponCode} onChange={e => setRefForm({...refForm, couponCode: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none uppercase" required />
                        <div className="grid grid-cols-2 gap-6">
                           <input type="number" placeholder="Comm %" value={refForm.commissionRate} onChange={e => setRefForm({...refForm, commissionRate: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none" required />
                           <input type="number" placeholder="Discount Tk" value={refForm.discountAmount} onChange={e => setRefForm({...refForm, discountAmount: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none" required />
                        </div>
                        <input type="text" placeholder="Payment Info" value={refForm.paymentInfo} onChange={e => setRefForm({...refForm, paymentInfo: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none" />
                        <button type="submit" className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white">Create</button>
                    </form>
                </div>
             </div>
           )}

           {/* MODELS TAB */}
           {activeTab === 'models' && !isAddingCompanion && (
             <div>
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black">AI Companions</h2>
                   <button onClick={() => { setIsAddingCompanion(true); setEditingCompanionId(null); setCompForm({gallery: []}); }} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-sm uppercase shadow-lg shadow-blue-600/30 transition-all">+ Add New Model</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {profiles.map(p => (
                      <div key={p.id} className="glass p-5 rounded-[2.5rem] border border-white/5 group relative bg-black/20">
                         <img src={p.image} className="w-full aspect-square object-cover rounded-[2rem] mb-4" />
                         <h3 className="text-xl font-black">{p.name}</h3>
                         <p className="text-xs text-gray-500 mb-4 line-clamp-2">{p.intro}</p>
                         <button onClick={() => { setEditingCompanionId(p.id); setCompForm(p); setIsAddingCompanion(true); }} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest">Edit Profile</button>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* SMART MODEL CREATOR MODAL (Bangla) */}
           {isAddingCompanion && (
             <div className="max-w-4xl mx-auto glass p-8 rounded-[3rem] border border-white/10 bg-black/60 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-black text-white">{editingCompanionId ? 'মডেল এডিট করুন' : 'নতুন মডেল তৈরি করুন'}</h2>
                   <button onClick={() => setIsAddingCompanion(false)} className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/20">✕</button>
                </div>

                {!editingCompanionId && (
                   <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-3xl mb-8 flex gap-4 items-center">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">✨</div>
                      <input type="text" value={aiTheme} onChange={e => setAiTheme(e.target.value)} placeholder="অটো-জেনারেট করতে থিম লিখুন (যেমন: গ্রাম্য বধু, কলেজ ছাত্রী)..." className="flex-1 bg-transparent border-none focus:outline-none text-white font-medium text-sm" />
                      <button onClick={handleMagicGenerate} disabled={isAiGenerating} className="bg-blue-600 px-4 py-2 rounded-xl font-bold text-xs text-white">{isAiGenerating ? 'অপেক্ষা...' : 'অটো-মেক'}</button>
                   </div>
                )}

                <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
                    {[
                        { id: 'basic', label: 'মৌলিক তথ্য' },
                        { id: 'persona', label: 'ব্যক্তিত্ব ও চরিত্র' },
                        { id: 'appearance', label: 'শারীরিক গঠন' },
                        { id: 'gallery', label: 'গ্যালারি ম্যানেজমেন্ট' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveModelTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeModelTab === tab.id ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSaveCompanion} className="space-y-6">
                    {/* Tab 1: Basic Info */}
                    {activeModelTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-black">নাম</label>
                                        <input type="text" placeholder="যেমন: রিয়া" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 focus:border-pink-500/50 outline-none text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-black">বয়স</label>
                                        <input type="number" placeholder="21" value={compForm.age} onChange={e => setCompForm({...compForm, age: parseInt(e.target.value)})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 focus:border-pink-500/50 outline-none text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-black">ইন্ট্রো মেসেজ (যা ইউজার প্রথমে দেখবে)</label>
                                        <textarea placeholder="হাই জান, কেমন আছো?..." value={compForm.intro} onChange={e => setCompForm({...compForm, intro: e.target.value})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 h-24 focus:border-pink-500/50 outline-none text-white text-sm" />
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-4 bg-black/20">
                                    <label className="text-[10px] text-gray-500 uppercase font-black mb-2">প্রোফাইল ছবি</label>
                                    {compForm.image ? <img src={compForm.image} className="h-32 w-32 object-cover rounded-full mb-2 border-2 border-pink-500" /> : <div className="h-20 w-20 bg-white/5 rounded-full mb-2"></div>}
                                    <input ref={fileInputRef} type="file" hidden onChange={e => handleImageUpload(e, 'main')} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-blue-500 hover:underline mb-2">ফাইল আপলোড</button>
                                    <div className="flex gap-2 w-full mt-2">
                                        <input type="text" value={mainImageUrlInput} onChange={e => setMainImageUrlInput(e.target.value)} placeholder="অথবা ইমেজ লিংক পেস্ট করুন..." className="flex-1 bg-black/30 p-2 rounded-xl border border-white/5 text-[10px] text-white" />
                                        <button type="button" onClick={handleAddMainImageLink} className="bg-white/10 px-3 rounded-xl text-[10px] font-bold text-white">Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Persona */}
                    {activeModelTab === 'persona' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 uppercase font-black">গোপন চরিত্র নির্দেশ (System Prompt)</label>
                                <p className="text-[10px] text-gray-600 mb-2">এখানে বলে দিন AI কিভাবে আচরণ করবে। (বাংলায় লিখলে ভালো)</p>
                                <textarea value={compForm.systemPrompt} onChange={e => setCompForm({...compForm, systemPrompt: e.target.value})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 h-32 focus:border-pink-500/50 outline-none text-white text-sm font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">কণ্ঠস্বর (Voice)</label>
                                    <select value={compForm.voiceName} onChange={e => setCompForm({...compForm, voiceName: e.target.value})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 outline-none text-white">
                                        <option value="Kore">Kore (Sweet)</option>
                                        <option value="Puck">Puck (Soft)</option>
                                        <option value="Charon">Charon (Deep)</option>
                                        <option value="Fenrir">Fenrir (Mature)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">ব্যাবহার (Personality)</label>
                                    <select value={compForm.personality} onChange={e => setCompForm({...compForm, personality: e.target.value as any})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 outline-none text-white">
                                        {Object.values(PersonalityType).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">পেশা</label>
                                    <input type="text" value={compForm.character?.occupation} onChange={e => setCompForm({...compForm, character: {...compForm.character!, occupation: e.target.value}})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 outline-none text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">সম্পর্ক</label>
                                    <input type="text" value={compForm.character?.relationship} onChange={e => setCompForm({...compForm, character: {...compForm.character!, relationship: e.target.value}})} className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 outline-none text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Appearance */}
                    {activeModelTab === 'appearance' && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                            {['ethnicity', 'eyeColor', 'bodyType', 'breastSize', 'hairStyle', 'hairColor', 'outfit'].map(key => (
                                <div key={key} className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-black">{key}</label>
                                    <input 
                                        type="text" 
                                        value={(compForm.appearance as any)?.[key] || ''} 
                                        onChange={e => setCompForm({
                                            ...compForm, 
                                            appearance: { ...compForm.appearance!, [key]: e.target.value }
                                        })} 
                                        className="w-full bg-black/30 p-3 rounded-xl border border-white/5 outline-none text-white text-sm" 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 4: Gallery Management */}
                    {activeModelTab === 'gallery' && (
                        <div className="space-y-8 animate-in fade-in">
                            {/* Add New Item Section */}
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <h4 className="text-sm font-black text-pink-500 mb-4 uppercase">নতুন ছবি/ভিডিও যোগ করুন</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="h-40 w-full bg-black/30 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                                            {galleryUrlInput ? (
                                                galleryUrlType === 'image' ? 
                                                <img src={galleryUrlInput} className="h-full w-full object-cover" /> : 
                                                <video src={galleryUrlInput} className="h-full w-full object-cover" />
                                            ) : <span className="text-xs text-gray-500">প্রিভিউ</span>}
                                            
                                            <input ref={galleryFileInputRef} type="file" hidden onChange={e => handleImageUpload(e, 'gallery')} />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                <button type="button" onClick={() => galleryFileInputRef.current?.click()} className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-lg">Upload</button>
                                            </div>
                                        </div>
                                        <input type="text" value={galleryUrlInput} onChange={e => setGalleryUrlInput(e.target.value)} placeholder="অথবা লিংক পেস্ট করুন..." className="w-full bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white" />
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-xs text-gray-300">
                                                <input type="radio" checked={galleryUrlType === 'image'} onChange={() => setGalleryUrlType('image')} /> Image
                                            </label>
                                            <label className="flex items-center gap-2 text-xs text-gray-300">
                                                <input type="radio" checked={galleryUrlType === 'video'} onChange={() => setGalleryUrlType('video')} /> Video
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 cursor-pointer bg-black/30 p-3 rounded-xl border border-white/5">
                                            <input type="checkbox" checked={exclusiveForm.isExclusive} onChange={e => setExclusiveForm({...exclusiveForm, isExclusive: e.target.checked})} className="accent-yellow-500 h-4 w-4" />
                                            <span className={`text-sm font-bold ${exclusiveForm.isExclusive ? 'text-yellow-500' : 'text-gray-400'}`}>এটি কি প্রিমিয়াম (Exclusive)?</span>
                                        </label>

                                        {exclusiveForm.isExclusive && (
                                            <div className="space-y-3 pl-2 border-l-2 border-yellow-500/30 animate-in slide-in-from-top-2">
                                                <input type="number" placeholder="Cost (Credits)" value={exclusiveForm.creditCost} onChange={e => setExclusiveForm({...exclusiveForm, creditCost: e.target.value})} className="w-full bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white" />
                                                <input type="text" placeholder="Title (Ex: আমার গোপন ছবি)" value={exclusiveForm.title} onChange={e => setExclusiveForm({...exclusiveForm, title: e.target.value})} className="w-full bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white" />
                                                <textarea placeholder="Tease (Ex: দেখলে পাগল হয়ে যাবে...)" value={exclusiveForm.tease} onChange={e => setExclusiveForm({...exclusiveForm, tease: e.target.value})} className="w-full bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white h-16" />
                                            </div>
                                        )}
                                        
                                        <button type="button" onClick={handleAddGalleryItem} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg">গ্যালারিতে যোগ করুন</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-gray-400 mb-4 uppercase">বর্তমান গ্যালারি ({compForm.gallery?.length || 0})</h4>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
                                    {compForm.gallery?.map((item) => (
                                        <div key={item.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-white/5 bg-black/30">
                                            {item.type === 'image' ? <img src={item.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs">Video</div>}
                                            {item.isExclusive && <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 rounded">PAID</div>}
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => handleDeleteGalleryItem(item.id!)} className="bg-red-500 text-white p-2 rounded-full text-xs">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-white/10">
                        <button type="submit" className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-black text-white uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                            {editingCompanionId ? 'পরিবর্তন সেভ করুন' : 'প্রোফাইল তৈরি করুন'}
                        </button>
                    </div>
                </form>
             </div>
           )}
        </main>
    </div>
  );
};
