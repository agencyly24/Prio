
import React from 'react';

interface AgeVerificationScreenProps {
  onConfirm: () => void;
  onBack: () => void;
}

export const AgeVerificationScreen: React.FC<AgeVerificationScreenProps> = ({ onConfirm, onBack }) => {
  return (
    // Updated Background: Deep mysterious dark violet/black
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-b from-slate-950 via-[#1a0515] to-slate-950 overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-pink-900/10 blur-[150px] rounded-full"></div>
      
      <div className="w-full max-w-lg glass p-12 rounded-[3.5rem] shadow-2xl relative z-10 border border-white/5 animate-in fade-in zoom-in duration-700 text-center bg-black/20 backdrop-blur-2xl">
        <div className="mb-10">
          <div className="inline-flex p-6 rounded-[2.5rem] bg-gradient-to-br from-pink-600/20 to-rose-600/20 mb-8 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-5xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">একটি ঘোষণা</h2>
          <p className="text-pink-100/80 text-lg leading-relaxed font-medium">
            এই অ্যাপটি <span className="text-pink-500 font-black">১৮+</span> ইউজারদের জন্য ডিজাইন করা হয়েছে। এখানে গভীর এবং রোমান্টিক কথোপকথন হতে পারে।
          </p>
          <p className="text-white font-bold mt-6 text-xl">
            আপনার বয়স কি ১৮ বছরের বেশি?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onConfirm}
            className="w-full py-6 bg-gradient-to-r from-pink-600 to-rose-600 rounded-[2rem] font-black text-white text-xl shadow-2xl shadow-pink-600/30 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            হ্যাঁ, আমি ১৮+
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-5 glass border-white/10 rounded-[2rem] font-bold text-gray-500 hover:text-white transition-all text-sm uppercase tracking-widest hover:bg-white/5"
          >
            না, ফিরে যাবো
          </button>
        </div>

        <p className="mt-10 text-[10px] text-gray-600 uppercase tracking-widest font-black">
          By continuing you agree to our mature content policy.
        </p>
      </div>
    </div>
  );
};
