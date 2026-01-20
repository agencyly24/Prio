
import React, { useState } from 'react';
import { SubscriptionTier, PaymentRequest } from '../types';

interface SubscriptionPlansProps {
  userTier: SubscriptionTier;
  onBack: () => void;
  onSubmitPayment: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userId' | 'userName'>) => void;
  pendingRequest?: PaymentRequest;
}

const PLANS = [
  {
    tier: 'Free' as SubscriptionTier,
    price: '৳০',
    features: ['Limit: ১০০ মেসেজ/দিন', 'বেসিক সঙ্গী অ্যাক্সেস', 'নো ভয়েস কলিং'],
    color: 'gray'
  },
  {
    tier: 'Gold' as SubscriptionTier,
    price: '৳১৯৯',
    features: ['আনলিমিটেড মেসেজ', 'প্রিমিয়াম গ্যালারি', 'প্রাধান্যপূর্ণ চ্যাট', 'নতুন সঙ্গী সবার আগে'],
    color: 'yellow',
    popular: true
  },
  {
    tier: 'Diamond' as SubscriptionTier,
    price: '৳৪৯৯',
    features: ['সব আনলিমিটেড', 'ভয়েস কলিং সুবিধা', 'ব্যক্তিগত সহকারি', 'রিয়েল-টাইম ভিডিও আড্ডা'],
    color: 'pink'
  }
];

const bengaliToEnglish = (str: string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.split('').map(char => {
    const index = bengaliDigits.indexOf(char);
    return index !== -1 ? index : char;
  }).join('');
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ userTier, onBack, onSubmitPayment, pendingRequest }) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !bkashNumber || !trxId) return;
    
    setIsSubmitting(true);
    
    // Convert Bengali digits to English for correct parsing
    const numericPart = selectedPlan.price.replace('৳', '');
    const englishNumeric = bengaliToEnglish(numericPart);
    const amount = parseInt(englishNumeric);

    setTimeout(() => {
      onSubmitPayment({
        tier: selectedPlan.tier,
        amount: isNaN(amount) ? 0 : amount,
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
           <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative h-24 w-24 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
           </div>
           <h2 className="text-4xl font-black text-white tracking-tighter">পেমেন্ট চেক করা হচ্ছে</h2>
           <p className="text-gray-400 text-lg leading-relaxed">
             আপনার পেমেন্ট রিকোয়েস্ট (TrxID: <span className="text-white font-mono uppercase">{pendingRequest.trxId}</span>) আমাদের কাছে পৌঁছেছে। এডমিন চেক করে ২-৫ মিনিটের মধ্যে আপনার একাউন্ট আপডেট করে দিবে।
           </p>
           <button onClick={onBack} className="w-full py-5 glass border-white/10 rounded-[2rem] font-black text-gray-500 hover:text-white transition-all">ফিরে যাই</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-12 text-white animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 flex flex-col items-center text-center">
           <button onClick={onBack} className="self-start p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5 mb-8 group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
           </button>
           <div className="inline-block px-6 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
              <span className="text-pink-500 text-[10px] font-black uppercase tracking-[0.4em]">Membership Center</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">সেরা আড্ডার অভিজ্ঞতা নিন</h1>
           <p className="text-gray-400 max-w-2xl text-lg font-medium opacity-80">নিচের প্যাকেজগুলো থেকে আপনার পছন্দেরটি বেছে নিন এবং আনলিমিটেড কথা বলার সুযোগ পান।</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           {PLANS.map((plan) => (
             <div 
               key={plan.tier}
               className={`relative glass p-10 rounded-[3.5rem] border transition-all duration-500 flex flex-col ${plan.popular ? 'border-pink-500 shadow-[0_30px_60px_-12px_rgba(236,72,153,0.3)] scale-105 z-10' : 'border-white/10 hover:border-white/20'}`}
             >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Best Value</div>
                )}
                <div className="mb-8">
                   <h3 className="text-2xl font-black mb-2">{plan.tier}</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span className="text-gray-500 font-bold">/মাস</span>
                   </div>
                </div>
                <div className="space-y-4 mb-12 flex-1">
                   {plan.features.map((f, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${plan.tier === userTier ? 'text-green-500' : 'text-pink-500'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-300 font-medium text-sm">{f}</span>
                     </div>
                   ))}
                </div>
                <button 
                  disabled={userTier === plan.tier}
                  onClick={() => plan.tier !== 'Free' && setSelectedPlan(plan)}
                  className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all ${
                    userTier === plan.tier 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                    : plan.tier === 'Free'
                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-xl hover:scale-105 active:scale-95'
                  }`}
                >
                  {userTier === plan.tier ? 'Active Now' : 'Unlock Now'}
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-2xl w-full glass p-10 rounded-[3.5rem] border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedPlan(null)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-10 text-center">
                 <div className="h-20 w-20 bg-[#e2136e] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-[#e2136e]/40">
                    <span className="text-white font-black text-3xl">b</span>
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tighter">বিকাশ পেমেন্ট গেটওয়ে</h2>
                 <p className="text-gray-400 mt-2 font-medium">নিচের নির্দেশানুযায়ী পেমেন্ট সম্পন্ন করুন</p>
              </div>

              <div className="space-y-8">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">বিকাশ নম্বর (পার্সোনাল)</span>
                       <span className="text-2xl font-black text-white font-mono tracking-tighter">01915344445</span>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">মোট পরিমাণ</span>
                       <span className="text-2xl font-black text-pink-500 font-mono tracking-tighter">{selectedPlan.price}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-1.5 w-1.5 bg-pink-500 rounded-full"></div>
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">সহজ নির্দেশনা</h4>
                    </div>
                    <ul className="text-xs text-gray-400 space-y-3 font-medium">
                       <li className="flex gap-3"><span className="text-white font-black">০১.</span> আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে <span className="text-white font-black">Send Money</span> করুন।</li>
                       <li className="flex gap-3"><span className="text-white font-black">০২.</span> সঠিক পরিমাণ (<span className="text-pink-500 font-black">{selectedPlan.price}</span>) পাঠাতে নিশ্চিত হন।</li>
                       <li className="flex gap-3"><span className="text-white font-black">০৩.</span> ট্রানজেকশন সফল হওয়ার পর নিচের ফর্মে আপনার তথ্য দিন।</li>
                    </ul>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">যে নম্বর থেকে পাঠিয়েছেন</label>
                         <input 
                           required
                           type="tel"
                           value={bkashNumber}
                           onChange={e => setBkashNumber(e.target.value)}
                           placeholder="017XXXXXXXX"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-pink-500/50 outline-none text-white font-black"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ট্রানজেকশন আইডি (TrxID)</label>
                         <input 
                           required
                           type="text"
                           value={trxId}
                           onChange={e => setTrxId(e.target.value)}
                           placeholder="Ex: BK123456"
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-pink-500/50 outline-none text-white font-black uppercase tracking-widest"
                         />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-gradient-to-r from-[#e2136e] to-[#ff4d6d] rounded-2xl font-black text-xl text-white shadow-2xl shadow-[#e2136e]/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>সাবমিট করুন</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
