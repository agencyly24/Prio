
import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';

interface AuthScreenProps {
  onBack: () => void;
  onAdminClick: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onAdminClick }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (!auth) throw new Error("Firebase auth is not initialized.");
      await signInWithPopup(auth, googleProvider);
      // User creation in Firestore is handled in App.tsx onAuthStateChanged listener to ensure consistency
      onBack();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("গুগল লগিন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth) throw new Error("Firebase auth is not initialized.");

      if (isRegistering) {
        if (!name) throw new Error("দয়া করে আপনার নাম লিখুন।");
        
        // 1. Firebase Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Display Name
        await updateProfile(user, { displayName: name });

        // Firestore creation handled in App.tsx

        // Auth listener in App.tsx will handle navigation
        onBack();

      } else {
        // Firebase Sign In
        await signInWithEmailAndPassword(auth, email, password);
        // Auth listener in App.tsx will handle navigation
        onBack();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "লগিন ব্যর্থ হয়েছে।";
      const errorCode = err.code;
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') msg = "ইমেইল বা পাসওয়ার্ড ভুল।";
      else if (errorCode === 'auth/email-already-in-use') msg = "এই ইমেইলটি ইতিমধ্যেই ব্যবহার করা হয়েছে।";
      else if (errorCode === 'auth/weak-password') msg = "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
      else msg = err.message || "সমস্যা হচ্ছে, আবার চেষ্টা করুন।";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-tr from-rose-950 via-slate-950 to-purple-950 overflow-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-600/20 blur-[150px] rounded-full animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md glass p-10 rounded-[3.5rem] shadow-2xl relative z-10 border border-white/10 animate-in fade-in zoom-in duration-500 backdrop-blur-3xl bg-black/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">স্বাগতম!</h2>
          <p className="text-gray-300 text-sm font-medium">
             {isRegistering ? 'নতুন একাউন্ট তৈরি করুন' : 'আড্ডা শুরু করতে লগিন করুন'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50"
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <input 
                type="email" 
                placeholder="ইমেইল এড্রেস"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50"
                required
              />
            </div>
            <div className="space-y-1">
              <input 
                type="password" 
                placeholder="পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/50"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-white text-base shadow-xl transition-all active:scale-95"
            >
              {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (isRegistering ? 'সাইন আপ করুন' : 'লগিন করুন')}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f0518] px-2 text-gray-500 font-bold">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 4.61c1.61 0 3.09.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
             </svg>
             Continue with Google
          </button>
          
          {error && <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}
          
          <div className="text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-gray-400 hover:text-white text-xs font-bold transition-colors"
            >
              {isRegistering ? 'একাউন্ট আছে? লগিন করুন' : 'নতুন একাউন্ট খুলুন'}
            </button>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full mt-8 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-[0.3em]"
        >
          ফিরে যান
        </button>

        {/* Admin Login Trigger */}
        <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <button 
              onClick={onAdminClick} 
              className="text-[10px] text-gray-700 font-bold uppercase tracking-widest hover:text-pink-500 transition-colors"
            >
              Admin Panel Login
            </button>
        </div>
      </div>
    </div>
  );
};
