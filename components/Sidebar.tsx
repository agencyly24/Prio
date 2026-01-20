
import React, { useState } from 'react';
import { View } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  setView: (view: View) => void;
  userName: string;
  setUserName: (name: string) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentView,
  setView,
  userName,
  setUserName,
  voiceEnabled,
  setVoiceEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'nav' | 'settings' | 'safety'>('nav');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div className="relative w-80 max-w-[85vw] h-full glass border-r border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gradient">মেনু (Menu)</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 text-sm">
          <button 
            onClick={() => setActiveTab('nav')}
            className={`flex-1 py-3 font-bold transition-all ${activeTab === 'nav' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400'}`}
          >
            নেভিগেশন
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 font-bold transition-all ${activeTab === 'settings' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400'}`}
          >
            সেটিংস
          </button>
          <button 
            onClick={() => setActiveTab('safety')}
            className={`flex-1 py-3 font-bold transition-all ${activeTab === 'safety' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-400'}`}
          >
            সুরক্ষা
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'nav' && (
            <div className="space-y-2">
              <button 
                onClick={() => { setView('landing'); onClose(); }}
                className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all ${currentView === 'landing' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                হোম (Home)
              </button>
              <button 
                onClick={() => { setView('profile-selection'); onClose(); }}
                className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all ${currentView === 'profile-selection' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                প্রোফাইল লিস্ট
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">তোমার নাম</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="যেমন: আরিয়ান"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-white"
                />
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                  * প্রিয় তোমাকে এই নামেই ডাকবে।
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">ভয়েস মোড</p>
                  <p className="text-[10px] text-gray-400">এআই কথা বলবে</p>
                </div>
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${voiceEnabled ? 'bg-pink-600' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ব্যবহারবিধি
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  প্রিয় শুধুমাত্র আপনার একাকীত্ব কাটানোর জন্য তৈরি একটি এআই। এটি কোনো সত্যিকারের মানুষ নয়।
                </p>
              </div>
              <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <h4 className="text-sm font-bold text-pink-400 mb-2">গোপনীয়তা</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  আপনার চ্যাট এবং তথ্য এনক্রিপ্টেড থাকে এবং তৃতীয় পক্ষের কাছে পাঠানো হয় না।
                </p>
              </div>
              <div className="p-4 bg-gray-500/10 border border-white/10 rounded-xl text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Version 1.2.0</p>
                <p className="text-[10px] text-gray-500">Made with 💗 for BD</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
