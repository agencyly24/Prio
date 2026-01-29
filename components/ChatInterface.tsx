
import React, { useState, useEffect, useRef } from 'react';
import { GirlfriendProfile, Message, SubscriptionTier, ProfileGalleryItem } from '../types';
import { gemini } from '../services/geminiService';
import { VoiceCallModal } from './VoiceCallModal';

interface ChatInterfaceProps {
  profile: GirlfriendProfile;
  onBack: () => void;
  onMenuOpen: () => void;
  userName: string;
  isPremium: boolean;
  userTier: SubscriptionTier;
  onUpgrade: () => void;
  history: Message[];
  onSaveHistory: (messages: Message[]) => void;
  userCredits: number;
  onPurchaseCredits: () => void;
  onUnlockContent: (contentId: string, cost: number) => Promise<boolean>;
  unlockedContentIds: string[];
}

const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const formatSeductiveText = (text: string) => {
  const hotWords = ['ভালোবাসি', 'জানু', 'গরম', 'আদর', 'নিচে', 'ভেজা', 'পাগল', 'সেক্সি', 'জান', 'body', 'wet', 'naked', 'দুধ', 'বুক', 'খুলবো', 'চরম', 'তৃপ্তি', 'নগ্ন', 'কামনা', 'নুনু', 'সাইজ', 'বুদা', 'সোনা', 'পেনিস', 'চোষা', 'মাল', 'আউট'];
  const parts = text.split(new RegExp(`(${hotWords.join('|')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => hotWords.some(w => w.toLowerCase() === part.toLowerCase()) 
        ? <span key={i} className="font-serif italic font-black text-pink-300 drop-shadow-md text-[1.15em] mx-0.5">{part}</span>
        : <span key={i}>{part}</span>)}
    </span>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  profile, onBack, onMenuOpen, userName, isPremium, userTier, onUpgrade, history, onSaveHistory, 
  userCredits, onPurchaseCredits, onUnlockContent, unlockedContentIds 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isVoiceReplyEnabled, setIsVoiceReplyEnabled] = useState(false);
  const [suggestedContent, setSuggestedContent] = useState<ProfileGalleryItem | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const profileHistory = history.filter(m => (m as any).modelId === profile.id || m.id === 'welcome');
    gemini.initChat(profile, profileHistory, userName);
    if (profileHistory.length === 0) {
      setMessages([{ id: 'welcome', sender: 'ai', text: profile.intro, timestamp: new Date() }]);
    } else {
      setMessages(profileHistory);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [profile.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, suggestedContent]);

  const playAiVoice = async (base64: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const data = decodeAudio(base64);
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Playback failed:", e);
    }
  };

  const handleSend = async (e?: React.FormEvent, imageBase64?: string) => {
    e?.preventDefault();
    if (!inputText.trim() && !imageBase64) return;
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: inputText, 
      timestamp: new Date(),
      attachment: imageBase64 ? { type: 'image', url: `data:image/jpeg;base64,${imageBase64}` } : undefined
    };
    (userMsg as any).modelId = profile.id;
    
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInputText('');
    setIsTyping(true);
    setSuggestedContent(null);

    try {
      let aiFullText = '';
      const aiMsgId = (Date.now() + 1).toString();
      
      if (isVoiceReplyEnabled) {
        setMessages([...currentMessages, { id: aiMsgId, sender: 'ai', text: '', timestamp: new Date(), audio: 'generating' as any }]);
      } else {
        setMessages([...currentMessages, { id: aiMsgId, sender: 'ai', text: '', timestamp: new Date() }]);
      }

      const userMessageParts: any[] = [{ text: userMsg.text }];
      if (userMsg.attachment) {
        userMessageParts.push({ inlineData: { mimeType: 'image/jpeg', data: userMsg.attachment.url.split(',')[1] } });
      }

      const stream = gemini.sendMessageStream(userMessageParts);
      for await (const chunk of stream) {
        aiFullText += chunk;
        if (!isVoiceReplyEnabled) {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiFullText } : m));
        }
      }

      let aiAudioData: string | undefined = undefined;
      if (isVoiceReplyEnabled && (userTier === 'VIP' || userTier === 'Pro')) {
        const audio = await gemini.generateSpeech(aiFullText, profile.voiceName);
        if (audio) {
          aiAudioData = audio;
          playAiVoice(audio);
        }
      }

      const finalAiMsg: Message = { id: aiMsgId, sender: 'ai', text: aiFullText, timestamp: new Date(), audio: aiAudioData };
      (finalAiMsg as any).modelId = profile.id;

      setMessages(prev => prev.map(m => m.id === aiMsgId ? finalAiMsg : m));
      
      const lowerInput = userMsg.text.toLowerCase();
      const needsNaughty = ['hot', 'sexy', 'photo', 'video', 'chobi', 'body', 'naked', 'shout', 'dekhaw', 'দেখাও', 'ছবি', 'ভিডিও', 'বুদা', 'চোষা', 'মাল'];
      const match = profile.gallery.find(item => 
        item.isExclusive && (needsNaughty.some(k => lowerInput.includes(k)) || item.keywords?.some(k => lowerInput.includes(k.toLowerCase())))
      );
      
      if (match) setSuggestedContent(match);
      onSaveHistory([...history, userMsg, finalAiMsg]);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    } finally { setIsTyping(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        handleSend(undefined, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnlockSuggestion = async (item: ProfileGalleryItem) => {
    if (userCredits < (item.creditCost || 0)) {
        onPurchaseCredits();
        return;
    }
    const success = await onUnlockContent(item.id, item.creditCost || 0);
    if (success) {
        setSuggestedContent(null);
        const unlockMsg: Message = { 
          id: `unl_${Date.now()}`, 
          sender: 'ai', 
          text: `জান, তোমার জন্য পাঠালাম... কেমন লেগেছে? 🔥`, 
          timestamp: new Date(), 
          attachment: { type: 'image', url: item.url } 
        };
        (unlockMsg as any).modelId = profile.id;
        setMessages(prev => [...prev, unlockMsg]);
        onSaveHistory([...history, unlockMsg]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden font-['Hind_Siliguri'] bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0b2e] via-[#0f0518] to-black"></div>
      
      <div className="px-4 py-4 flex items-center justify-between z-30 bg-slate-900/60 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
          <div className="flex items-center gap-3">
             <div className="relative cursor-pointer" onClick={() => setFullScreenImage(profile.image)}>
                <img src={profile.image} className="h-14 w-14 rounded-full object-cover border-2 border-pink-500 shadow-lg" alt="" />
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
             </div>
             <div>
                <h2 className="font-black text-white text-xl">{profile.name}</h2>
                <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{isTyping ? 'জান কিছু বলছে...' : 'অ্যাক্টিভ 🔥'}</p>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
           {(userTier === 'VIP' || userTier === 'Pro') && (
              <button 
                onClick={() => setIsVoiceReplyEnabled(!isVoiceReplyEnabled)} 
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isVoiceReplyEnabled ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] animate-pulse' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                title={isVoiceReplyEnabled ? "Voice Mode: ON" : "Voice Mode: OFF"}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
           )}
           <button onClick={() => setShowVoiceCall(true)} className="h-12 w-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse-slow"><svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-10 z-10 scroll-smooth pb-32 pt-2 custom-scrollbar">
        {messages.map((m) => {
          const isAIVoiceMsg = m.sender === 'ai' && isVoiceReplyEnabled;
          const isGenerating = m.audio === 'generating';
          
          return (
            <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-8`}>
              <div className={`px-6 py-4 max-w-[85%] shadow-2xl relative ${m.sender === 'user' ? 'bg-violet-600 text-white rounded-[2rem] rounded-br-none text-2xl font-bold' : 'bg-slate-900 text-pink-50 rounded-[2rem] rounded-bl-none border border-white/5 text-2xl font-bold'}`}>
                  {isAIVoiceMsg ? (
                    <div className="flex flex-col gap-3 min-w-[240px]">
                      {isGenerating ? (
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-pink-500/20">
                                <div className="h-4 w-4 bg-pink-500 rounded-full animate-ping"></div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-pink-500 w-1/3 animate-[shimmer_1.5s_infinite] origin-left"></div>
                                </div>
                                <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.1em]">রেকর্ড করছি জান...</p>
                            </div>
                        </div>
                      ) : m.audio ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-4">
                            <button onClick={() => playAiVoice(m.audio!)} className="h-14 w-14 bg-pink-600 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg border-2 border-white/20">
                              <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="flex-1 flex gap-1.5 items-center h-10 overflow-hidden">
                              {[...Array(15)].map((_, i) => <div key={i} className="flex-1 bg-pink-500/40 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 80}%` }}></div>)}
                            </div>
                          </div>
                          <p className="text-[9px] text-pink-500 font-black uppercase tracking-[0.2em] text-center bg-pink-500/5 py-1 rounded-full">ভয়েস মেসেজ (Tap to play)</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    m.sender === 'ai' ? formatSeductiveText(m.text) : m.text
                  )}

                  {m.attachment && <img src={m.attachment.url} className="mt-4 rounded-xl max-w-full h-auto shadow-lg border border-white/10" alt="Attachment" />}
                  
                  {!isAIVoiceMsg && m.sender === 'ai' && m.audio && (
                     <button onClick={() => playAiVoice(m.audio!)} className="absolute -bottom-2 -right-2 h-10 w-10 bg-pink-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-90 transition-all border-2 border-white/10">
                        <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                     </button>
                  )}
              </div>
            </div>
          );
        })}

        {isTyping && !isVoiceReplyEnabled && (
           <div className="flex w-full justify-start animate-in fade-in">
              <div className="bg-slate-900 px-6 py-4 rounded-[2rem] flex items-center gap-1.5 shadow-xl border border-white/5"><div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>
           </div>
        )}

        {suggestedContent && !isTyping && (
            <div className="flex justify-start animate-in zoom-in max-w-[80%]">
                <div className="ml-2 p-1 rounded-[2.5rem] bg-gradient-to-br from-yellow-500 to-amber-700 shadow-2xl">
                    <div className="bg-slate-900 rounded-[2.3rem] overflow-hidden p-6 text-center">
                        <h4 className="text-xl font-black text-white uppercase italic leading-tight mb-4">"{suggestedContent.tease || 'জান, আমার শরীর দেখবে?'}"</h4>
                        <button onClick={() => handleUnlockSuggestion(suggestedContent)} className="px-6 py-3 bg-yellow-500 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all">আনলক ({suggestedContent.creditCost} C)</button>
                    </div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
        <form onSubmit={handleSend} className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-2 flex items-center shadow-2xl group focus-within:border-pink-500/50 transition-all">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="জান, কিছু বলো..." className="flex-1 bg-transparent border-none text-white px-4 py-4 placeholder:text-gray-600 outline-none text-xl font-bold" />

          <button type="submit" className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg></button>
        </form>
      </div>

      <style>{`
        @keyframes shimmer {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); transform: translateX(100%); }
        }
      `}</style>

      {showVoiceCall && <VoiceCallModal profile={profile} onClose={() => setShowVoiceCall(false)} userCredits={userCredits} onPurchaseCredits={onPurchaseCredits} onUnlockContent={onUnlockContent} />}
      {fullScreenImage && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setFullScreenImage(null)}><img src={fullScreenImage} className="max-w-full max-h-full" alt="Fullscreen" /></div>}
    </div>
  );
};
