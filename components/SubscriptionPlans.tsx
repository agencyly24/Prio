
import React, { useState, useMemo } from 'react';
import { SubscriptionTier, PaymentRequest, SubscriptionPlan, ReferralProfile } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';

interface SubscriptionPlansProps {
  userTier: SubscriptionTier;
  referrals: ReferralProfile[]; // New prop to check valid coupons
  onBack: () => void;
  onSubmitPayment: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userId' | 'userName'>) => void;
  pendingRequest?: PaymentRequest;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ userTier, referrals, onBack, onSubmitPayment, pendingRequest }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [activeReferral, setActiveReferral] = useState<ReferralProfile | null>(null);
  const [isCouponValid, setIsCouponValid] = useState<boolean | null>(null);
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discountAmount = useMemo(() => {
    if (isCouponValid && activeReferral) {
      return activeReferral.discountAmount;
    }
    return 0;
  }, [isCouponValid, activeReferral]);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const foundReferral = referrals.find(r => r.couponCode === code && r.status === 'active');
    
    if (foundReferral) {
      setIsCouponValid(true);
      setActiveReferral(foundReferral);
    } else {
      setIsCouponValid(false);
      setActiveReferral(null);
      setTimeout(() => setIsCouponValid(null), 2000);
    }
  };

  const finalPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    return Math.max(0, selectedPlan.price - discountAmount);
  }, [selectedPlan, discountAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !bkashNumber || !trxId) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitPayment({
        tier: selectedPlan.id,
        amount: finalPrice,
        discountApplied: discountAmount,
        couponUsed: isCouponValid && activeReferral ? activeReferral.couponCode : undefined,
        referralId: activeReferral?.id, // Passing the referral link so admin knows which rate to apply
        bkashNumber,
        trxId
      });
      setIsSubmitting(false);
      setSelectedPlan(null);
    }, 1500);
  };

  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-[#020617] p-8 flex items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full glass p-12 rounded-[3.5rem] border-white/10 text-center space-y-8">
           <div className="relative h-24 w-24 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h2 className="text-4xl font-black text-white tracking-tighter">পেমেন্ট চেক করা হচ্ছে</h2>
           <p className="text-gray-400 text-lg">আপনার পেমেন্ট রিকোয়েস্ট (TrxID: <span className="text-white font-mono">{pendingRequest.trxId}</span>) আমাদের কাছে পৌঁছেছে। এডমিন চেক করে ২-৫ মিনিটের মধ্যে আপনার একাউন্ট আপডেট করে দিবে।</p>
           <button onClick={onBack} className="w-full py-5 glass border-white/10 rounded-[2rem] font-black text-gray-500 hover:text-white transition-all">ফিরে যাই</button>
        </div>
      </div>
    );
  }

  return (
    // Updated Background: Richer, deeper gradient
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 md:p-12 text-white animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 flex flex-col items-center text-center">
           <button onClick={onBack} className="self-start p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5 mb-8 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
           </button>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">সেরা আড্ডার অভিজ্ঞতা নিন</h1>
           <p className="text-pink-100/70 max-w-2xl text-lg opacity-80">নিচের প্যাকেজগুলো থেকে আপনার পছন্দেরটি বেছে নিন এবং আনলিমিটেড কথা বলার সুযোগ পান।</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           {SUBSCRIPTION_PLANS.map((plan) => (
             <div 
               key={plan.id}
               className={`relative glass p-10 rounded-[3.5rem] border transition-all duration-500 flex flex-col ${plan.id === 'VIP' ? 'border-yellow-500 shadow-[0_30px_60px_-12px_rgba(234,179,8,0.2)] scale-105 z-10 bg-gradient-to-b from-yellow-900/10 to-black/40' : 'border-white/10 hover:border-white/20 bg-black/20'}`}
             >
                {plan.id === 'VIP' && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-amber-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl text-black">Most Exclusive</div>
                )}
                <div className="mb-8">
                   <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-gradient">৳{plan.price}</span>
                      <span className="text-gray-500 font-bold">/মাস</span>
                   </div>
                </div>
                <div className="space-y-4 mb-12 flex-1">
                   {plan.features.map((f, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${plan.id === 'VIP' ? 'text-yellow-500' : 'text-pink-500'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-300 font-medium text-sm">{f}</span>
                     </div>
                   ))}
                </div>
                <button 
                  disabled={userTier === plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all ${
                    userTier === plan.id 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                    : plan.id === 'VIP' 
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-400 text-black shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-xl hover:scale-105 active:scale-95'
                  }`}
                >
                  {userTier === plan.id ? 'অ্যাক্টিভ আছে' : 'আনলক করুন'}
                </button>
             </div>
           ))}
        </div>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-2xl w-full glass p-10 rounded-[3.5rem] border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh] bg-slate-900/50">
              <button onClick={() => {setSelectedPlan(null); setCouponCode(''); setIsCouponValid(null); setActiveReferral(null);}} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-8 text-center">
                 <div className="h-20 w-20 bg-[#e2136e] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl">
                    <span className="text-white font-black text-3xl">b</span>
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tighter">বিকাশ পেমেন্ট</h2>
                 <p className="text-gray-400 mt-1">{selectedPlan.name}</p>
              </div>

              {/* Coupon System */}
              <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">আপনার কি কোনো কুপন আছে?</label>
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="Ex: RIYA99"
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-pink-500/50 outline-none text-white font-black uppercase tracking-widest"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Apply
                    </button>
                 </div>
                 {isCouponValid === true && <p className="text-green-500 text-[10px] font-black mt-2">🎉 কুপন সফল! {activeReferral?.name} এর পক্ষ থেকে ৳{activeReferral?.discountAmount} ডিসকাউন্ট পাওয়া গেছে।</p>}
                 {isCouponValid === false && <p className="text-red-500 text-[10px] font-black mt-2">❌ কুপনটি সঠিক নয় বা বর্তমানে ইন-অ্যাক্টিভ আছে।</p>}
              </div>

              <div className="space-y-6">
                 <div className="bg-black/20 border border-white/10 p-8 rounded-[2.5rem] space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">বিকাশ নম্বর (পার্সোনাল)</span>
                       <span className="text-2xl font-black text-white font-mono">01915344445</span>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">প্যাকেজ মূল্য</span>
                       <span className={`text-xl font-black ${discountAmount > 0 ? 'text-gray-400 line-through' : 'text-white'}`}>৳{selectedPlan.price}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                         <span className="text-pink-500 font-black uppercase text-[10px] tracking-widest">ডিসকাউন্ট</span>
                         <span className="text-xl font-black text-pink-500">-৳{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                       <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">মোট পরিশোধযোগ্য</span>
                       <span className="text-3xl font-black text-green-400">৳{finalPrice}</span>
                    </div>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">আপনার বিকাশ নম্বর</label>
                         <input required type="tel" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} placeholder="017XXXXXXXX" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white font-black" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ট্রানজেকশন আইডি (TrxID)</label>
                         <input required type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="Ex: BK12345" className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest" />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-gradient-to-r from-[#e2136e] to-[#ff4d6d] rounded-2xl font-black text-xl text-white shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'সাবমিট করুন'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
