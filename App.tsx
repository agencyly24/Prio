
import React, { useState, useEffect } from 'react';
import { Layout3D, Card3D, Button3D } from './components/Layout3D';
import { PurchasePopup } from './components/PurchasePopup';
import { UserProfile, ViewState, Model, Purchase, PaymentRequest } from './types';
import { cloudStore } from './services/cloudStore';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { PACKAGES, CREDIT_PACKAGES } from './constants';
import { gemini } from './services/geminiService';
import { AuthScreen } from './components/AuthScreen';
import { ProfileDetail } from './components/ProfileDetail';
import { ChatInterface } from './components/ChatInterface';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { UserAccount } from './components/UserAccount';
import { AdminPanel } from './components/AdminPanel';
import { CreditPurchaseModal } from './components/CreditPurchaseModal';

// --- SUB-COMPONENTS ---

const Landing = ({ onLogin }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
    <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 mb-2 drop-shadow-sm relative z-10 transform hover:scale-105 transition-transform duration-500 py-6 leading-relaxed">
      প্রিয়
    </h1>
    <p className="text-2xl md:text-3xl text-slate-600 mb-12 font-medium max-w-2xl leading-relaxed relative z-10">
      মন খুলে কথা বলার একজন <span className="text-pink-600 font-bold">আপন মানুষ</span>
    </p>
    <div className="flex flex-col gap-4 relative z-10 w-full max-w-xs">
      <Button3D onClick={onLogin} variant="primary" className="py-5 text-xl shadow-xl shadow-pink-500/20">
        প্রবেশ করুন
      </Button3D>
    </div>
  </div>
);

