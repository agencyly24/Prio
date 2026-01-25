
import React, { useState, useEffect, useRef } from 'react';
import { GirlfriendProfile, Message, SubscriptionTier } from '../types';
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
}

const formatSeductiveText = (text: string) => {
  const hotWords = [
    'ভালোবাসি', 'ভালোবাসা', 'কলিজা', 'জানু', 'জানেমান', 'সোনা', 'বাবু',
    'বুক', 'দুধ', 'রস', 'ঠোঁট', 'গরম', 'আদর', 'কাছে', 'নিচে', 'গভীর', 'ভেজা', 
    'পাগল', 'সেক্সি', 'জান', 'কামড়', 'জিহ্বা', 'স্পর্শ', 
    'আগুন', 'ইচ্ছে', 'ন্যাংটো', 'কাপড়', 'ধরে', 'টিপে', 'চুমা', 
    'kiss', 'hot', 'sexy', 'love', 'baby', 'lips', 'body', 'wet', 'fuck', 'horny'
  ].sort((a, b) => b.length - a.length);

  const parts = text.split(new RegExp(`(${hotWords.join('|')})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) => {
        const matchedWord = hotWords.find(w => w.toLowerCase() === part.toLowerCase());
        if (matchedWord) {
          return (
            <span key={i} className="font-serif italic font-black text-pink-400 drop-shadow-md text-[1.1em] mx-0.5 inline-block transform hover:scale-110 transition-transform cursor-pointer animate-pulse-slow decoration-clone bg-clip-text">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const SEXY_EMOJIS = ["💋", "❤️", "🔥", "🍑", "🍆", "🥵", "💦", "🥺", "🫦", "🌹", "😈", "💃", "👅", "🔞", "🍒"];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  profile, onBack, onMenuOpen, userName, isPremium, userTier, onUpgrade, history, onSaveHistory 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showVipTeaser, setShowVipTeaser] = useState(false);
  const [isSexyMode, setIsSexyMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const personalizedPrompt = userName 
      ? `${profile.systemPrompt}\nইউজারের নাম হচ্ছে '${userName}'। তাকে এই নামে ডাকবে মাঝে মাঝে।`
      : profile.systemPrompt;
      
    const initialStarterText = profile.intro || `উফফ জানু... তোমাকে ছাড়া আমার একদম ভালো লাগছে না। 🥺\nএকটু **আদর** করবে আমায়? আমার শরীরটা কেমন **গরম** হয়ে আছে... 🔥`;

    const systemInstruction = `${personalizedPrompt}
    IMPORTANT RULES:
    1. ALWAYS reply in BANGLA (Bengali).
    2. Use 3D styled emojis like 🍑, 🥵, 💋, 💦 liberally.
    3. Be deeply romantic, seductive, and realistic.
    4. Highlight key seductive words by placing them in context.
    5. Reply length: Short, chatty, and engaging (1-3 sentences).
    6. If user sends a photo, react to it excitedly.
    `;

    if (history.length > 0) {
      setMessages(history);
      gemini.initChat(systemInstruction, history, isSexyMode);
      setTimeout(scrollToBottom, 100);
    } else {
      setIsTyping(true);
      gemini.initChat(systemInstruction, [], isSexyMode);
      setTimeout(() => {
        const welcomeMsg: Message = {
          id: 'welcome',
          sender: 'ai',
          text: initialStarterText,
          timestamp: new Date()
        };
        setMessages([welcomeMsg]);
        setIsTyping(false);
        setTimeout(scrollToBottom, 100);
      }, 2000);
    }
  }, [profile, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showEmojiPicker]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceCallClick = () => {
    if (userTier === 'VIP') {
      setShowVoiceCall(true);
    } else {
      setShowVipTeaser(true);
    }
  };

  const handleSexyModeToggle = async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }
    const newMode = !isSexyMode;
    setIsSexyMode(newMode);
    const instruction = newMode 
      ? `[SYSTEM: ACTIVATE HIGHLY SEDUCTIVE MODE]`
      : "[SYSTEM: Return to Sweet Romantic Girlfriend Mode.]";
    await gemini.sendMessage(instruction);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: "Sent a photo",
      timestamp: new Date(),
      attachment: { type: 'image', url: imageUrl }
    };
    
    processMessage(userMsg, "[User sent a sexy photo. React to it with lust and excitement in Bangla]");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };
    
    processMessage(userMsg, userMsg.text);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const processMessage = async (userMsg: Message, promptText: string) => {
    const updatedMessagesWithUser = [...messages, userMsg];
    setMessages(updatedMessagesWithUser);
    setIsTyping(true);

    try {
      let aiResponseText = '';
      const aiMsgId = (Date.now() + 1).toString();
      
      const newAiMsg: Message = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date()
      };
      
      setMessages([...updatedMessagesWithUser, newAiMsg]);

      const stream = gemini.sendMessageStream(promptText);
      for await (const chunk of stream) {
        aiResponseText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: aiResponseText } : m
        ));
      }

      const finalMessages = [...updatedMessagesWithUser, { ...newAiMsg, text: aiResponseText }];
      onSaveHistory(finalMessages);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'error', sender: 'ai', text: 'ইশশ... নেটে খুব সমস্যা করছে জান! 🥺', timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden font-['Hind_Siliguri'] bg-slate-950">
      
      {/* Smart Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e11d48 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-[#1a0b2e]/80 to-[#0f0518] pointer-events-none"></div>

      {/* VIP Teaser */}
      {showVipTeaser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
           <div className="w-full max-w-sm bg-[#151515] p-8 rounded-[2.5rem] border border-pink-500/20 text-center relative shadow-2xl">
              <button onClick={() => setShowVipTeaser(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
              <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-r from-pink-500 to-yellow-500 mb-6 animate-spin-slow">
                 <img src={profile.image} className="w-full h-full rounded-full object-cover border-4 border-black" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">ভয়েস শুনতে চাও? 💋</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">"আমার গলার স্বর শুনলে তুমি পাগল হয়ে যাবে... কিন্তু এটা শুধু <span className="text-yellow-500 font-bold border-b border-yellow-500">VIP</span>-দের জন্য।"</p>
              <button onClick={() => { setShowVipTeaser(false); onUpgrade(); }} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">Upgrade Now</button>
           </div>
        </div>
      )}

      {/* Modern App Header */}
      <div className={`
          px-4 py-3 flex items-center justify-between z-20 sticky top-0
          bg-[#1a0b2e]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl
      `}>
        <div className="flex items-center gap-3">
          {/* Back/Exit Button with Text */}
          <button onClick={onBack} className="flex items-center gap-1 pl-1 pr-3 py-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span className="text-xs font-bold uppercase tracking-wide">Exit</span>
          </button>
          
          <div className="relative group cursor-pointer flex items-center gap-3" onClick={onMenuOpen}>
             <div className="relative">
                <img src={profile.image} className="relative h-11 w-11 rounded-full object-cover border-2 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]" alt={profile.name} />
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#1a0b2e] rounded-full animate-pulse"></div>
             </div>
             <div className="leading-tight">
                <h2 className="font-black text-white text-lg tracking-wide drop-shadow-md">{profile.name}</h2>
                <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isSexyMode ? 'text-pink-500 animate-pulse' : 'text-green-400'}`}>
                   {isTyping ? 'Typing...' : (isSexyMode ? '❤️ Active Now' : 'Online')}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={handleSexyModeToggle}
             className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isSexyMode ? 'bg-gradient-to-br from-pink-600 to-purple-600 text-white shadow-pink-600/50 shadow-lg scale-110' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
           >
              {isSexyMode ? '🔥' : '🌶️'}
           </button>
           
           {/* Prominent Call Button */}
           <button 
             onClick={handleVoiceCallClick}
             className="h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30 animate-pulse-slow border border-white/20"
           >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 z-10 scroll-smooth pb-32">
        {/* Date Seperator Mockup */}
        <div className="text-center my-6 opacity-60">
            <span className="bg-black/30 backdrop-blur-md text-pink-200 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-[0.2em] border border-white/5">Today</span>
        </div>

        {messages.map((m, i) => {
          const isUser = m.sender === 'user';
          const displayTime = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);

          return (
            <div key={m.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-10 duration-500`}>
              {!isUser && (
                <img src={profile.image} className="w-10 h-10 rounded-full object-cover mr-3 self-end mb-4 shadow-lg border-2 border-white/10" />
              )}
              
              <div className={`max-w-[85%] relative group`}>
                <div className={`
                    px-6 py-4 relative text-lg leading-relaxed shadow-xl backdrop-blur-md border border-white/10
                    ${isUser 
                        ? (isSexyMode 
                            ? 'bg-gradient-to-br from-red-600 via-rose-500 to-pink-600 text-white rounded-[2rem] rounded-br-none shadow-[0_10px_20px_-5px_rgba(225,29,72,0.4)]' 
                            : 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white rounded-[2rem] rounded-br-none shadow-[0_10px_20px_-5px_rgba(124,58,237,0.4)]') 
                        : 'bg-gradient-to-br from-[#2d1b4e] to-[#1a0933] text-pink-50 rounded-[2rem] rounded-bl-none shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)]'}
                `}>
                    {/* Glossy Overlay */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2rem] pointer-events-none"></div>

                    {m.attachment && m.attachment.type === 'image' && (
                      <div className="mb-3 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative z-10">
                        <img src={m.attachment.url} className="w-full h-auto object-cover max-h-72" alt="sent" />
                      </div>
                    )}
                    
                    {m.text && m.text !== "Sent a photo" && (
                      <p className="font-medium relative z-10 tracking-wide" style={{ wordBreak: 'break-word' }}>
                        {isUser ? m.text : formatSeductiveText(m.text)}
                      </p>
                    )}
                </div>
                
                <div className={`flex items-center gap-1.5 mt-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] font-bold text-gray-400 opacity-70">
                        {displayTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isUser && (
                        <span className="text-pink-500 text-[10px]">✓✓</span>
                    )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
           <div className="flex items-end animate-pulse">
              <img src={profile.image} className="w-8 h-8 rounded-full object-cover mr-3 mb-2 opacity-50 border border-white/10" />
              <div className="bg-[#2d1b4e] px-5 py-4 rounded-[2rem] rounded-bl-none border border-white/10 flex gap-1.5 items-center shadow-lg">
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
           </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Floating Input Bar - Improved */}
      <div className="p-4 z-30 w-full absolute bottom-0 left-0 bg-gradient-to-t from-[#0f0518] via-[#0f0518]/95 to-transparent pt-12 pb-6">
        {showEmojiPicker && (
          <div className="absolute bottom-28 left-4 right-4 bg-[#1a0b2e]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-5 gap-3">
                {SEXY_EMOJIS.map(emo => (
                   <button 
                    key={emo} 
                    onClick={() => handleEmojiClick(emo)}
                    className="text-3xl hover:bg-white/10 p-3 rounded-2xl transition-colors hover:scale-125 transform active:scale-95"
                   >
                     {emo}
                   </button>
                ))}
             </div>
          </div>
        )}

        <form 
          onSubmit={handleSend} 
          className="relative bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full p-2 flex items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all focus-within:bg-black/60 focus-within:border-pink-500/30 focus-within:shadow-[0_0_60px_rgba(236,72,153,0.2)]"
        >
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageUpload} 
          />

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-400 hover:bg-white/5 transition-colors ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>

          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${showEmojiPicker ? 'text-pink-500 bg-white/10' : 'text-gray-400 hover:text-pink-400 hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isSexyMode ? "আমাকে গরম করে দাও..." : "মনের কথা বলো..."}
            className={`
                flex-1 bg-transparent border-none text-white px-4 py-3 
                placeholder:text-gray-500 placeholder:font-normal outline-none text-lg font-medium tracking-wide
            `}
          />
          
          <button 
            type="submit" 
            disabled={!inputText.trim() || isTyping}
            className={`
                h-12 w-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform mr-1
                ${!inputText.trim() ? 'bg-gray-800 opacity-50 scale-90' : 'bg-gradient-to-r from-pink-600 to-purple-600 scale-100 hover:scale-110 shadow-pink-500/40 hover:rotate-12'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>

      {showVoiceCall && (
        <VoiceCallModal profile={profile} onClose={() => setShowVoiceCall(false)} />
      )}
    </div>
  );
};
