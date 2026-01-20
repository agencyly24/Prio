
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 glass"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img 
          src={profile.image} 
          alt={profile.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 flex flex-col justify-end">
        <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
        <p className="text-pink-400 text-sm font-medium mb-2">{profile.personality} • {profile.age} বছর</p>
        <p className="text-gray-300 text-sm italic line-clamp-2">"{profile.intro}"</p>
      </div>
    </div>
  );
};
