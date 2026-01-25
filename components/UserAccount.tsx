
import React, { useState } from 'react';
import { UserProfile, Message, GirlfriendProfile, WithdrawalRequest } from '../types';
import { cloudStore } from '../services/cloudStore';

interface UserAccountProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onBack: () => void;
  chatHistories: Record<string, Message[]>;
  profiles: GirlfriendProfile[];
  onSelectProfile: (profile: GirlfriendProfile) => void;
  onPurchaseCredits: () => void;
  onLogout: () => void;
}

export const UserAccount: React.FC<UserAccountProps> = ({ 
  userProfile, onBack, onPurchaseCredits, onLogout, profiles, onSelectProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'companions' | 'referrals'>('profile');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'Bkash' | 'Nagad'>('Bkash');
  const [withdrawNumber, setWithdrawNumber] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const copyRefCode = () => {
    navigator.clipboard.writeText(userProfile.referralCode);
    alert("Coupon Code Copied: " + userProfile.referralCode);
  };

  const unlockedModelsList = profiles.filter(m => userProfile.unlockedModels.includes(m.id));

  const handleWithdrawRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!withdrawNumber || userProfile.referralEarnings < 1000) return;

      setIsWithdrawing(true);
      try {
          const request: WithdrawalRequest = {
              id: `wd_${Date.now()}`,
              userId: userProfile.uid,
              userName: userProfile.name,
              amount: userProfile.referralEarnings, // Requesting full amount
              method: withdrawMethod,
              number: withdrawNumber,
              status: 'pending',
              createdAt: new Date().toISOString()
          };
          
          await cloudStore.createWithdrawalRequest(request);
          alert("Withdrawal Request Sent! Admin will verify and pay shortly.");
          setShowWithdrawModal(false);
          // UI will allow request again only when updated from backend, but for now we close modal
      } catch (e) {
          console.error(e);
          alert("Error sending request.");
      } finally {
          setIsWithdrawing(false);
      }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 text-white">
       <div className="max-w-4xl mx-auto">
         <header className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="p-3 glass rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></button>
            <h1 className="text-2xl font-bold">Account</h1>
            <button onClick={onLogout} className="text-red-500 font-bold text-sm">Logout</button>
         </header>

         <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-pink-600' : 'bg-gray-800 text-gray-400'}`}>Profile</button>
            <button onClick={() => setActiveTab('companions')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'companions' ? 'bg-purple-600' : 'bg-gray-800 text-gray-400'}`}>My Companions ({unlockedModelsList.length})</button>
            <button onClick={() => setActiveTab('referrals')} className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'referrals' ? 'bg-green-600' : 'bg-gray-800 text-gray-400'}`}>Referrals & Earn</button>
         </div>

         {activeTab === 'profile' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="glass p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 border border-white/10">
                 <img src={userProfile.avatar} className="w-24 h-24 rounded-full bg-gray-800 object-cover" />
                 <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                    <p className="text-gray-400">{userProfile.email}</p>
                    <div className="mt-2 flex gap-2 justify-center md:justify-start">
                       <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded text-xs font-bold uppercase">{userProfile.tier} User</span>
                       {userProfile.role === 'admin' && <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase">Admin</span>}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg></div>
                    <p className="text-gray-500 text-xs font-bold uppercase z-10 relative">Wallet Balance</p>
                    <p className="text-3xl font-black text-white z-10 relative">{userProfile.credits} <span className="text-base font-normal text-gray-400">Credits</span></p>
                    <button onClick={onPurchaseCredits} className="mt-2 text-pink-500 text-xs font-bold hover:underline z-10 relative">+ Buy Credits</button>
                 </div>
                 <div className="glass p-6 rounded-2xl border border-white/10">
                    <p className="text-gray-500 text-xs font-bold uppercase">Membership Status</p>
                    <p className="text-xl font-bold text-white">{userProfile.isPremium ? 'Active Premium' : 'Free Account'}</p>
                    {userProfile.subscriptionExpiry && <p className="text-xs text-gray-400 mt-1">Expires: {new Date(userProfile.subscriptionExpiry).toLocaleDateString()}</p>}
                 </div>
              </div>
           </div>
         )}
         
         {activeTab === 'companions' && (
           <div className="animate-in fade-in">
              {unlockedModelsList.length === 0 ? (
                 <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-gray-400 font-bold mb-4">No companions unlocked yet.</p>
                    <button onClick={onBack} className="text-pink-500 font-bold">Go to Dashboard</button>
                 </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {unlockedModelsList.map(model => (
                      <div key={model.id} onClick={() => onSelectProfile(model)} className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group border border-white/10 hover:border-pink-500/50 transition-all">
                          <img src={model.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                          <div className="absolute bottom-3 left-3">
                              <p className="font-black text-white">{model.name}</p>
                              <span className="text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                          </div>
                      </div>
                    ))}
                </div>
              )}
           </div>
         )}

         {activeTab === 'referrals' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-8 rounded-3xl border border-green-500/30 text-center relative overflow-hidden">
                 <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-green-500/20 blur-[60px] rounded-full"></div>
                 
                 <h2 className="text-3xl font-black text-green-400 mb-2">Invite & Earn 10%</h2>
                 <p className="text-gray-300 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                    Share your <span className="text-white font-bold">Coupon Code</span>. When friends use it to buy a package, they get <span className="text-yellow-400 font-bold">৳99 Discount</span> and you earn <span className="text-green-400 font-bold">10% commission</span> instantly!
                 </p>
                 
                 <div onClick={copyRefCode} className="bg-black/40 hover:bg-black/60 p-4 rounded-xl inline-flex flex-col items-center border border-green-500/30 mb-8 cursor-pointer transition-all active:scale-95 group">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Your Coupon Code (Click to Copy)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-2xl font-mono font-black text-white tracking-widest">{userProfile.referralCode}</p>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                       <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Friends Joined</p>
                       <p className="text-3xl font-black text-white">{userProfile.referralsCount || 0}</p>
                    </div>
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                       <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Earnings</p>
                       <p className="text-3xl font-black text-green-400">৳{userProfile.referralEarnings}</p>
                    </div>
                 </div>
                 
                 <div className="mt-8">
                    {userProfile.referralEarnings >= 1000 ? (
                        <button 
                            onClick={() => setShowWithdrawModal(true)}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-green-500/50 shadow-lg shadow-green-600/20 transform active:scale-95 transition-all"
                        >
                            Withdraw ৳{userProfile.referralEarnings}
                        </button>
                    ) : (
                        <button disabled className="bg-white/5 text-gray-500 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/5 cursor-not-allowed">
                            Withdraw (Min ৳1000)
                        </button>
                    )}
                    <p className="text-[10px] text-gray-500 mt-2">Payouts are processed weekly via Bkash / Nagad</p>
                 </div>
              </div>
           </div>
         )}
       </div>

       {/* Withdrawal Modal */}
       {showWithdrawModal && (
           <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-[#1a0515] w-full max-w-md p-8 rounded-[2rem] border border-white/10 relative shadow-2xl">
                   <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">✕</button>
                   
                   <h3 className="text-2xl font-black text-white mb-2">Withdraw Earnings</h3>
                   <p className="text-green-400 font-bold mb-6">Available: ৳{userProfile.referralEarnings}</p>
                   
                   <form onSubmit={handleWithdrawRequest} className="space-y-4">
                       <div>
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payment Method</label>
                           <div className="grid grid-cols-2 gap-4 mt-2">
                               <div onClick={() => setWithdrawMethod('Bkash')} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-center gap-2 ${withdrawMethod === 'Bkash' ? 'bg-pink-600/20 border-pink-500' : 'bg-black/40 border-white/10'}`}>
                                   <img src="https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png" className="w-5 h-5"/>
                                   <span className="font-bold text-sm">Bkash</span>
                               </div>
                               <div onClick={() => setWithdrawMethod('Nagad')} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-center gap-2 ${withdrawMethod === 'Nagad' ? 'bg-orange-600/20 border-orange-500' : 'bg-black/40 border-white/10'}`}>
                                    <span className="font-bold text-sm">Nagad</span>
                               </div>
                           </div>
                       </div>
                       
                       <div>
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Number</label>
                           <input 
                             required 
                             type="tel"
                             value={withdrawNumber} 
                             onChange={e => setWithdrawNumber(e.target.value)} 
                             placeholder="01XXXXXXXXX" 
                             className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white mt-1 focus:border-green-500 outline-none font-bold"
                           />
                       </div>

                       <button 
                         type="submit" 
                         disabled={isWithdrawing}
                         className="w-full py-4 bg-green-600 rounded-xl font-black text-white text-sm uppercase tracking-widest shadow-lg mt-4"
                       >
                           {isWithdrawing ? 'Sending Request...' : 'Confirm Request'}
                       </button>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};
