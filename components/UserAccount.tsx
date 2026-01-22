
import React, { useState, useMemo } from 'react';
import { UserProfile, Message, GirlfriendProfile } from '../types';

interface UserAccountProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onBack: () => void;
  chatHistories: Record<string, Message[]>;
  profiles: GirlfriendProfile[];
  onSelectProfile: (profile: GirlfriendProfile) => void;
  onPurchaseCredits: () => void;
}

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sawyer',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigger',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Boots',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pumpkin',
];

export const UserAccount: React.FC<UserAccountProps> = ({ 
  userProfile, 
  setUserProfile, 
  onBack,
  chatHistories,
  profiles,
  onSelectProfile,
  onPurchaseCredits
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [editedBio, setEditedBio] = useState(userProfile.bio);

  const handleSave = () => {
    setUserProfile({
      ...userProfile,
      name: editedName,
      bio: editedBio
    });
    setIsEditing(false);
  };

  const handleAvatarSelect = (url: string) => {
    setUserProfile({ ...userProfile, avatar: url });
  };

  // Get active companions sorted by last message time
  const activeCompanions = useMemo(() => {
    const interactedProfileIds = Object.keys(chatHistories);
    return profiles
      .filter(p => interactedProfileIds.includes(p.id))
      .map(p => ({
        ...p,
        lastMessage: chatHistories[p.id][chatHistories[p.id].length - 1],
        messageCount: chatHistories[p.id].length
      }))
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [chatHistories, profiles]);

  // Calculate Days Remaining
  const daysRemaining = useMemo(() => {
    if (!userProfile.subscriptionExpiry) return 0;
    const expiry = new Date(userProfile.subscriptionExpiry);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [userProfile.subscriptionExpiry]);

  const StatItem = ({ label, value, colorClass }: { label: string, value: string | number, colorClass: string }) => (
    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-1 group hover:bg-white/10 transition-all cursor-default shadow-lg">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
      <span className={`text-2xl md:text-3xl font-black ${colorClass} tracking-tighter`}>{value}</span>
    </div>
  );

  return (
    // Updated Background: Premium gradient
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black text-white p-4 md:p-8 lg:p-12 animate-in fade-in duration-700 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">My Dashboard</h1>
          <div className="w-12"></div> {/* Spacer for symmetry */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Profile Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-[3rem] border-white/10 flex flex-col items-center text-center relative overflow-hidden group shadow-2xl bg-black/20">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-600 to-rose-500"></div>
              
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 p-1.5 shadow-[0_0_40px_rgba(236,72,153,0.3)] group-hover:scale-105 transition-transform duration-500">
                  <img src={userProfile.avatar} className="w-full h-full rounded-full bg-slate-900" alt="Avatar" />
                </div>
                <div className="absolute bottom-2 right-2 h-10 w-10 bg-pink-600 rounded-full border-4 border-slate-900 flex items-center justify-center text-white shadow-lg">
                   <span className="text-xs font-black">Lv {userProfile.level}</span>
                </div>
              </div>

              <h2 className="text-3xl font-black mb-2">{userProfile.name}</h2>
              <p className="text-pink-200/60 text-sm leading-relaxed mb-6 italic">"{userProfile.bio}"</p>
              
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                 <div className="bg-gradient-to-r from-pink-600 to-rose-500 h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
              </div>
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
                 <span>XP: {userProfile.xp} / 1000</span>
                 <span>Level Progress</span>
              </div>

              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-8 px-8 py-3 glass rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 w-full"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    className="mt-8 px-8 py-3 bg-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-600/30 active:scale-95 transition-all w-full"
                  >
                    Save Changes
                  </button>
                )}
            </div>

            {/* Profile Edit Mode */}
            {isEditing && (
              <div className="glass p-8 rounded-[2rem] border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4 bg-black/30">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nickname</label>
                    <input 
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-pink-500/50 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bio</label>
                    <textarea 
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-pink-500/50 outline-none transition-all font-medium text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Change Avatar</label>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {AVATARS.map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleAvatarSelect(url)}
                          className={`w-10 h-10 rounded-full p-0.5 transition-all ${userProfile.avatar === url ? 'bg-pink-600 scale-110 shadow-lg' : 'bg-white/5 hover:bg-white/10 grayscale hover:grayscale-0'}`}
                        >
                          <img src={url} className="w-full h-full rounded-full bg-slate-900" alt="Avatar option" />
                        </button>
                      ))}
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Dashboard Widgets */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Top Row: Subscription & Wallet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Subscription Card */}
               <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${userProfile.isPremium ? 'glass border-yellow-500/30 bg-yellow-900/10' : 'glass border-white/5 bg-black/20'}`}>
                  {userProfile.isPremium && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">Premium Active</div>}
                  
                  <div className="flex flex-col h-full justify-between gap-6">
                     <div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Current Plan</p>
                        <h3 className={`text-3xl font-black ${userProfile.isPremium ? 'text-white' : 'text-gray-300'}`}>
                           {userProfile.tier === 'Free' ? 'Free Starter' : userProfile.tier}
                        </h3>
                     </div>

                     {userProfile.isPremium ? (
                        <div>
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-sm font-bold text-gray-400">Expires in</span>
                              <span className="text-2xl font-black text-yellow-500">{daysRemaining} Days</span>
                           </div>
                           <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full rounded-full" style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}></div>
                           </div>
                        </div>
                     ) : (
                        <p className="text-sm text-gray-400">Upgrade to Premium to unlock unlimited chat & voice calls.</p>
                     )}
                  </div>
               </div>

               {/* Wallet Card */}
               <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black border border-white/10 relative overflow-hidden flex flex-col justify-between gap-6 shadow-xl">
                  <div>
                     <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Credit Balance</p>
                     <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black">C</div>
                        <h3 className="text-4xl font-black text-white">{userProfile.credits}</h3>
                     </div>
                  </div>
                  <button 
                    onClick={onPurchaseCredits}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/5 font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Get More Credits</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
               </div>
            </div>

            {/* Recent Conversations */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Recent Connections</h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">{activeCompanions.length} Models</span>
               </div>
               
               {activeCompanions.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                     {activeCompanions.map(profile => (
                        <div 
                          key={profile.id} 
                          onClick={() => onSelectProfile(profile)}
                          className="flex-shrink-0 w-64 glass p-4 rounded-[2rem] border border-white/5 cursor-pointer hover:bg-white/10 transition-all group bg-black/20"
                        >
                           <div className="flex items-center gap-4 mb-3">
                              <img src={profile.image} className="h-12 w-12 rounded-full object-cover border border-white/10" />
                              <div className="overflow-hidden">
                                 <h4 className="font-bold text-sm truncate">{profile.name}</h4>
                                 <p className="text-[10px] text-gray-400 truncate">{new Date(profile.lastMessage.timestamp).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <p className="text-xs text-gray-300 line-clamp-2 bg-black/20 p-3 rounded-xl border border-white/5 italic">
                             "{profile.lastMessage.text}"
                           </p>
                           <div className="mt-3 flex justify-end">
                              <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest group-hover:underline">Chat Now</span>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="glass p-8 rounded-[2rem] border border-white/5 text-center bg-black/20">
                     <p className="text-gray-500 text-sm">No conversations yet.</p>
                  </div>
               )}
            </div>

            {/* Detailed Stats */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white px-2">Your Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <StatItem label="Total Messages" value={userProfile.stats.messagesSent} colorClass="text-pink-500" />
                <StatItem label="Hours Chatting" value={userProfile.stats.hoursChatted} colorClass="text-blue-500" />
                <StatItem label="Companions Met" value={userProfile.stats.companionsMet} colorClass="text-purple-500" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
