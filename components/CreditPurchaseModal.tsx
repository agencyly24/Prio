
import React, { useState } from 'react';
import { CreditPackage, PaymentRequest } from '../types';
import { CREDIT_PACKAGES } from '../constants';

interface CreditPurchaseModalProps {
  onClose: () => void;
  onSubmit: (request: Omit<PaymentRequest, 'id' | 'status' | 'timestamp' | 'userId' | 'userName'>) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ onClose, onSubmit }) => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !bkashNumber || !trxId) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        creditPackageId: selectedPackage.id,
        amount: selectedPackage.price,
        discountApplied: 0,
        bkashNumber,
        trxId,
        tier: undefined
      });
      setIsSubmitting(false);
      onClose();
      alert('আপনার পেমেন্ট রিকোয়েস্ট জমা হয়েছে। এডমিন চেক করে ক্রেডিট যোগ করে দিবে।');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-4xl w-full glass rounded-[3rem] border-white/10 overflow-hidden relative flex flex-col md:flex-row h-[85vh]">
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-3 bg-black/40 rounded-full hover:bg-white/20 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left Side: Packages */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-900/50">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2 uppercase tracking-tighter">Get Credits</h2>
          <p className="text-gray-400 text-sm mb-8">এক্সক্লুসিভ কন্টেন্ট আনলক করতে ক্রেডিট কিনুন</p>

          <div className="space-y-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-6 rounded-[2rem] border transition-all cursor-pointer group ${selectedPackage?.id === pkg.id ? 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 right-6 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    {pkg.badge}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-yellow-400 transition-colors">{pkg.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-black font-black text-xs">C</span>
                      </div>
                      <span className="text-yellow-500 font-black text-xl">{pkg.credits}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">৳{pkg.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Payment */}
        <div className="flex-1 p-8 md:p-12 bg-black/60 flex flex-col justify-center">
          {selectedPackage ? (
            <div className="animate-in slide-in-from-right duration-300">
               <div className="text-center mb-8">
                  <div className="h-16 w-16 bg-[#e2136e] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl">
                    <span className="text-white font-black text-2xl">b</span>
                  </div>
                  <h3 className="text-xl font-black text-white">Bkash Payment</h3>
                  <p className="text-yellow-500 font-bold mt-1">Pay ৳{selectedPackage.price}</p>
                  <p className="text-gray-500 text-xs mt-4 font-mono">Send Money: 01915344445</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bkash Number</label>
                    <input required type="tel" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} placeholder="017XXXXXXXX" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-yellow-500/50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">TrxID</label>
                    <input required type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="Ex: X9Y7Z..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest outline-none focus:border-yellow-500/50" />
                 </div>
                 
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full py-5 bg-gradient-to-r from-yellow-600 to-amber-500 rounded-2xl font-black text-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all mt-4"
                 >
                   {isSubmitting ? 'Processing...' : 'Confirm Purchase'}
                 </button>
               </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <p className="text-gray-400 font-bold">Please select a package<br/>from the left to proceed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
