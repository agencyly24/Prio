

import React, { useState } from 'react';
import { supabase } from '../services/supabase'; // Import supabase
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
  onAdminClick: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onBack, onAdminClick }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!supabase) throw new Error("Supabase client is not initialized.");

      if (isRegistering) {
        if (!name) throw new Error("দয়া করে আপনার নাম লিখুন।");
        
        // 1. Supabase Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. Save user data to 'profiles' table immediately after successful signup
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: authData.user.id, 
                email: email, 
                name: name,
                is_active: false, // Default active status as requested
                credits: 5, // Default credits
                tier: 'Free',
                is_premium: false,
                is_vip: false,
                is_admin: email === 'admin@priyo.com' // Set admin status based on email
              }
            ]);

          if (profileError) {
             console.error("Profile creation error:", profileError);
             // Alert user but continue as auth succeeded
             alert("অ্যাকাউন্ট তৈরি হয়েছে কিন্তু প্রোফাইল ডেটা সেভ করতে সমস্যা হয়েছে: " + profileError.message);
          }

          // Construct a UserProfile object to pass to onLoginSuccess
          const userProfile: UserProfile = {
              id: authData.user.id,
              name: name,
              email: authData.user.email || '', // Add email property
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name,
              bio: 'প্রিয়র সাথে আড্ডা দিতে ভালোবাসি।',
              level: 1, xp: 0, joinedDate: new Date().toLocaleDateString(),
              tier: 'Free', isPremium: false, isVIP: false, isAdmin: (email === 'admin@priyo.com'),
              credits: 5, unlockedContentIds: [],
              stats: { messagesSent: 0, hoursChatted: 0, companionsMet: 0 }
          };
          
          onLoginSuccess(userProfile);
        }
      } else {
        // Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
          // Fetch user details from profiles table
          const { data: profileData, error: profileFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileFetchError) {
             console.error("Profile fetch error during login:", profileFetchError);
             alert("লগইন সফল কিন্তু প্রোফাইল লোড করতে সমস্যা: " + profileFetchError.message);
          }
          
          const userProfile: UserProfile = {
              id: data.user.id,
              name: profileData?.name || '', // Use fetched name
              email: data.user.email || '', // Add email property
              avatar: profileData?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (profileData?.name || 'User'),
              bio: profileData?.bio || 'প্রিয়র সাথে আড্ডা দিতে ভালোবাসি।',
              level: profileData?.level || 1, 
              xp: profileData?.xp || 0, 
              joinedDate: profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
              tier: profileData?.tier || 'Free',
              isPremium: profileData?.is_premium || false,
              isVIP: profileData?.is_vip || false,
              isAdmin: profileData?.is_admin || false,
              credits: profileData?.credits || 0,
              unlockedContentIds: profileData?.unlocked_content_ids || [],
              subscriptionExpiry: profileData?.subscription_expiry,
              stats: { messagesSent: profileData?.messages_sent || 0, hoursChatted: profileData?.hours_chatted || 0, companionsMet: profileData?.companions_met || 0 }
          };

          onLoginSuccess(userProfile);
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "লগিন ব্যর্থ হয়েছে।";
      if (err.message === 'Invalid login credentials') msg = "ইমেইল বা পাসওয়ার্ড ভুল।";
      else if (err.message.includes('already registered')) msg = "এই ইমেইলটি ইতিমধ্যেই ব্যবহার করা হয়েছে।";
      else if (err.message.includes('weak password')) msg = "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
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