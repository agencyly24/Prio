
import React from 'react';
import { GirlfriendProfile } from '../types';

interface ProfileCardProps {
  profile: GirlfriendProfile;
  onSelect: (profile: GirlfriendProfile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(profile)}
      className="glass rounded-[2.5rem] p-5 cursor-pointer group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 border border-white/5 relative overflow-hidden"
    >
      <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative">
         <img src={profile.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={profile.name} />
         <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{profile.personality}</span>
         </div>
      </div>
      
      <div className="text-center relative z-10">
         <h3 className="text-2xl font-black mb-1">{profile.name}, {profile.age}</h3>
         <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-4">Click to Chat</p>
      </div>
    </div>
  );
};