const UserProfileView = ({ user, onLogout, setView }: any) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (user.status === 'active' && user.packageEnd) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = user.packageEnd.toDate().getTime();
        const diff = end - now;

        if (diff < 0) {
          setTimeLeft('Expired');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${mins}m`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft('No Active Plan');
    }
  }, [user]);

  const activePkg = PACKAGES.find(p => p.id === user.packageId);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-10">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-black">My Profile</h2>
        <Button3D onClick={onLogout} variant="glass">Logout</Button3D>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card3D className="p-8 flex flex-col items-center text-center col-span-1">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-xl">
             <img src={user.photoURL} className="w-full h-full rounded-full object-cover bg-white" />
          </div>
          <h3 className="text-2xl font-black mb-1">{user.name}</h3>
          <p className="opacity-60 text-sm mb-4">{user.email}</p>
          <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
            {user.status === 'active' ? 'Premium Active' : 'Free Account'}
          </div>
        </Card3D>

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <Card3D className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <p className="opacity-60 text-xs font-bold uppercase tracking-widest mb-2">Current Plan</p>
              <h3 className={`text-2xl font-black mb-2 ${activePkg ? 'text-transparent bg-clip-text bg-gradient-to-r '+activePkg.color : 'text-white'}`}>
                {activePkg ? activePkg.name : 'Free Mode'}
              </h3>
              <p className="text-4xl font-mono font-bold text-white mb-2">{timeLeft}</p>
              <Button3D onClick={() => setView('subscription')} variant="primary" className="w-full mt-4 border-none">Upgrade Plan</Button3D>
           </Card3D>

           <Card3D className="p-6">
              <p className="opacity-60 text-xs font-bold uppercase tracking-widest mb-2">Credit Balance</p>
              <h3 className="text-5xl font-black text-yellow-500 mb-4">{user.credits}</h3>
              <p className="opacity-60 text-xs mb-4">Use credits to unlock exclusive photos & videos.</p>
              <Button3D onClick={() => setView('packages')} variant="gold" className="w-full">Buy Credits</Button3D>
           </Card3D>
           
           <Card3D className="p-6 sm:col-span-2 border-green-500/20">
              <div className="flex justify-between items-center">
                 <div>
                    <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Referral Code</p>
                    <p className="text-3xl font-mono font-black">{user.referralCode}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-1">Earnings</p>
                    <p className="text-3xl font-black">৳{user.referralEarnings}</p>
                 </div>
              </div>
           </Card3D>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ models, unlockedModels, setView, onSelectModel }: any) => {
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center">
       
       <div className="flex justify-between items-center mb-12 relative z-10 px-2">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
              সঙ্গী <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">বেছে নিন</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-2">কার সাথে আজ রাতটা কাটাতে চান? ❤️</p>
          </div>
          {/* Dashboard specific credit button - Keeping this one */}
          <div onClick={() => setView('packages')} className="cursor-pointer bg-slate-900 px-5 py-3 rounded-full shadow-xl border border-slate-800 active:scale-95 transition-transform hover:shadow-2xl flex items-center gap-3">
             <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xs">C</div>
             <span className="text-white font-bold text-sm">Credits</span>
             <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-black uppercase tracking-wider">+ ADD</span>
          </div>
       </div>

       {models.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-white/50 relative z-10">
             <p className="text-slate-400 font-bold">No models found. Check back later!</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 pb-20">
              {models.filter((m: any) => m.active !== false).map((model: Model, idx: number) => {
                const safeUnlocked = unlockedModels || [];
                const isUnlocked = safeUnlocked.includes(model.id); 
                
                const cardThemes = [
                    { 
                        bgGradient: 'from-[#ff5ac0] via-[#c646fa] to-[#6830f2]', 
                        btnGradient: 'from-pink-500 to-rose-600'
                    }, 
                    { 
                        bgGradient: 'from-[#ff0f7b] via-[#f89b29] to-[#ff0f7b]', 
                        btnGradient: 'from-orange-500 to-pink-600'
                    }, 
                    { 
                        bgGradient: 'from-[#f40076] via-[#df98fa] to-[#9055ff]', 
                        btnGradient: 'from-purple-500 to-pink-500'
                    },
                    { 
                        bgGradient: 'from-[#fa709a] via-[#fee140] to-[#fa709a]', 
                        btnGradient: 'from-rose-400 to-orange-400'
                    },
                ];
                const theme = cardThemes[idx % cardThemes.length];

                const isSexy = model.mode === 'Sexy';
                const modeBadgeStyle = isSexy 
                    ? "bg-gradient-to-r from-red-600 to-orange-600 border-red-400 shadow-md text-white" 
                    : "bg-white/80 border-emerald-400 text-emerald-600 shadow-md backdrop-blur-md";
                
                const modeIcon = isSexy ? "🔥" : "💚";

                return (
                  <div key={model.id} onClick={() => onSelectModel(model)} className="relative group cursor-pointer">
                    
                    <div className={`
                        relative w-full aspect-[9/16] rounded-[2.5rem] p-[3px]
                        bg-white/80 border border-white/60
                        transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2
                        shadow-2xl hover:shadow-pink-200/50
                    `}>
                        <div className="w-full h-full bg-slate-50 rounded-[2.3rem] flex flex-col relative overflow-hidden shadow-inner isolate">
                            
                            <div className="h-[70%] w-full relative p-1 z-10">
                                <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-md bg-white">
                                    <img 
                                        src={model.image || model.avatarImage} 
                                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
                                        alt={model.name}
                                    />
                                    
                                    <div className={`absolute top-4 right-4 ${modeBadgeStyle} px-3 py-1.5 rounded-full border flex items-center gap-1.5 z-20`}>
                                        <span className="text-sm">{modeIcon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            {model.mode || 'Girlfriend'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-between p-3 pt-0 pb-4 relative z-10">
                                
                                <div className={`
                                    relative -mt-8 z-20
                                    bg-gradient-to-r ${theme.bgGradient}
                                    px-6 py-1.5 rounded-full shadow-lg border border-white/20
                                `}>
                                    <h3 className="text-lg font-black text-white drop-shadow-sm tracking-wide">{model.name}</h3>
                                </div>

                                <div className="w-full relative mt-1 px-1">
                                    <div className="bg-white/50 border border-white/60 rounded-2xl p-2.5 backdrop-blur-sm relative overflow-hidden group-hover:bg-white/80 transition-colors">
                                        <div className="absolute -right-1 -top-1 text-xl opacity-80 animate-bounce">
                                            {isSexy ? '💋' : '💖'}
                                        </div>
                                        <p className="text-center font-black text-sm leading-tight relative z-10 text-slate-700">
                                            "{model.intro ? model.intro.substring(0, 50) : "তোমাকে খুব কাছে পেতে ইচ্ছে করছে..."}..."
                                        </p>
                                    </div>
                                </div>

                                <button className={`
                                    w-full py-3 rounded-2xl
                                    bg-gradient-to-r ${theme.btnGradient}
                                    shadow-md hover:shadow-lg
                                    active:scale-95
                                    transition-all duration-150
                                    flex items-center justify-center gap-2
                                    mt-1 text-white
                                `}>
                                    {isUnlocked ? (
                                        <>
                                            <span className="font-black text-xs uppercase tracking-[0.2em] drop-shadow-md">চলো শুরু করি</span>
                                            <span className="text-lg filter drop-shadow-md">💬</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-black text-xs uppercase tracking-[0.2em] drop-shadow-md">আনলক মি</span>
                                            <span className="text-lg animate-pulse filter drop-shadow-md">🔓</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
          </div>
       )}
    </div>
  );
};

const PackagesView = ({ onBuyCredits, onUpgrade }: any) => {
  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
       <div className="flex items-center gap-4 mb-8">
         <Button3D onClick={onUpgrade} variant="glass">Back</Button3D>
       </div>
       
       <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-2">Buy Credits</h2>
          <p className="opacity-60">Unlock exclusive photos and videos</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CREDIT_PACKAGES.map(cp => (
             <Card3D key={cp.id} className="p-8 flex flex-col items-center justify-between">
                <div className="text-center">
                   <h4 className="font-bold text-2xl mb-2">{cp.name}</h4>
                   <div className="h-24 w-24 bg-yellow-100/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/50 shadow-lg">
                      <span className="text-4xl font-black text-yellow-500">{cp.credits}</span>
                   </div>
                   <p className="opacity-60 text-sm mb-6">Instant Credits added to wallet</p>
                </div>
                <div className="w-full">
                   <p className="text-center text-2xl font-black mb-4">৳{cp.price}</p>
                   <Button3D onClick={() => onBuyCredits(cp)} variant="gold" className="w-full">Buy Now</Button3D>
                </div>
             </Card3D>
          ))}
       </div>

       <div className="mt-16 text-center p-8 bg-pink-500/10 rounded-3xl border border-pink-500/30">
          <h3 className="text-2xl font-black text-pink-500 mb-4">Want Unlimited Access?</h3>
          <p className="opacity-80 mb-6">Upgrade to Premium membership and get monthly credits + exclusive features.</p>
          <Button3D onClick={onUpgrade} variant="primary">View Membership Plans</Button3D>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  // Admin State
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  
  // Purchase State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await cloudStore.initializeUser(fbUser.uid, fbUser.email!, fbUser.displayName!, fbUser.photoURL!);
        setUser(profile);
        if (view === 'landing' || view === 'auth') setView('dashboard');
        
        // Load Models
        const ms = await cloudStore.getModels();
        setModels(ms);
      } else {
        setUser(null);
        if (view !== 'auth' && view !== 'admin-panel') setView('landing');
      }
    });
    return () => unsub();
  }, [view]);

  const handlePaymentSubmission = async (req: any) => {
    if (!user) return;
    
    const purchase: Purchase = {
       id: `pur_${Date.now()}`,
       uid: user.uid,
       userName: user.name || 'Unknown User',
       type: req.type,
       itemId: req.tier || req.creditPackageId || 'unknown_item',
       amount: req.amount,
       status: 'pending',
       paymentMethod: 'bkash',
       bkashNumber: req.bkashNumber,
       transactionId: req.trxId,
       createdAt: new Date().toISOString(),
       referralCodeUsed: req.referralCodeUsed || null
    };

    try {
      await cloudStore.createPurchase(purchase);
      setShowCreditModal(false);
      setShowSuccessPopup(true);
      setView('dashboard');
    } catch (error) {
      console.error("Payment Submission Error:", error);
      alert("পেমেন্ট রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।");
    }
  };

  const handleModelSelect = (m: Model) => {
    setSelectedModel(m);
    setView('model-view');
  };

  const handleUnlockModel = async (modelId: string): Promise<boolean> => {
     if (!user) return false;

     if (user.status !== 'active') {
       if (confirm(`এই মডেলের সাথে চ্যাট শুরু করতে একটি প্যাকেজ সাবস্ক্রাইব করুন।`)) {
         setView('subscription');
       }
       return false;
     }

     const result = await cloudStore.unlockModelSlot(user.uid, modelId);
     
     if (result.success) {
        const updatedUnlocked = [...(user.unlockedModels || []), modelId];
        setUser({ ...user, unlockedModels: updatedUnlocked });
        return true;
     } else {
        alert("আপনার প্যাকেজ লিমিট শেষ! আরও মডেল আনলক করতে প্যাকেজ আপগ্রেড করুন।");
        setView('subscription');
        return false;
     }
  };

  return (
    <Layout3D view={view}>
       {/* Top Navigation Bar - Hidden on Chat to prevent overlap with Call/Exit buttons */}
       {user && view !== 'admin-panel' && view !== 'chat' && (
         <div className="fixed top-0 left-0 w-full z-50 p-4 flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto flex gap-4">
               {/* Show Home button only when not on dashboard */}
               {view !== 'dashboard' && (
                   <button onClick={() => setView('dashboard')} className="glass px-4 py-2 rounded-full text-xs font-bold uppercase hover:bg-white/10 shadow-lg text-current">Home</button>
               )}
               {user.role === 'admin' && <button onClick={() => setView('admin-panel')} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase shadow-lg">Admin</button>}
            </div>
            <div className="pointer-events-auto flex items-center gap-4">
               {/* Credit Pill - High Contrast (Gold/Black) - Hidden on Dashboard to avoid duplicate */}
               {view !== 'dashboard' && (
                   <div onClick={() => setShowCreditModal(true)} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border border-yellow-300 px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform hover:scale-105">
                      <span className="font-black text-xs">C</span>
                      <span className="font-bold text-sm">{user.credits}</span>
                      <span className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-black">+ ADD</span>
                   </div>
               )}
               <img onClick={() => setView('account')} src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-pink-500 cursor-pointer shadow-md bg-white hover:scale-110 transition-transform" />
            </div>
         </div>
       )}

       {view === 'landing' && <Landing onLogin={() => setView('auth')} />}

       {view === 'auth' && (
         <AuthScreen 
           onBack={() => setView('landing')} 
           onAdminClick={() => setView('admin-panel')} 
         />
       )}
       
       {view === 'dashboard' && user && (
         <div className="pt-20">
            <Dashboard 
              models={models} 
              unlockedModels={user.unlockedModels || []} 
              setView={setView} 
              onSelectModel={handleModelSelect}
            />
         </div>
       )}

       {view === 'model-view' && selectedModel && user && (
         <div className="pt-20">
            <ProfileDetail
              profile={selectedModel}
              userProfile={user}
              onBack={() => setView('dashboard')}
              onStartChat={() => setView('chat')}
              onUnlockModel={handleUnlockModel} 
              onUnlockContent={async (contentId, cost) => {
                 if (user.credits < cost) return false;
                 await cloudStore.unlockContent(user.uid, contentId, cost);
                 setUser({ ...user, credits: user.credits - cost, unlockedContentIds: [...(user.unlockedContentIds || []), contentId] });
                 return true;
              }}
              onPurchaseCredits={() => setShowCreditModal(true)}
              onShowSubscription={() => setView('subscription')}
            />
         </div>
       )}

       {view === 'chat' && selectedModel && user && (
         <div className="pt-0 h-screen">
            <ChatInterface
              profile={selectedModel}
              onBack={() => setView('model-view')}
              onMenuOpen={() => {}}
              userName={user.name}
              isPremium={user.isPremium || false}
              userTier={user.tier || 'Free'}
              onUpgrade={() => setView('subscription')}
              history={chatHistory}
              onSaveHistory={setChatHistory}
            />
         </div>
       )}

       {view === 'profile' && user && (
         <div className="pt-20">
            <UserProfileView user={user} onLogout={() => signOut(auth)} setView={setView} />
         </div>
       )}

       {view === 'admin-panel' && (
          <div className="pt-0">
             <AdminPanel 
                paymentRequests={paymentRequests}
                setPaymentRequests={setPaymentRequests}
                profiles={models}
                setProfiles={setModels}
                userProfile={user}
                setUserProfile={setUser}
                onBack={() => setView(user ? 'dashboard' : 'landing')}
                isPreAuthorized={user?.role === 'admin'}
             />
          </div>
       )}

       {view === 'packages' && (
         <div className="pt-20">
            <PackagesView 
              onBuyCredits={() => setShowCreditModal(true)} 
              onUpgrade={() => setView('subscription')} 
            />
         </div>
       )}

       {view === 'subscription' && user && (
         <div className="pt-20">
             <SubscriptionPlans
                userTier={user.tier || 'Free'}
                onBack={() => setView('dashboard')}
                onSubmitPayment={handlePaymentSubmission}
             />
         </div>
       )}

       {view === 'account' && user && (
         <UserAccount
           userProfile={user}
           setUserProfile={setUser}
           onBack={() => setView('dashboard')}
           chatHistories={{}}
           profiles={models}
           onSelectProfile={handleModelSelect}
           onPurchaseCredits={() => setShowCreditModal(true)}
           onLogout={() => signOut(auth)}
         />
       )}
       
       {view === 'profile-selection' && (
         <div className="pt-20">
             <Dashboard 
              models={models} 
              unlockedModels={user?.unlockedModels || []} 
              setView={setView} 
              onSelectModel={handleModelSelect}
            />
         </div>
       )}

       {showCreditModal && (
         <CreditPurchaseModal 
            onClose={() => setShowCreditModal(false)}
            onSubmit={(req) => handlePaymentSubmission({ ...req, type: 'credits' })}
         />
       )}

       {showSuccessPopup && <PurchasePopup onClose={() => setShowSuccessPopup(false)} />}

    </Layout3D>
  );
};

export default App;
