
import React, { useState, useEffect } from 'react';
import { PaymentRequest, UserProfile, GirlfriendProfile, Influencer, ProfileGalleryItem, ModelMode, WithdrawalRequest } from '../types';
import { cloudStore } from '../services/cloudStore';
import { gemini } from '../services/geminiService';
import { Card3D, Button3D } from './Layout3D';

interface AdminPanelProps {
  paymentRequests: PaymentRequest[];
  setPaymentRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  userProfile?: UserProfile | null;
  setUserProfile?: any;
  profiles: GirlfriendProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<GirlfriendProfile[]>>;
  onBack: () => void;
  isPreAuthorized?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  paymentRequests, setPaymentRequests, profiles, setProfiles, onBack, isPreAuthorized = false
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'models' | 'users' | 'referrals'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(isPreAuthorized);
  const [passcode, setPasscode] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, revenue: 0, totalCommission: 0, netIncome: 0 });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Referral Tab State
  const [referralSubTab, setReferralSubTab] = useState<'vip' | 'users'>('vip');

  // Model Editor
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [modelForm, setModelForm] = useState<Partial<GirlfriendProfile>>({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [genMode, setGenMode] = useState<ModelMode>('Girlfriend'); // Default Mode
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelTab, setModelTab] = useState<'basic' | 'appearance' | 'gallery'>('basic'); // Sub-tabs for model editor

  // Gallery Management
  const [newGalleryItem, setNewGalleryItem] = useState<Partial<ProfileGalleryItem>>({ type: 'image', isExclusive: false, creditCost: 50 });
  const [isGeneratingTease, setIsGeneratingTease] = useState(false);

  // User Editor
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Influencer Management
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState<string | null>(null);
  const [influencerForm, setInfluencerForm] = useState({
      name: '',
      code: '',
      commissionRate: 20,
      discountAmount: 100,
      paymentMethod: 'Bkash',
      paymentNumber: ''
  });

  useEffect(() => {
    if (isPreAuthorized) setIsAuthenticated(true);
  }, [isPreAuthorized]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, activeTab]);

  const loadInitialData = async () => {
    const s = await cloudStore.getAdminStats();
    setStats(s);
    const reqs = await cloudStore.loadPendingPayments();
    setPaymentRequests(reqs);
    const mods = await cloudStore.loadModels();
    setProfiles(mods);
    
    // Always load all users
    const users = await cloudStore.getAllUsers();
    setAllUsers(users);

    if (activeTab === 'referrals') {
        const infs = await cloudStore.getAllInfluencers();
        setInfluencers(infs);
        const wds = await cloudStore.getPendingWithdrawals();
        setPendingWithdrawals(wds);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'Mishela') setIsAuthenticated(true);
    else alert('Access Denied');
  };

  const handleApprove = async (req: PaymentRequest) => {
    try {
      await cloudStore.approvePayment(req);
      loadInitialData(); 
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (id: string) => {
    await cloudStore.rejectPayment(id);
    loadInitialData();
  };

  // ... (Model Generation Logic - Keeping existing code) ...
   const handleGenerateModel = async () => {
    if (!aiPrompt) return alert("Please enter a theme (e.g. 'Village girl')");
    setIsGenerating(true);
    try {
      const generated = await gemini.generateMagicProfile(aiPrompt, genMode);
      
      const fullModel: Partial<GirlfriendProfile> = {
        ...generated,
        mode: genMode,
        id: modelForm.id || `model_${Date.now()}`,
        image: modelForm.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
        gallery: modelForm.gallery || []
      };
      
      setModelForm(fullModel);
      setModelTab('appearance'); 
      alert("Profile Generated Successfully! Please review Appearance tab.");
    } catch (e) {
      console.error("Auto Fill Error:", e);
      alert("AI Generation Failed. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (Gallery Management Logic - Keeping existing code) ...
  const handleAddGalleryItem = () => {
      if (!newGalleryItem.url) return alert("URL Required");
      const newItem: ProfileGalleryItem = {
          id: `gal_${Date.now()}`,
          type: newGalleryItem.type || 'image',
          url: newGalleryItem.url,
          isExclusive: newGalleryItem.isExclusive || false,
          creditCost: newGalleryItem.creditCost || 50,
          title: newGalleryItem.title || (newGalleryItem.isExclusive ? 'Exclusive Content' : ''),
          tease: newGalleryItem.tease || ''
      };
      const currentGallery = modelForm.gallery || [];
      setModelForm({ ...modelForm, gallery: [...currentGallery, newItem] });
      setNewGalleryItem({ type: 'image', isExclusive: false, creditCost: 50, url: '', title: '', tease: '' });
  };

  const handleRemoveGalleryItem = (id: string) => {
      const currentGallery = modelForm.gallery || [];
      setModelForm({ ...modelForm, gallery: currentGallery.filter(i => i.id !== id) });
  };

  const handleAutoTease = async () => {
      if (!newGalleryItem.url) return alert("Enter URL first to generate context.");
      setIsGeneratingTease(true);
      try {
          const meta = await gemini.generateExclusiveContentMetadata("Sexy photo of this model");
          setNewGalleryItem({
              ...newGalleryItem,
              title: meta.title,
              tease: meta.tease,
              isExclusive: true // Auto set to exclusive
          });
      } catch (e) { console.error(e); } finally { setIsGeneratingTease(false); }
  };

  const handleSaveModel = async () => {
    if (!modelForm.name) return alert("Name required");
    const newModel = {
        ...modelForm,
        id: modelForm.id || `model_${Date.now()}`,
        active: true,
        mode: modelForm.mode || 'Girlfriend'
    } as GirlfriendProfile;

    await cloudStore.saveModel(newModel);
    setIsEditingModel(false);
    setModelForm({});
    loadInitialData();
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
        await cloudStore.deleteUser(uid);
        loadInitialData();
    }
  };

  // ... (Influencer Logic - Keeping existing code) ...
  const openInfluencerModal = (inf?: Influencer) => {
      if (inf) {
          setEditingInfluencerId(inf.id!);
          setInfluencerForm({
              name: inf.name,
              code: inf.code,
              commissionRate: inf.commissionRate,
              discountAmount: inf.discountAmount,
              paymentMethod: inf.paymentMethod,
              paymentNumber: inf.paymentNumber
          });
      } else {
          setEditingInfluencerId(null);
          setInfluencerForm({ name: '', code: '', commissionRate: 20, discountAmount: 100, paymentMethod: 'Bkash', paymentNumber: '' });
      }
      setShowAddInfluencer(true);
  };

  const handleSaveInfluencer = async () => {
      if (!influencerForm.name || !influencerForm.code) return alert("Name and Code are required");
      const data: Partial<Influencer> = {
          name: influencerForm.name,
          code: influencerForm.code.toUpperCase().replace(/\s/g, ''),
          commissionRate: Number(influencerForm.commissionRate),
          discountAmount: Number(influencerForm.discountAmount),
          paymentMethod: influencerForm.paymentMethod,
          paymentNumber: influencerForm.paymentNumber
      };

      try {
          if (editingInfluencerId) {
              await cloudStore.updateInfluencer(editingInfluencerId, data);
          } else {
              await cloudStore.createInfluencer(data);
          }
          alert(`Success! Influencer ${influencerForm.name} saved.`);
          setShowAddInfluencer(false);
          loadInitialData(); 
      } catch (err: any) { console.error(err); alert("Failed to save influencer."); }
  };

  const handlePayoutInfluencer = async (influencer: Influencer) => {
    if (!influencer.id) {
        alert("Error: Influencer ID missing. Check database.");
        console.error("Missing ID", influencer);
        return;
    }
    
    // Ensure earnings is number
    const earnings = Number(influencer.earnings);
    
    if (earnings <= 0) {
      alert("No earnings to payout.");
      return;
    }
    
    if(confirm(`Confirm payout of ৳${earnings} to ${influencer.name}? \nMethod: ${influencer.paymentMethod} (${influencer.paymentNumber})`)) {
        try {
            // Optimistic UI Update
            setInfluencers(prev => prev.map(inf => {
                if (inf.id === influencer.id) {
                    return {
                        ...inf,
                        earnings: 0,
                        totalPaid: (inf.totalPaid || 0) + earnings
                    };
                }
                return inf;
            }));

            await cloudStore.payoutInfluencer(influencer);
            alert("Payout Recorded & Earnings Reset!");
            
            // Refresh from DB to confirm
            loadInitialData();
        } catch(e: any) {
            alert("Payout Error: " + e.message);
            // Revert UI if needed (by reloading)
            loadInitialData();
        }
    }
  };
  
  const handleApproveWithdrawal = async (req: WithdrawalRequest) => {
    if(confirm(`Confirm payment of ৳${req.amount} to ${req.method} (${req.number})?`)) {
        await cloudStore.approveWithdrawal(req);
        alert("Payment Confirmed! User balance updated.");
        loadInitialData();
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
      if(confirm("Delete this influencer?")) {
          await cloudStore.deleteInfluencer(id);
          loadInitialData();
      }
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center h-screen bg-black fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-[url('https://cdn.dribbble.com/users/1615584/screenshots/15467035/media/311894d033f20d65b6154625b651030e.jpg')] bg-cover opacity-20 blur-sm"></div>
      <form onSubmit={handleLogin} className="glass p-10 rounded-[3rem] text-center max-w-sm w-full border border-white/10 relative z-10 shadow-2xl shadow-purple-900/50">
        <h2 className="text-3xl font-black text-white mb-2">Command Center</h2>
        <input type="password" value={passcode} onChange={e=>setPasscode(e.target.value)} className="p-4 rounded-xl bg-black/50 text-white mb-6 block w-full outline-none border border-white/10 text-center tracking-[0.5em] font-bold text-xl" placeholder="••••••" autoFocus />
        <Button3D variant="secondary" className="w-full">Initialize</Button3D>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 absolute inset-0 z-[100] overflow-hidden flex">
       {/* Sidebar */}
       <div className="w-64 glass rounded-[2rem] p-6 flex flex-col justify-between mr-6 border-white/5 h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
          <div>
              <h1 className="text-2xl font-black tracking-tighter mb-10 flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">PRIYO</span> 
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">ADMIN</span>
              </h1>
              <nav className="space-y-2">
                  {['dashboard', 'finance', 'models', 'referrals', 'users'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-lg border-l-4 border-pink-500' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </nav>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-4">Log Out</button>
       </div>

       {/* Main Content */}
       <div className="flex-1 overflow-y-auto pr-2">
          
          {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      <div className="p-6 rounded-3xl bg-green-900/20 border border-green-500/20 col-span-2">
                          <p className="text-xs font-black uppercase text-green-500">Total Revenue</p>
                          <p className="text-4xl font-black text-white mt-2">৳{stats.revenue}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Gross Sales</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-blue-900/20 border border-blue-500/20 col-span-2">
                          <p className="text-xs font-black uppercase text-blue-400">Net Income</p>
                          <p className="text-4xl font-black text-white mt-2">৳{stats.netIncome}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Profit after commissions</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-orange-900/20 border border-orange-500/20 col-span-2">
                          <p className="text-xs font-black uppercase text-orange-500">Commissions</p>
                          <p className="text-4xl font-black text-white mt-2">৳{stats.totalCommission}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Paid + Pending</p>
                      </div>
                      
                      <div className="p-6 rounded-3xl bg-slate-800/50 border border-white/5 col-span-2">
                          <p className="text-xs font-black uppercase text-gray-400">Total Users</p>
                          <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-slate-800/50 border border-white/5 col-span-2">
                          <p className="text-xs font-black uppercase text-gray-400">Active Models</p>
                          <p className="text-3xl font-black text-white">{profiles.length}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-yellow-900/20 border border-yellow-500/20 col-span-2">
                          <p className="text-xs font-black uppercase text-yellow-500">Pending Req</p>
                          <p className="text-3xl font-black text-white">{paymentRequests.filter(p => p.status === 'pending').length}</p>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'finance' && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                  <h2 className="text-3xl font-black mb-6">Financial Requests</h2>
                  {paymentRequests.length === 0 && <div className="p-10 text-center glass rounded-3xl text-gray-500">No requests found</div>}
                  {paymentRequests.map(req => (
                      <Card3D key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-yellow-500">
                          <div>
                              <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-xl font-black">{req.userName}</h3>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.type === 'package' ? 'bg-pink-500/20 text-pink-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {req.type === 'package' ? `📦 ${req.tier}` : `💰 Credits (${req.creditPackageId})`}
                                  </span>
                              </div>
                              <p className="text-3xl font-black text-white">৳{req.amount}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-400 font-mono">
                                  <span>Bkash: <span className="text-yellow-500">{req.bkashNumber}</span></span>
                                  <span>Trx: <span className="text-cyan-500">{req.trxId}</span></span>
                              </div>
                              {req.referralCodeUsed && <p className="text-xs text-green-400 mt-1">Ref Used: {req.referralCodeUsed}</p>}
                          </div>
                          
                          {req.status === 'pending' ? (
                            <div className="flex gap-2">
                                <Button3D onClick={() => handleApprove(req)} variant="primary" className="bg-green-600 hover:bg-green-500">Approve</Button3D>
                                <Button3D onClick={() => handleReject(req.id)} variant="glass" className="border-red-500/50 text-red-500 hover:bg-red-500/10">Reject</Button3D>
                            </div>
                          ) : (
                              <div className={`px-4 py-2 rounded-xl font-black uppercase text-xs ${req.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                  {req.status}
                              </div>
                          )}
                      </Card3D>
                  ))}
              </div>
          )}

          {activeTab === 'users' && (
              <div className="animate-in fade-in">
                  <h2 className="text-3xl font-black mb-6">User Database</h2>
                  <div className="flex gap-4 mb-6">
                      <input 
                        value={searchUser} 
                        onChange={e => setSearchUser(e.target.value)} 
                        placeholder="Search users..." 
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm w-full md:w-64"
                      />
                  </div>
                  <Card3D className="p-0 overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="text-xs uppercase font-bold text-gray-500 bg-black/20 border-b border-white/10">
                                  <tr>
                                      <th className="p-4">User</th>
                                      <th className="p-4">Email</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4">Credits</th>
                                      <th className="p-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {allUsers.filter(u => (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) || (u.email || '').toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                          <td className="p-4">
                                              <div className="flex items-center gap-3">
                                                  <img src={u.photoURL || u.avatar} className="w-8 h-8 rounded-full bg-gray-800" />
                                                  <span className="font-bold text-sm">{u.name}</span>
                                              </div>
                                          </td>
                                          <td className="p-4 text-xs text-gray-400">{u.email}</td>
                                          <td className="p-4">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                                  {u.tier || u.status}
                                              </span>
                                          </td>
                                          <td className="p-4 font-mono font-bold text-yellow-500">{u.credits}</td>
                                          <td className="p-4 flex justify-end gap-2">
                                              <button onClick={() => handleDeleteUser(u.id!)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors" title="Delete User">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </Card3D>
              </div>
          )}

          {/* ... (Other Tabs like referrals, models remain unchanged) ... */}
          {activeTab === 'referrals' && (
             <div className="animate-in fade-in">
                 {/* ... Referrals UI Code ... */}
                 {/* Reusing existing logic for Referral UI */}
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black">Referral Network</h2>
                        <p className="text-gray-400 text-sm">Manage independent influencers & user affiliates.</p>
                    </div>
                    <Button3D onClick={() => openInfluencerModal()} variant="secondary">+ New Influencer</Button3D>
                 </div>
                 <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
                    <button onClick={() => setReferralSubTab('vip')} className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${referralSubTab === 'vip' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white'}`}>VIP Influencers</button>
                    <button onClick={() => setReferralSubTab('users')} className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${referralSubTab === 'users' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}>User Affiliates</button>
                 </div>
                 {/* ... (Tables implementation same as before) ... */}
                 {referralSubTab === 'vip' && (
                  <Card3D className="p-6">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="text-xs uppercase font-bold text-gray-500 border-b border-white/10">
                                  <tr><th>Name</th><th>Code</th><th>Config</th><th>Wallet</th><th>Total Paid</th><th className="text-right">Actions</th></tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {influencers.map(inf => (
                                      <tr key={inf.id} className="hover:bg-white/5 transition-colors">
                                          <td className="p-4"><p className="font-bold text-sm">{inf.name}</p></td>
                                          <td className="p-4"><span className="font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">{inf.code}</span></td>
                                          <td className="p-4"><p className="text-[10px]">Comm: {inf.commissionRate}%</p></td>
                                          <td className="p-4 font-bold text-green-400">৳{inf.earnings}</td>
                                          <td className="p-4 font-bold text-gray-400">৳{inf.totalPaid || 0}</td>
                                          <td className="p-4 flex justify-end gap-2">
                                              <button onClick={() => openInfluencerModal(inf)} className="px-3 py-1 bg-white/5 text-xs">Edit</button>
                                              <button onClick={() => handlePayoutInfluencer(inf)} className="px-3 py-1 bg-green-500/20 text-green-500 text-xs">Pay</button>
                                              <button onClick={() => handleDeleteInfluencer(inf.id!)} className="px-3 py-1 bg-red-500/10 text-red-500 text-xs">Del</button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </Card3D>
                )}
                {referralSubTab === 'users' && (
                  <div className="space-y-6">
                      {/* PENDING WITHDRAWALS SECTION */}
                      {pendingWithdrawals.length > 0 && (
                          <Card3D className="p-6 border-green-500/50">
                              <h3 className="text-xl font-black mb-4 text-green-400 animate-pulse">Pending Withdrawal Requests ({pendingWithdrawals.length})</h3>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                      <thead className="text-xs uppercase font-bold text-gray-500 border-b border-white/10">
                                          <tr><th>User</th><th>Amount</th><th>Method</th><th>Action</th></tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                          {pendingWithdrawals.map(req => (
                                              <tr key={req.id} className="hover:bg-white/5">
                                                  <td className="p-4 font-bold text-sm">{req.userName}</td>
                                                  <td className="p-4 font-black text-xl text-white">৳{req.amount}</td>
                                                  <td className="p-4">
                                                      <span className={`px-2 py-1 rounded text-xs font-bold ${req.method === 'Bkash' ? 'bg-pink-600/20 text-pink-500' : 'bg-orange-600/20 text-orange-500'}`}>
                                                          {req.method}
                                                      </span>
                                                      <span className="block text-xs text-gray-400 font-mono mt-1">{req.number}</span>
                                                  </td>
                                                  <td className="p-4">
                                                      <Button3D onClick={() => handleApproveWithdrawal(req)} variant="primary" className="bg-green-600 hover:bg-green-500 text-xs py-2 px-4">Pay Now</Button3D>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </Card3D>
                      )}

                      <Card3D className="p-6">
                          <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">All Affiliates</h3>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="text-xs uppercase font-bold text-gray-500 border-b border-white/10"><tr><th>User</th><th>Stats</th><th>Wallet</th><th className="text-right">Info</th></tr></thead>
                                  <tbody className="divide-y divide-white/5">
                                      {allUsers.filter(u => u.referralEarnings > 0 || u.referralsCount > 0).map(u => (
                                          <tr key={u.id} className="hover:bg-white/5">
                                              <td className="p-4"><p className="font-bold text-sm">{u.name}</p></td>
                                              <td className="p-4"><p className="text-xs">{u.referralsCount} Invites</p></td>
                                              <td className="p-4 font-bold text-green-400">৳{u.referralEarnings}</td>
                                              <td className="p-4 text-right">
                                                  <span className="text-xs text-gray-500">{u.referralCode}</span>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Card3D>
                  </div>
                )}
                 {showAddInfluencer && (
                  <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                      <Card3D className="w-full max-w-lg p-8 border-green-500/30">
                          <h3 className="text-2xl font-black mb-4">{editingInfluencerId ? 'Edit Influencer' : 'Add New Influencer'}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="col-span-2">
                                  <label className="text-xs uppercase font-bold text-gray-500">Influencer Name</label>
                                  <input 
                                    value={influencerForm.name} 
                                    onChange={e => setInfluencerForm({...influencerForm, name: e.target.value})} 
                                    className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" 
                                  />
                              </div>
                              <div className="col-span-2">
                                  <label className="text-xs uppercase font-bold text-blue-400">Coupon Code</label>
                                  <input 
                                    value={influencerForm.code} 
                                    onChange={e => setInfluencerForm({...influencerForm, code: e.target.value})} 
                                    className="w-full bg-blue-900/20 p-3 rounded-xl border border-blue-500/30 text-white font-mono" 
                                  />
                              </div>
                              <div>
                                  <label className="text-xs uppercase font-bold text-green-400">Commission %</label>
                                  <input 
                                    type="number"
                                    value={influencerForm.commissionRate} 
                                    onChange={e => setInfluencerForm({...influencerForm, commissionRate: Number(e.target.value)})} 
                                    className="w-full bg-green-900/20 p-3 rounded-xl border border-green-500/30 text-white font-mono" 
                                  />
                              </div>
                              <div>
                                  <label className="text-xs uppercase font-bold text-yellow-400">Discount (Tk)</label>
                                  <input 
                                    type="number"
                                    value={influencerForm.discountAmount} 
                                    onChange={e => setInfluencerForm({...influencerForm, discountAmount: Number(e.target.value)})} 
                                    className="w-full bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/30 text-white font-mono" 
                                  />
                              </div>
                              <div>
                                  <label className="text-xs uppercase font-bold text-gray-500">Payment Method</label>
                                  <select 
                                    value={influencerForm.paymentMethod}
                                    onChange={e => setInfluencerForm({...influencerForm, paymentMethod: e.target.value})}
                                    className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white"
                                  >
                                      <option value="Bkash">Bkash</option>
                                      <option value="Nagad">Nagad</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs uppercase font-bold text-gray-500">Payment Number</label>
                                  <input 
                                    value={influencerForm.paymentNumber} 
                                    onChange={e => setInfluencerForm({...influencerForm, paymentNumber: e.target.value})} 
                                    className="w-full bg-black/50 p-3 rounded-xl border border-white/10 text-white" 
                                  />
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <Button3D onClick={handleSaveInfluencer} variant="primary" className="flex-1">{editingInfluencerId ? 'Update' : 'Create'}</Button3D>
                              <Button3D onClick={() => setShowAddInfluencer(false)} variant="glass" className="flex-1">Cancel</Button3D>
                          </div>
                      </Card3D>
                  </div>
                )}
             </div>
          )}
          
          {activeTab === 'models' && (
              <div className="animate-in fade-in">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-black">Model Management</h2>
                      <Button3D onClick={() => { setModelForm({}); setIsEditingModel(true); }} variant="secondary">+ New Model</Button3D>
                  </div>
                  
                  {isEditingModel ? (
                      <Card3D className="p-0 overflow-hidden border-blue-500/30">
                          {/* ... (Existing Model Editor UI) ... */}
                          {/* Header */}
                          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
                              <h3 className="text-xl font-black">Model Editor</h3>
                              <div className="flex gap-2">
                                  <button onClick={() => setModelTab('basic')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${modelTab === 'basic' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400'}`}>Basic</button>
                                  <button onClick={() => setModelTab('appearance')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${modelTab === 'appearance' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400'}`}>Appearance</button>
                                  <button onClick={() => setModelTab('gallery')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${modelTab === 'gallery' ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400'}`}>Gallery</button>
                                  <button onClick={() => setIsEditingModel(false)} className="ml-4 text-gray-500 hover:text-white">✕</button>
                              </div>
                          </div>

                          <div className="p-8">
                              {/* AI GENERATOR */}
                              <div className="mb-8 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 flex flex-col md:flex-row gap-4 items-center">
                                  <div className="flex-1 w-full">
                                      <label className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 block">✨ Auto Fill Generator</label>
                                      <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Theme (e.g. Village girl, Teacher)" className="w-full bg-black/40 border border-blue-500/20 rounded-xl px-4 py-2 text-white text-sm" />
                                  </div>
                                  <div className="w-full md:w-48">
                                     <label className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 block">Mode</label>
                                     <select 
                                       value={genMode} 
                                       onChange={(e) => setGenMode(e.target.value as ModelMode)}
                                       className="w-full bg-black/40 border border-blue-500/20 rounded-xl px-4 py-2 text-white text-sm"
                                     >
                                        <option value="Friend">Friend</option>
                                        <option value="Girlfriend">Girlfriend</option>
                                        <option value="Wife">Wife</option>
                                        <option value="Sexy">Sexy (18+)</option>
                                     </select>
                                  </div>
                                  <Button3D onClick={handleGenerateModel} disabled={isGenerating} variant="secondary" className="h-10 text-xs px-4 mt-5">{isGenerating ? 'Generating...' : 'Auto Fill'}</Button3D>
                              </div>

                              {modelTab === 'basic' && (
                                  <div className="grid grid-cols-2 gap-6">
                                      <div className="col-span-1 space-y-2"><label className="text-gray-500 text-xs font-bold uppercase">Name</label><input value={modelForm.name || ''} onChange={e => setModelForm({...modelForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /></div>
                                      <div className="col-span-1 space-y-2"><label className="text-gray-500 text-xs font-bold uppercase">Age</label><input type="number" value={modelForm.age || ''} onChange={e => setModelForm({...modelForm, age: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /></div>
                                      <div className="col-span-2 space-y-2">
                                          <label className="text-gray-500 text-xs font-bold uppercase">Mode (Behavior)</label>
                                          <select 
                                            value={modelForm.mode || 'Girlfriend'} 
                                            onChange={e => setModelForm({...modelForm, mode: e.target.value as ModelMode})} 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                          >
                                            <option value="Friend">Friend (Casual, No Romance)</option>
                                            <option value="Girlfriend">Girlfriend (Romantic, Sweet)</option>
                                            <option value="Wife">Wife (Caring, Domestic)</option>
                                            <option value="Sexy">Sexy (Seductive, 18+)</option>
                                          </select>
                                      </div>
                                      <div className="col-span-2 space-y-2"><label className="text-gray-500 text-xs font-bold uppercase">Avatar URL</label><input value={modelForm.image || ''} onChange={e => setModelForm({...modelForm, image: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /></div>
                                      <div className="col-span-2 space-y-2"><label className="text-gray-500 text-xs font-bold uppercase">Intro (Bangla)</label><textarea value={modelForm.intro || ''} onChange={e => setModelForm({...modelForm, intro: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-20" /></div>
                                      <div className="col-span-2 space-y-2"><label className="text-gray-500 text-xs font-bold uppercase">System Prompt (Persona)</label><textarea value={modelForm.systemPrompt || ''} onChange={e => setModelForm({...modelForm, systemPrompt: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-32 font-mono text-xs" /></div>
                                  </div>
                              )}

                              {modelTab === 'appearance' && (
                                  <div className="grid grid-cols-2 gap-6">
                                      {['ethnicity', 'bodyType', 'measurements', 'height', 'breastSize', 'outfit', 'hairStyle', 'hairColor', 'eyeColor'].map(field => (
                                          <div key={field} className="space-y-2">
                                              <label className="text-gray-500 text-xs font-bold uppercase">{field.replace(/([A-Z])/g, ' $1')}</label>
                                              <input 
                                                value={(modelForm.appearance as any)?.[field] || ''} 
                                                onChange={e => setModelForm({
                                                    ...modelForm, 
                                                    appearance: { ...modelForm.appearance, [field]: e.target.value } as any
                                                })} 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" 
                                              />
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {modelTab === 'gallery' && (
                                  <div className="space-y-8">
                                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                          <h4 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Add New Content</h4>
                                          <div className="grid grid-cols-4 gap-4 mb-4">
                                              <input value={newGalleryItem.url} onChange={e => setNewGalleryItem({...newGalleryItem, url: e.target.value})} placeholder="Image/Video URL" className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs" />
                                              <select value={newGalleryItem.type} onChange={e => setNewGalleryItem({...newGalleryItem, type: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs">
                                                  <option value="image">Image</option>
                                                  <option value="video">Video</option>
                                              </select>
                                              <div className="flex items-center gap-2">
                                                  <input type="checkbox" checked={newGalleryItem.isExclusive} onChange={e => setNewGalleryItem({...newGalleryItem, isExclusive: e.target.checked})} />
                                                  <span className="text-xs font-bold text-yellow-500">Exclusive?</span>
                                              </div>
                                          </div>
                                          
                                          {newGalleryItem.isExclusive && (
                                              <div className="grid grid-cols-4 gap-4 mb-4 animate-in fade-in">
                                                  <input type="number" value={newGalleryItem.creditCost} onChange={e => setNewGalleryItem({...newGalleryItem, creditCost: Number(e.target.value)})} placeholder="Cost" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs" />
                                                  <input value={newGalleryItem.title} onChange={e => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Title" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs" />
                                                  <input value={newGalleryItem.tease} onChange={e => setNewGalleryItem({...newGalleryItem, tease: e.target.value})} placeholder="Tease Note" className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs" />
                                                  <button onClick={handleAutoTease} disabled={isGeneratingTease} className="bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl px-2 py-1 text-[10px] font-black uppercase">
                                                      {isGeneratingTease ? '...' : '✨ Auto Tease'}
                                                  </button>
                                              </div>
                                          )}
                                          
                                          <Button3D onClick={handleAddGalleryItem} variant="secondary" className="w-full text-xs py-3">Add to Gallery</Button3D>
                                      </div>

                                      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                          {(modelForm.gallery || []).map((item, idx) => (
                                              <div key={idx} className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-white/10">
                                                  <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                                  {item.isExclusive && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[8px] font-black px-1 rounded">VIP</div>}
                                                  <button onClick={() => handleRemoveGalleryItem(item.id)} className="absolute bottom-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              <div className="mt-8 pt-6 border-t border-white/10">
                                  <Button3D onClick={handleSaveModel} variant="primary" className="w-full">Save Changes</Button3D>
                              </div>
                          </div>
                      </Card3D>
                  ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {profiles.map(p => (
                              <div key={p.id} onClick={() => { setModelForm(p); setIsEditingModel(true); setModelTab('basic'); }} className="relative group cursor-pointer">
                                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:border-pink-500 transition-all">
                                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                                      <div className="absolute bottom-3 left-3">
                                          <p className="font-black text-white">{p.name}</p>
                                          <div className="flex gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-pink-600 px-1 rounded">{p.mode || 'Girlfriend'}</span>
                                            <p className="text-[10px] text-gray-400">{p.appearance?.measurements || 'Unknown'}</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
       </div>
    </div>
  );
};
