
import React, { useState, useRef, useMemo } from 'react';
import { 
  PaymentRequest, UserProfile, GirlfriendProfile, SubscriptionTier,
  PersonalityType, ProfileGalleryItem, ReferralProfile, ReferralTransaction
} from '../types';
import { gemini } from '../services/geminiService';

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
  setReferralTransactions: React.Dispatch<React.SetStateAction<ReferralTransaction[]>>;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'influencers' | 'models'>('dashboard');
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // --- States for Smart Model Creator ---
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isGeneratingExclusive, setIsGeneratingExclusive] = useState(false); // NEW STATE
  const [aiTheme, setAiTheme] = useState('');
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  const [knowledgeInput, setKnowledgeInput] = useState(''); 
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryUrlType, setGalleryUrlType] = useState<'image' | 'video'>('image');
  const [exclusiveForm, setExclusiveForm] = useState({ title: '', tease: '', creditCost: '50', isExclusive: false });
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- States for Influencer Management ---
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [refForm, setRefForm] = useState({ name: '', couponCode: '', commissionRate: '20', discountAmount: '100', paymentInfo: '' });

  // --- Initial Form State ---
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

  // --- Auth ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'Mishela') setIsAuthenticated(true);
    else setPasscode('');
  };

  // --- Dashboard Stats Calculation ---
  const stats = useMemo(() => {
    const totalRevenue = paymentRequests.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
    const pendingRevenue = paymentRequests.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const totalCommissions = referralTransactions.reduce((sum, t) => sum + t.amount, 0);
    const paidCommissions = referralTransactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
    const pendingCommissions = referralTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    
    return { totalRevenue, pendingRevenue, totalCommissions, paidCommissions, pendingCommissions };
  }, [paymentRequests, referralTransactions]);

  // --- Payment Logic ---
  const handleApprovePayment = (req: PaymentRequest) => {
    const updatedRequests = paymentRequests.map(r => r.id === req.id ? { ...r, status: 'approved' as const } : r);
    setPaymentRequests(updatedRequests);

    if (req.userId === userProfile.id) {
       if (req.tier) {
         // Calculate Expiry Date (30 Days from now)
         const expiryDate = new Date();
         expiryDate.setDate(expiryDate.getDate() + 30);

         setUserProfile(prev => ({ 
             ...prev, 
             tier: req.tier!, 
             isPremium: true,
             subscriptionExpiry: expiryDate.toISOString()
         }));
       }
       if (req.creditPackageId && req.amount) {
         let creditsToAdd = req.amount >= 450 ? 500 : req.amount >= 280 ? 300 : 100;
         setUserProfile(prev => ({ ...prev, credits: (prev.credits || 0) + creditsToAdd }));
       }
       alert(`Payment Approved for ${req.userName}`);
    }

    if (req.referralId) {
      const referral = referrals.find(r => r.id === req.referralId);
      if (referral) {
        const commissionAmount = Math.floor(req.amount * (referral.commissionRate / 100));
        const newTx: ReferralTransaction = {
          id: 'tx_' + Math.random().toString(36).substr(2, 9),
          referralId: req.referralId,
          amount: commissionAmount,
          status: 'pending',
          timestamp: new Date().toLocaleString(),
          note: `Comm. from ${req.userName} (${req.amount}Tk)`
        };
        setReferralTransactions(prev => [newTx, ...prev]);
      }
    }
  };

  const handleRejectPayment = (id: string) => {
    setPaymentRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  // --- Influencer Logic ---
  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.name || !refForm.couponCode) return;
    const newReferral: ReferralProfile = {
      id: 'ref_' + Math.random().toString(36).substr(2, 9),
      name: refForm.name,
      couponCode: refForm.couponCode.toUpperCase().trim(),
      commissionRate: Number(refForm.commissionRate),
      discountAmount: Number(refForm.discountAmount),
      status: 'active',
      paymentInfo: refForm.paymentInfo
    };
    setReferrals([...referrals, newReferral]);
    setRefForm({ name: '', couponCode: '', commissionRate: '20', discountAmount: '100', paymentInfo: '' });
  };

  const handlePayoutCommission = (txId: string) => {
    if(confirm("Confirm payout sent to influencer?")) {
      setReferralTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'paid' } : t));
    }
  };

  // --- Model Logic ---
  const handleMagicGenerate = async () => {
    if (!aiTheme.trim()) return alert("Enter a theme first!");
    setIsAiGenerating(true);
    try {
      const generated = await gemini.generateMagicProfile(aiTheme);
      setCompForm(prev => ({ ...prev, ...generated, appearance: { ...prev.appearance, ...generated.appearance }, character: { ...prev.character, ...generated.character }, gallery: prev.gallery || [] }));
    } catch (e) { alert("AI Error"); } finally { setIsAiGenerating(false); }
  };

  // NEW: Generate Exclusive Metadata
  const handleGenerateExclusiveMetadata = async () => {
    setIsGeneratingExclusive(true);
    try {
      // Use the model's name or theme or a generic 'Sexy' context
      const context = compForm.name ? `${compForm.name} - ${compForm.personality}` : aiTheme || "Sexy Bangladeshi Girlfriend";
      const result = await gemini.generateExclusiveContentMetadata(context);
      setExclusiveForm(prev => ({ ...prev, title: result.title, tease: result.tease }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingExclusive(false);
    }
  };

  const handleAddKnowledge = () => {
    if (knowledgeInput.trim()) {
      setCompForm(prev => ({ ...prev, knowledge: [...(prev.knowledge || []), knowledgeInput.trim()] }));
      setKnowledgeInput('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (target === 'main') {
      const reader = new FileReader();
      reader.onload = (ev) => setCompForm(prev => ({ ...prev, image: ev.target?.result as string }));
      reader.readAsDataURL(files[0] as Blob);
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
           const newItem: ProfileGalleryItem = { 
             id: 'media_' + Math.random().toString(36).substr(2, 9),
             type: 'image', 
             url: ev.target?.result as string,
             isExclusive: exclusiveForm.isExclusive,
             creditCost: exclusiveForm.isExclusive ? parseInt(exclusiveForm.creditCost) : undefined,
             title: exclusiveForm.isExclusive ? exclusiveForm.title : undefined,
             tease: exclusiveForm.isExclusive ? exclusiveForm.tease : undefined
           };
           setCompForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), newItem] }));
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleSaveCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name || !compForm.image) return alert('Name & Image required');
    let updatedProfiles: GirlfriendProfile[];
    if (editingCompanionId) updatedProfiles = profiles.map(p => p.id === editingCompanionId ? { ...p, ...compForm as GirlfriendProfile } : p);
    else updatedProfiles = [...profiles, { ...compForm as GirlfriendProfile, id: 'comp_' + Math.random().toString(36).substr(2, 9) }];
    
    setProfiles(updatedProfiles);
    setIsAddingCompanion(false);
    setEditingCompanionId(null);
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0f0518] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-12 rounded-[3.5rem] border-white/10 text-center bg-black/40">
          <div className="h-20 w-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Admin Portal</h2>
          <p className="text-gray-500 mb-8 text-sm">Secure Access Required</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="Passcode" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-black focus:outline-none focus:border-blue-500 transition-colors" />
            <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all shadow-lg shadow-blue-600/30">Authorize</button>
          </form>
          <button onClick={onBack} className="mt-8 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">Return to App</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0518] text-white flex flex-col md:flex-row animate-in fade-in duration-500">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/50 border-r border-white/5 flex flex-col p-6 backdrop-blur-md">
           <div className="mb-10 flex items-center gap-3 px-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">P</div>
              <span className="font-black text-lg tracking-tight">Priyo Admin</span>
           </div>
           
           <nav className="space-y-2 flex-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                { id: 'finance', label: 'Finance & Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'influencers', label: 'Influencers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'models', label: 'Smart Models', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  {item.label}
                </button>
              ))}
           </nav>

           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-4">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
              Back to App
           </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
           {/* ... Dashboard, Finance, Influencers tabs (unchanged) ... */}
           {activeTab === 'dashboard' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h1 className="text-3xl font-black">Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Revenue</p>
                      <h3 className="text-3xl font-black text-green-400">৳{stats.totalRevenue}</h3>
                      <p className="text-[10px] text-gray-500 mt-2">All time approved</p>
                   </div>
                   <div className="glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Pending</p>
                      <h3 className="text-3xl font-black text-yellow-500">৳{stats.pendingRevenue}</h3>
                      <p className="text-[10px] text-gray-500 mt-2">{paymentRequests.filter(p => p.status === 'pending').length} requests waiting</p>
                   </div>
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Influencer Earnings</p>
                      <h3 className="text-3xl font-black text-pink-500">৳{stats.totalCommissions}</h3>
                      <div className="flex gap-2 mt-2">
                         <span className="text-[10px] bg-green-500/20 text-green-500 px-2 rounded">Paid: ৳{stats.paidCommissions}</span>
                         <span className="text-[10px] bg-red-500/20 text-red-500 px-2 rounded">Due: ৳{stats.pendingCommissions}</span>
                      </div>
                   </div>
                   <div className="glass p-6 rounded-[2rem] border-white/5 bg-black/20">
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Active Models</p>
                      <h3 className="text-3xl font-black text-blue-500">{profiles.length}</h3>
                      <p className="text-[10px] text-gray-500 mt-2">AI Personalities</p>
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
                        {req.referralId && <p className="text-xs text-pink-500 font-bold mt-1">Via Influencer Referral</p>}
                     </div>
                     <div className="flex gap-3">
                        {req.status === 'pending' ? (
                           <>
                             <button onClick={() => handleApprovePayment(req)} className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl text-black font-bold shadow-lg shadow-green-500/20 transition-all">Approve</button>
                             <button onClick={() => handleRejectPayment(req.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-xl font-bold border border-red-500/20 transition-all">Reject</button>
                           </>
                        ) : (
                           <span className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{req.status}</span>
                        )}
                     </div>
                  </div>
                ))}
             </div>
           )}

           {/* Influencers and Models tabs (truncated for brevity, logic exists in original) */}
           {activeTab === 'influencers' && (
             // ... Influencer content ...
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List & Create */}
                <div className="lg:col-span-1 space-y-8">
                   <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-black/20">
                      <h3 className="text-xl font-black mb-4 text-pink-500">Add Influencer</h3>
                      <form onSubmit={handleCreateReferral} className="space-y-4">
                         <input type="text" placeholder="Name" value={refForm.name} onChange={e => setRefForm({...refForm, name: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-sm focus:outline-none focus:border-pink-500/50" />
                         <input type="text" placeholder="Code (e.g. RIYA20)" value={refForm.couponCode} onChange={e => setRefForm({...refForm, couponCode: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-sm focus:outline-none focus:border-pink-500/50" />
                         <div className="flex gap-2">
                           <input type="number" placeholder="Comm %" value={refForm.commissionRate} onChange={e => setRefForm({...refForm, commissionRate: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-sm" />
                           <input type="number" placeholder="Discount Tk" value={refForm.discountAmount} onChange={e => setRefForm({...refForm, discountAmount: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-sm" />
                         </div>
                         <input type="text" placeholder="Payment Info (Bkash)" value={refForm.paymentInfo} onChange={e => setRefForm({...refForm, paymentInfo: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-sm" />
                         <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl font-black uppercase text-sm shadow-lg shadow-pink-600/20">Create Profile</button>
                      </form>
                   </div>
                   
                   <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">Profiles</h4>
                      {referrals.map(r => (
                        <div key={r.id} onClick={() => setSelectedReferralId(r.id)} className={`p-4 rounded-2xl cursor-pointer flex justify-between items-center transition-all ${selectedReferralId === r.id ? 'bg-pink-600 text-white shadow-lg' : 'glass text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                           <span className="font-bold">{r.name}</span>
                           <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">{r.couponCode}</span>
                        </div>
                      ))}
                   </div>
                </div>
                
                 {/* Details Panel */}
                 <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5 min-h-[500px] bg-black/20">
                   {selectedReferralId ? (
                     <div>
                        {(() => {
                          const ref = referrals.find(r => r.id === selectedReferralId)!;
                          const txs = referralTransactions.filter(t => t.referralId === ref.id);
                          const totalEarned = txs.reduce((sum, t) => sum + t.amount, 0);
                          const paid = txs.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
                          const pending = totalEarned - paid;

                          return (
                            <>
                              <div className="flex justify-between items-start mb-8">
                                 <div>
                                    <h2 className="text-3xl font-black">{ref.name}</h2>
                                    <p className="text-pink-500 font-bold">{ref.couponCode}</p>
                                    <p className="text-sm text-gray-400 mt-1">{ref.paymentInfo || 'No payment info'}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-black">Unpaid Commission</p>
                                    <p className="text-4xl font-black text-white">৳{pending}</p>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 border-b border-white/10 pb-2">Transaction History</h4>
                                 {txs.length === 0 && <p className="text-gray-500 italic">No transactions yet.</p>}
                                 {txs.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                       <div>
                                          <p className="font-bold text-sm">{tx.note}</p>
                                          <p className="text-[10px] text-gray-500">{tx.timestamp}</p>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <span className="font-black text-lg">৳{tx.amount}</span>
                                          {tx.status === 'pending' ? (
                                             <button onClick={() => handlePayoutCommission(tx.id)} className="bg-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Mark Paid</button>
                                          ) : (
                                             <span className="text-green-500 text-[10px] font-black uppercase">Paid</span>
                                          )}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                            </>
                          );
                        })()}
                     </div>
                   ) : (
                     <div className="h-full flex items-center justify-center text-gray-500 font-bold">Select an influencer to view details</div>
                   )}
                </div>
             </div>
           )}

           {activeTab === 'models' && !isAddingCompanion && (
             <div>
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black">AI Companions</h2>
                   <button onClick={() => { setIsAddingCompanion(true); setEditingCompanionId(null); }} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-sm uppercase shadow-lg shadow-blue-600/30 transition-all">+ Add New Model</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {profiles.map(p => (
                      <div key={p.id} className="glass p-5 rounded-[2.5rem] border border-white/5 group relative bg-black/20">
                         <img src={p.image} className="w-full aspect-square object-cover rounded-[2rem] mb-4" />
                         <h3 className="text-xl font-black">{p.name}</h3>
                         <p className="text-xs text-gray-400 mb-4 line-clamp-2">{p.intro}</p>
                         <div className="flex flex-wrap gap-2 mb-4">
                            {p.knowledge?.slice(0, 3).map((k, i) => <span key={i} className="text-[9px] bg-white/10 px-2 py-1 rounded-md text-gray-300">{k}</span>)}
                         </div>
                         <button onClick={() => { setEditingCompanionId(p.id); setCompForm(p); setIsAddingCompanion(true); }} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs uppercase tracking-widest">Edit Profile</button>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* --- MODEL CREATOR FORM --- */}
           {isAddingCompanion && (
             <div className="max-w-4xl mx-auto glass p-10 rounded-[3rem] border border-white/10 bg-black/40">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-3xl font-black">{editingCompanionId ? 'Edit Model' : 'Create Smart Model'}</h2>
                   <button onClick={() => setIsAddingCompanion(false)} className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/20">✕</button>
                </div>

                {!editingCompanionId && (
                   <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-3xl mb-8 flex gap-4 items-center">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">✨</div>
                      <input type="text" value={aiTheme} onChange={e => setAiTheme(e.target.value)} placeholder="Describe theme (e.g. A shy village girl who loves cricket)" className="flex-1 bg-transparent border-none focus:outline-none text-white font-medium" />
                      <button onClick={handleMagicGenerate} disabled={isAiGenerating} className="bg-blue-600 px-6 py-3 rounded-xl font-bold text-sm">{isAiGenerating ? 'Thinking...' : 'Auto-Generate'}</button>
                   </div>
                )}

                <form onSubmit={handleSaveCompanion} className="space-y-10">
                   {/* Section 1: Identity */}
                   <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/10 pb-2">Identity & Visuals</h3>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <input type="text" placeholder="Name" value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 focus:border-blue-500/50 outline-none" />
                            <input type="number" placeholder="Age" value={compForm.age} onChange={e => setCompForm({...compForm, age: parseInt(e.target.value)})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 focus:border-blue-500/50 outline-none" />
                            <select value={compForm.voiceName} onChange={e => setCompForm({...compForm, voiceName: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 outline-none text-gray-400">
                               <option>Kore</option><option>Puck</option><option>Charon</option>
                            </select>
                         </div>
                         <div className="border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                            {compForm.image ? <img src={compForm.image} className="h-32 w-32 object-cover rounded-full mb-2" /> : <div className="h-20 w-20 bg-white/5 rounded-full mb-2"></div>}
                            <span className="text-xs font-bold text-gray-500">Upload Avatar</span>
                            <input ref={fileInputRef} type="file" hidden onChange={e => handleImageUpload(e, 'main')} />
                         </div>
                      </div>
                      <textarea placeholder="Intro Message" value={compForm.intro} onChange={e => setCompForm({...compForm, intro: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 focus:border-blue-500/50 outline-none h-24" />
                   </div>

                   {/* Section 2: Brain */}
                   <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/10 pb-2">Brain & Knowledge</h3>
                      
                      <div className="space-y-3">
                         <label className="text-sm font-bold text-gray-400">Interaction Mode</label>
                         <div className="flex flex-wrap gap-2">
                            {Object.values(PersonalityType).map(t => (
                               <button 
                                 type="button" 
                                 key={t}
                                 onClick={() => setCompForm({...compForm, personality: t})} 
                                 className={`px-4 py-2 rounded-xl text-xs font-bold border ${compForm.personality === t ? 'bg-pink-600 border-pink-600 text-white' : 'border-white/10 text-gray-500 hover:text-white'}`}
                               >
                                 {t}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-sm font-bold text-gray-400">Knowledge Base (Topics she knows)</label>
                         <div className="flex gap-2">
                            <input type="text" value={knowledgeInput} onChange={e => setKnowledgeInput(e.target.value)} placeholder="Add topic (e.g. Cricket, Politics)..." className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5 text-sm" />
                            <button type="button" onClick={handleAddKnowledge} className="bg-blue-600 px-4 rounded-xl font-bold text-xl">+</button>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {compForm.knowledge?.map((k, i) => (
                               <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                  {k} 
                                  <button type="button" onClick={() => setCompForm(prev => ({...prev, knowledge: prev.knowledge?.filter((_, idx) => idx !== i)}))} className="text-red-400 hover:text-red-500">×</button>
                               </span>
                            ))}
                         </div>
                      </div>

                      <textarea placeholder="System Prompt (Core Instructions)" value={compForm.systemPrompt} onChange={e => setCompForm({...compForm, systemPrompt: e.target.value})} className="w-full bg-black/20 p-4 rounded-2xl border border-white/5 focus:border-blue-500/50 outline-none h-32 font-mono text-xs" />
                   </div>

                   {/* Section 3: Gallery */}
                   <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/10 pb-2">Gallery & Exclusive</h3>
                      
                      <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl">
                         <div className="flex justify-between items-center mb-4">
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={exclusiveForm.isExclusive} onChange={e => setExclusiveForm({...exclusiveForm, isExclusive: e.target.checked})} className="h-5 w-5 accent-yellow-500" />
                              <span className="font-bold text-yellow-500 uppercase text-xs">Upload as Exclusive Content</span>
                           </label>
                           {exclusiveForm.isExclusive && (
                             <button type="button" onClick={handleGenerateExclusiveMetadata} disabled={isGeneratingExclusive} className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 px-3 py-1.5 rounded-lg text-black text-[10px] font-black uppercase shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform">
                                {isGeneratingExclusive ? 'Writing...' : 'Magic Write'}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                             </button>
                           )}
                         </div>
                         
                         {exclusiveForm.isExclusive && (
                            <div className="grid grid-cols-3 gap-3 animate-in fade-in">
                               <input type="text" placeholder="Seductive Title" value={exclusiveForm.title} onChange={e => setExclusiveForm({...exclusiveForm, title: e.target.value})} className="bg-black/40 p-3 rounded-xl border border-white/10 text-sm" />
                               <input type="text" placeholder="Tease Note" value={exclusiveForm.tease} onChange={e => setExclusiveForm({...exclusiveForm, tease: e.target.value})} className="bg-black/40 p-3 rounded-xl border border-white/10 text-sm" />
                               <input type="number" placeholder="Cost" value={exclusiveForm.creditCost} onChange={e => setExclusiveForm({...exclusiveForm, creditCost: e.target.value})} className="bg-black/40 p-3 rounded-xl border border-white/10 text-sm" />
                            </div>
                         )}
                      </div>

                      <div className="flex gap-4">
                         <button type="button" onClick={() => galleryInputRef.current?.click()} className="flex-1 py-4 border border-dashed border-white/20 rounded-2xl text-gray-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">Upload Images/Videos</button>
                         <input ref={galleryInputRef} type="file" multiple hidden onChange={e => handleImageUpload(e, 'gallery')} />
                      </div>
                      
                      <div className="grid grid-cols-5 gap-3">
                         {compForm.gallery?.map((item, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                               <img src={item.url} className="w-full h-full object-cover" />
                               {item.isExclusive && <div className="absolute inset-0 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl pointer-events-none"></div>}
                               <button type="button" onClick={() => setCompForm(prev => ({...prev, gallery: prev.gallery?.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-600 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs">×</button>
                            </div>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all">Save & Publish Profile</button>
                </form>
             </div>
           )}

        </main>
    </div>
  );
};
