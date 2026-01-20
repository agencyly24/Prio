
import React, { useState } from 'react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl relative z-10 border border-white/10">
        <button 
          onClick={onBack}
          className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          ফিরে যান
        </button>

        <h2 className="text-3xl font-black text-white mb-2">
          {isLogin ? 'আবার স্বাগতম' : 'নতুন অ্যাকাউন্ট'}
        </h2>
        <p className="text-gray-400 mb-8 text-sm">
          {isLogin ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'প্রিয়-তে আপনার যাত্রা শুরু করুন'}
        </p>

        <div className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">পুরো নাম</label>
              <input 
                type="text" 
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">ইমেইল</label>
            <input 
              type="email" 
              placeholder="example@gmail.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">পাসওয়ার্ড</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          <button 
            onClick={onLoginSuccess}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-pink-600/20 mt-4 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a2e] px-2 text-gray-500">অথবা</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" className="h-4 w-4" alt="Google" />
              <span className="text-xs font-bold text-white">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <img src="https://www.svgrepo.com/show/303114/facebook-3-logo.svg" className="h-4 w-4" alt="Facebook" />
              <span className="text-xs font-bold text-white">Facebook</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            {isLogin ? 'অ্যাকাউন্ট নেই?' : 'আগেই অ্যাকাউন্ট আছে?'} 
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-500 font-bold ml-1 hover:underline"
            >
              {isLogin ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
