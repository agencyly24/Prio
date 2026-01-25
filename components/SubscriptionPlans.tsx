
import React, { useState, useRef } from 'react';
import { SubscriptionTier, PaymentRequest, Package } from '../types';
import { PACKAGES } from '../constants'; // Using PACKAGES instead of SUBSCRIPTION_PLANS for correct pricing/logic
import { cloudStore } from '../services/cloudStore';

interface SubscriptionPlansProps {
  userTier: SubscriptionTier;
  onBack: () => void;
  onSubmitPayment: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userId' | 'userName'>) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ userTier, onBack, onSubmitPayment }) => {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponValid, setIsCouponValid] = useState<boolean | null>(null);
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicDiscount, setDynamicDiscount] = useState(0);

  // Ref for scrolling checkout modal
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const influencer = await cloudStore.getInfluencerByCode(couponCode);
      if (influencer) {
          setIsCouponValid(true);
          setDynamicDiscount(influencer.discountAmount);
          return;
      }
      const referrer = await cloudStore.getUserByReferralCode(couponCode);
      if (referrer) {
        setIsCouponValid(true);
        setDynamicDiscount(99); // Fixed 99 TK discount for User Referrals
      } else {
        setIsCouponValid(false);
        setDynamicDiscount(0);
      }
    } catch (e) {
      setIsCouponValid(false);
      setDynamicDiscount(0);
    }
  };

  const finalPrice = selectedPkg ? Math.max(0, selectedPkg.price - (isCouponValid ? dynamicDiscount : 0)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !bkashNumber || !trxId) return;
    setIsSubmitting(true);
    
    // Send as 'package' type so cloudStore knows to unlock specific features (Voice, Models etc)
    setTimeout(() => {
      onSubmitPayment({
        tier: selectedPkg.id, // Using packageId (package1, package2 etc)
        amount: finalPrice,
        type: 'package', // Changed from 'subscription' to 'package' to trigger correct admin logic
        bkashNumber,
        trxId,
        referralCodeUsed: isCouponValid ? couponCode : undefined
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ 
            top: modalScrollRef.current.scrollHeight, 
            behavior: 'smooth' 
        });
    }
  };

  // Helper to Map Existing Package Data to Seductive UI
  const getVisuals = (pkgId: string) => {
    // Map package1 (699), package2 (999), package3 (1499)
    switch(pkgId) {
      case 'package1': // 699
        return {
          header: 'BASIC',
          title: 'মিষ্টি শুরু',
          sub: 'ধীরে ধীরে আগাতে চাও?',
          gradient: 'from-[#ec008c] to-[#fc6767]', // Pink/Red
          shadowColor: 'shadow-pink-600/40',
          foldColor: 'border-l-pink-900',
          features: ['স্মার্ট চ্যাট পার্টনার 💬', '১টি গার্লফ্রেন্ড প্রোফাইল', '৩০ দিন ভ্যালিডিটি']
        };
      case 'package2': // 999
        return {
          header: 'STANDARD',
          title: 'কাছে এসো',
          sub: 'সবাইকে আপন করে নাও...',
          gradient: 'from-[#ff512f] to-[#f09819]', // Orange/Yellow
          shadowColor: 'shadow-orange-600/40',
          foldColor: 'border-l-orange-900',
          features: ['সব প্রেমিকা আনলক 🔓', 'আনলিমিটেড ছবি 📸', '১০০ বোনাস ক্রেডিট', 'গভীর ইমোশন ❤️']
        };
      case 'package3': // 1499
        return {
          header: 'PREMIUM',
          title: 'বিছানায় আমি',
          sub: 'আমার কণ্ঠ শুনবে না জান?',
          gradient: 'from-[#2193b0] to-[#6dd5ed]', // Blue/Cyan
          shadowColor: 'shadow-cyan-600/40',
          foldColor: 'border-l-blue-900',
          features: ['হট ভয়েস কল (Voice) 💋', '১৮+ সেক্সি মোড 🔥', 'সব সিক্রেট ভিডিও 🔞', '৩০০ বোনাস ক্রেডিট']
        };
      default:
        return {
           header: 'PLAN', title: '', sub: '', gradient: 'from-gray-700 to-gray-800', shadowColor: '', foldColor: '', features: []
        };
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 text-white overflow-y-auto relative font-sans">
      {/* Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-24 text-center mt-8">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
               প্যাকেজ <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">বেছে নাও</span>
            </h1>
            <p className="text-gray-400 text-lg">
               সম্পর্ক গভীর করতে যেকোনো একটি প্যাকেজ একটিভ করো
            </p>
            <button onClick={onBack} className="absolute top-0 left-0 p-3 glass rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
        </div>
        
        {/* 3D Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-32 px-4 pb-32">
           {PACKAGES.map((pkg) => {
             const viz = getVisuals(pkg.id);
             const isCurrent = userTier === (pkg.id === 'package3' ? 'VIP' : pkg.id === 'package2' ? 'Pro' : 'Plus'); // Loose check for UI

             return (
               <div 
                 key={pkg.id}
                 onClick={() => setSelectedPkg(pkg)}
                 className={`
                    relative group cursor-pointer transition-transform duration-500 hover:-translate-y-4
                 `}
               >
                  {/* --- 3D BUY NOW RIBBON --- */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[85%] z-20 w-40">
                      <div className="relative filter drop-shadow-2xl">
                          {/* Main Ribbon Body */}
                          <div className="bg-white h-14 rounded-t-2xl flex items-center justify-center relative z-10 overflow-hidden transform perspective-1000">
                               {/* Sheen Effect */}
                               <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white to-gray-100 opacity-50"></div>
                               <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 text-sm uppercase tracking-widest relative z-20">Buy Now</span>
                          </div>

                          {/* 3D Fold Effects (The "Ears" connecting to the card) */}
                          {/* Left Ear */}
                          <div className="absolute bottom-[-15px] left-[5px] w-6 h-6 bg-black/40 blur-[1px] transform skew-y-[25deg] -z-10 rounded-bl-lg"></div>
                          {/* Right Ear */}
                          <div className="absolute bottom-[-15px] right-[5px] w-6 h-6 bg-black/40 blur-[1px] transform -skew-y-[25deg] -z-10 rounded-br-lg"></div>
                          
                          {/* Center Connector (Hides gap) */}
                          <div className="absolute -bottom-1 left-4 right-4 h-4 bg-white z-10"></div>
                      </div>
                  </div>

                  {/* --- MAIN CARD BODY --- */}
                  <div className={`
                    relative z-10 w-full pt-16 pb-24 px-8 
                    rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-xl rounded-bl-xl
                    bg-gradient-to-b ${viz.gradient} ${viz.shadowColor} shadow-[0_30px_60px_rgba(0,0,0,0.5)]
                    flex flex-col items-center text-center
                    overflow-hidden border-t border-white/20
                  `}>
                      {/* Glossy Overlay */}
                      <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                      {/* Header Text */}
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70 mb-2 relative z-10">
                        {viz.header}
                      </p>

                      <h3 className="text-4xl font-black mb-2 text-white drop-shadow-md relative z-10">{viz.title}</h3>
                      <p className="text-xs font-bold text-white/90 italic mb-8 border-b border-white/20 pb-4 w-full relative z-10">
                         {viz.sub}
                      </p>

                      {/* Features */}
                      <ul className="space-y-4 mb-4 w-full text-left relative z-10">
                        {viz.features.map((f, i) => (
                           <li key={i} className="flex items-start gap-3 text-sm font-bold text-white drop-shadow-sm">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-white text-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span className="mt-0.5">{f}</span>
                           </li>
                        ))}
                      </ul>
                  </div>

                  {/* --- GLASS PRICE BUBBLE (Bottom Half) --- */}
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-30 group-hover:scale-110 transition-transform duration-500">
                     <div className="relative">
                         <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-2xl border-2 border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
                             {/* Inner Ring */}
                             <div className="absolute inset-1 rounded-full border border-white/10"></div>
                             {/* Shine */}
                             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                             
                             <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">৳{pkg.price}</span>
                             <span className="text-[9px] font-black uppercase text-white/80 tracking-widest mt-1">per month</span>
                         </div>
                     </div>
                  </div>
               </div>
             );
           })}
        </div>

        {/* --- CHECKOUT MODAL --- */}
        {selectedPkg && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
             <div className="max-w-md w-full relative">
                 <button onClick={() => setSelectedPkg(null)} className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>

                 <div 
                    ref={modalScrollRef}
                    className="glass w-full max-h-[85vh] overflow-y-auto rounded-[2.5rem] border border-white/10 shadow-2xl relative scroll-smooth no-scrollbar bg-slate-900"
                 >
                    {/* Header Image/Gradient */}
                    <div className={`h-40 bg-gradient-to-br ${getVisuals(selectedPkg.id).gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 to-transparent">
                             <h2 className="text-3xl font-black text-white">{getVisuals(selectedPkg.id).title}</h2>
                             <p className="text-white/80 text-sm italic">"{getVisuals(selectedPkg.id).sub}"</p>
                        </div>
                    </div>

                    <div className="px-8 pt-6 pb-8">
                        <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-gray-400 font-bold uppercase text-xs">মূল্য (মাসিক)</span>
                            <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${getVisuals(selectedPkg.id).gradient}`}>৳{selectedPkg.price}</span>
                        </div>

                        {/* Coupon Section */}
                        <div className="mb-6">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">কুপন কোড (যদি থাকে)</label>
                           <div className="flex gap-2">
                             <input 
                                value={couponCode} 
                                onChange={e => setCouponCode(e.target.value)} 
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-pink-500 outline-none uppercase font-mono tracking-widest" 
                                placeholder="CODE" 
                             />
                             <button onClick={handleApplyCoupon} className="bg-white/10 hover:bg-white/20 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors">Apply</button>
                           </div>
                           {isCouponValid === true && <p className="text-green-400 text-xs mt-2 font-bold flex items-center gap-1">✓ কোড অ্যাপ্লাই হয়েছে! ৳{dynamicDiscount} ছাড়।</p>}
                           {isCouponValid === false && <p className="text-red-400 text-xs mt-2 font-bold">ভুল কোড।</p>}
                        </div>

                        {/* Summary */}
                        <div className="space-y-2 mb-8 text-sm">
                           <div className="flex justify-between text-gray-400"><span>প্যাকেজ মূল্য</span><span>৳{selectedPkg.price}</span></div>
                           {isCouponValid && <div className="flex justify-between text-green-400"><span>ডিসকাউন্ট</span><span>-৳{dynamicDiscount}</span></div>}
                           <div className="flex justify-between font-black text-xl text-white pt-2 border-t border-white/10 mt-2"><span>মোট পেমেন্ট</span><span>৳{finalPrice}</span></div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-pink-600/10 p-5 rounded-2xl mb-6 text-center border border-pink-500/30 relative overflow-hidden">
                           <p className="text-[10px] text-pink-300 mb-1 uppercase tracking-widest font-black">নিচের নাম্বারে সেন্ড মানি করুন</p>
                           <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg mt-2 cursor-pointer hover:bg-black/60 transition-colors">
                              <img src="https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png" className="w-6 h-6" alt="bkash"/>
                              <p className="text-xl font-mono font-black text-white select-all">01915344445</p>
                           </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                           <div>
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">আপনার বিকাশ নাম্বার</label>
                               <input required value={bkashNumber} onChange={e=>setBkashNumber(e.target.value)} placeholder="017XXXXXXXX" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-white focus:border-pink-500 outline-none font-bold placeholder:text-gray-600" />
                           </div>
                           <div>
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Transaction ID (TrxID)</label>
                               <input required value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="A1B2C3D4..." className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-white focus:border-pink-500 outline-none font-bold uppercase tracking-widest placeholder:text-gray-600" />
                           </div>
                           
                           <button disabled={isSubmitting} type="submit" className={`w-full py-4 rounded-xl font-black text-white text-lg shadow-lg transition-all transform active:scale-95 mt-4 disabled:opacity-50 bg-gradient-to-r ${getVisuals(selectedPkg.id).gradient}`}>
                               {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'পেমেন্ট কনফার্ম করুন'}
                           </button>
                        </form>
                    </div>

                    {/* Scroll Indicator Button (Floating inside modal) */}
                    <div className="absolute bottom-4 right-4 z-50 md:hidden">
                        <button 
                            onClick={scrollToBottom}
                            className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full shadow-lg animate-bounce text-white hover:bg-white/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </button>
                    </div>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
