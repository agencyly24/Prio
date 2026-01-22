
import React, { useState, useEffect } from 'react';
import { GirlfriendProfile, ProfileGalleryItem, UserProfile } from '../types';
import { CreditPurchaseModal } from './CreditPurchaseModal';

interface ProfileDetailProps {
  profile: GirlfriendProfile;
  userProfile: UserProfile;
  onBack: () => void;
  onStartChat: () => void;
  onUnlockContent: (contentId: string, cost: number) => boolean;
  onPurchaseCredits: (show: boolean) => void;
  onShowSubscription: () => void; // New Prop for redirecting to subscription
}

export const ProfileDetail: React.FC<ProfileDetailProps> = ({ 
  profile, 
  userProfile, 
  onBack, 
  onStartChat,
  onUnlockContent,
  onPurchaseCredits,
  onShowSubscription
}) => {
  // Default active tab set to 'appearance' as requested
  const [activeTab, setActiveTab] = useState<'appearance' | 'gallery'>('appearance');
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<ProfileGalleryItem | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  
  // Image Slider State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Combine main image and gallery images for the slider (Only unlocked public images)
  const sliderImages = [
    { type: 'image', url: profile.image, id: 'main' }, 
    ...profile.gallery.filter(item => item.type === 'image' && !item.isExclusive) 
  ];

  // Reset slider when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile.id]);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % sliderImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const handleContentClick = (item: ProfileGalleryItem) => {
    if (!item.isExclusive || (item.id && userProfile.unlockedContentIds.includes(item.id))) {
      setSelectedLightboxMedia(item);
    } else {
      setUnlockingId(item.id || null);
    }
  };

  const confirmUnlock = (item: ProfileGalleryItem) => {
    if (!item.id || !item.creditCost) return;
    const success = onUnlockContent(item.id, item.creditCost);
    if (success) {
      setUnlockingId(null);
    } else {
      onPurchaseCredits(true);
    }
  };

  // Logic to handle Chat Start with Gatekeeping
  const handleStartChatClick = () => {
    if (userProfile.tier === 'Free') {
      // Trigger Subscription Modal/Page if user is Free
      // Removed confirm dialog for smoother UX - directs immediately to subscription page
      onShowSubscription();
    } else {
      // Allow entry if Premium/VIP
      onStartChat();
    }
  };

  const AttributeCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-white/5 border border-white/5 p-5 rounded-3xl flex flex-col gap-1 hover:bg-white/10 transition-colors group shadow-lg">
      <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] group-hover:text-pink-300 transition-colors">{label}</span>
      <span className="text-base font-black text-white">{value}</span>
    </div>
  );

  return (
    // Updated Background: Rich dark gradient to match global theme
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-4 md:p-10 animate-in fade-in duration-500 relative">
      {/* Lightbox Modal */}
      {selectedLightboxMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
          onClick={() => setSelectedLightboxMedia(null)}
        >
          <div className="max-w-4xl w-full h-full flex items-center justify-center relative">
             <button className="absolute top-0 right-0 p-4 text-white/50 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            {selectedLightboxMedia.type === 'image' ? (
              <img src={selectedLightboxMedia.url} className="max-h-full max-w-full rounded-3xl shadow-2xl object-contain border border-white/10" alt="Preview" />
            ) : (
              <video src={selectedLightboxMedia.url} controls autoPlay className="max-h-full max-w-full rounded-3xl shadow-2xl border border-white/10" />
            )}
          </div>
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {unlockingId && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-sm w-full glass p-8 rounded-[2.5rem] border-white/10 text-center relative overflow-hidden bg-black/40">
             {/* Glow Effect */}
             <div className="absolute -top-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-[80px]"></div>

             <div className="relative z-10">
                <div className="h-16 w-16 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </div>
                
                {(() => {
                  const item = profile.gallery.find(g => g.id === unlockingId);
                  if (!item) return null;
                  
                  const hasEnoughCredits = userProfile.credits >= (item.creditCost || 0);

                  return (
                    <>
                      <h3 className="text-2xl font-black text-white mb-2">
                        {hasEnoughCredits ? 'Unlock Content?' : 'Insufficient Credits!'}
                      </h3>
                      <p className="text-gray-300 text-sm mb-6 font-medium">
                        {hasEnoughCredits 
                          ? 'এই এক্সক্লুসিভ কন্টেন্টটি দেখতে আপনার ওয়ালেট থেকে ক্রেডিট কেটে নেওয়া হবে।'
                          : 'আপনার ব্যালেন্সে পর্যাপ্ত ক্রেডিট নেই। এখনই ক্রেডিট রিচার্জ করুন।'}
                      </p>

                      <div className="bg-black/40 p-4 rounded-2xl mb-6 border border-white/5">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-400">Cost</span>
                           <span className="text-yellow-500 font-black">{item.creditCost} Credits</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-white/10">
                           <span className="text-gray-400">Your Balance</span>
                           <span className={`${hasEnoughCredits ? 'text-green-500' : 'text-red-500'} font-black`}>{userProfile.credits} Credits</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setUnlockingId(null)} className="flex-1 py-3 rounded-xl glass hover:bg-white/10 text-sm font-bold text-gray-400">Cancel</button>
                        
                        {hasEnoughCredits ? (
                          <button onClick={() => confirmUnlock(item)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 text-black text-sm font-black shadow-lg shadow-yellow-500/20">Unlock</button>
                        ) : (
                          <button onClick={() => { setUnlockingId(null); onPurchaseCredits(true); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-black shadow-lg shadow-red-500/20 animate-pulse">Get Credits</button>
                        )}
                      </div>
                    </>
                  );
                })()}
             </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Wallet Pill Mobile */}
        <div className="fixed top-4 right-4 z-50 md:hidden">
           <div onClick={() => onPurchaseCredits(true)} className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-yellow-500/30 px-4 py-2 rounded-full cursor-pointer shadow-lg">
              <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                 <span className="text-[10px] font-black text-black">C</span>
              </div>
              <span className="font-black text-yellow-500">{userProfile.credits}</span>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Main Image Slider */}
          <div className="w-full lg:w-4/12 flex flex-col gap-6">
            <button onClick={onBack} className="self-start p-4 glass rounded-2xl hover:bg-white/10 transition-all border border-white/5"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
            
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 aspect-[3.5/5] group shadow-2xl shadow-purple-900/20">
               {/* Main Image */}
               <img 
                 src={(sliderImages[currentImageIndex] as any)?.url || profile.image} 
                 className="w-full h-full object-cover transition-opacity duration-500" 
                 alt={profile.name} 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none"></div>

               {/* Navigation Arrows (Only if multiple images exist) */}
               {sliderImages.length > 1 && (
                 <>
                   {/* Prev Button */}
                   <button 
                     onClick={handlePrevImage}
                     className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-pink-600 hover:border-pink-500 transition-all active:scale-90"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                     </svg>
                   </button>

                   {/* Next Button */}
                   <button 
                     onClick={handleNextImage}
                     className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-pink-600 hover:border-pink-500 transition-all active:scale-90"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                     </svg>
                   </button>
                   
                   {/* Indicator Dots */}
                   <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                     {sliderImages.map((_, idx) => (
                       <div 
                         key={idx} 
                         className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-6 bg-pink-500' : 'w-1.5 bg-white/50'}`} 
                       />
                     ))}
                   </div>
                 </>
               )}
            </div>

            {/* Wallet Widget (Desktop) */}
            <div 
               onClick={() => onPurchaseCredits(true)}
               className="hidden md:flex bg-gradient-to-r from-slate-900 to-black p-5 rounded-3xl border border-yellow-500/20 cursor-pointer hover:border-yellow-500/50 transition-all group items-center justify-between shadow-lg"
            >
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20">C</div>
                  <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Wallet</p>
                     <p className="text-xl font-black text-white">{userProfile.credits} <span className="text-xs text-gray-500">Available</span></p>
                  </div>
               </div>
               <div className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               </div>
            </div>
          </div>

          {/* Right: Info & Tabs */}
          <div className="w-full lg:w-8/12">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">{profile.name}</h1>
                  <p className="text-pink-200/70 font-medium italic text-lg">"{profile.intro}"</p>
               </div>
            </div>

            {/* Reordered Tabs: Appearance First */}
            <div className="flex bg-black/20 border border-white/5 rounded-3xl p-1.5 mb-8 backdrop-blur-sm">
              {['appearance', 'gallery'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {tab === 'appearance' ? 'শারীরিক গঠন' : 'গ্যালারি'}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
               {/* Appearance Section (Now First) */}
               {activeTab === 'appearance' && (
                 <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-right-4">
                    <AttributeCard label="জাতীয়তা" value={profile.appearance.ethnicity} />
                    <AttributeCard label="বয়স" value={`${profile.age} বছর`} />
                    <AttributeCard label="শরীরের গঠন" value={profile.appearance.bodyType} />
                    <AttributeCard label="চোখের রঙ" value={profile.appearance.eyeColor} />
                    <AttributeCard label="ফিগার ডিটেইলস" value={profile.appearance.breastSize} />
                    <AttributeCard label="চুলের স্টাইল" value={profile.appearance.hairStyle} />
                    <AttributeCard label="পোশাক" value={profile.appearance.outfit} />
                    <AttributeCard label="সম্পর্ক" value={profile.character.relationship} />
                 </div>
               )}

               {/* Gallery Section with Exclusive Content Logic */}
               {activeTab === 'gallery' && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 animate-in fade-in slide-in-from-right-4">
                    {profile.gallery.length === 0 ? (
                       <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-white/5 bg-black/20">
                          <p className="text-gray-500 font-black uppercase tracking-widest">গ্যালারি খালি</p>
                       </div>
                    ) : (
                      profile.gallery.map((item, idx) => {
                        const isUnlocked = !item.isExclusive || (item.id && userProfile.unlockedContentIds.includes(item.id));
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleContentClick(item)} 
                            className={`aspect-[3/4] rounded-[2rem] overflow-hidden border transition-all relative group cursor-pointer ${item.isExclusive && !isUnlocked ? 'border-yellow-500/30' : 'border-white/5 hover:border-pink-500/30 hover:scale-105'}`}
                          >
                             {/* Exclusive Badge */}
                             {item.isExclusive && (
                               <div className="absolute top-3 left-3 z-20">
                                 {isUnlocked ? (
                                    <div className="bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                                      <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                      <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Unlocked</span>
                                    </div>
                                 ) : (
                                    <div className="bg-yellow-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                      <svg className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                      <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Premium</span>
                                    </div>
                                 )}
                               </div>
                             )}

                             {item.type === 'video' && (
                               <div className="absolute top-3 right-3 z-20 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                               </div>
                             )}

                             {/* Image Rendering Logic */}
                             {item.type === 'image' || (item.isExclusive && !isUnlocked) ? (
                               <img 
                                  src={item.url} 
                                  className={`w-full h-full object-cover transition-all duration-700 ${item.isExclusive && !isUnlocked ? 'blur-xl scale-110 brightness-50' : ''}`} 
                                  alt="" 
                               />
                             ) : (
                               <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                 <span className="text-xs text-gray-500 uppercase tracking-widest">Video</span>
                               </div>
                             )}
                            
                            {/* Locked Overlay Content */}
                             {item.isExclusive && !isUnlocked && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
                                   <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-3 border border-white/20 shadow-xl">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                      </svg>
                                   </div>
                                   <h4 className="text-lg font-black text-white mb-1 drop-shadow-md">{item.title || "Exclusive Content"}</h4>
                                   <p className="text-xs font-bold text-gray-300 italic mb-4 opacity-80">"{item.tease || "একটু কাছ থেকে দেখতে চাও?"}"</p>
                                   
                                   <div className="bg-yellow-500 text-black px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transform hover:scale-105 transition-transform flex items-center gap-2">
                                      <span>Unlock</span>
                                      <span className="bg-black/20 px-1.5 rounded text-[10px]">{item.creditCost} C</span>
                                   </div>
                                </div>
                             )}
                          </div>
                        );
                      })
                    )}
                 </div>
               )}
            </div>

            <button onClick={handleStartChatClick} className="w-full h-20 mt-12 bg-gradient-to-r from-pink-600 to-rose-500 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-pink-600/30">
               {userProfile.tier === 'Free' ? (
                 <>
                   আনলিমিটেড চ্যাট শুরু করুন (Premium)
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                 </>
               ) : (
                 <>
                   আড্ডা শুরু করি
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                 </>
               )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
