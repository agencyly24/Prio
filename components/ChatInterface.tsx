
import React, { useState, useEffect, useRef } from 'react';
import { GirlfriendProfile, Message } from '../types';
import { gemini } from '../services/geminiService';
import { VoiceCallModal } from './VoiceCallModal';

interface ChatInterfaceProps {
  profile: GirlfriendProfile;
  onBack: () => void;
  onMenuOpen: () => void;
  userName: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onBack, onMenuOpen, userName }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: profile.intro,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const personalizedPrompt = userName 
      ? `${profile.systemPrompt}\nইউজারের নাম হচ্ছে '${userName}'। সবসময় তাকে এই নামেই ডাকবে।`
      : profile.systemPrompt;
      
    gemini.initChat(personalizedPrompt);
    scrollToBottom();
  }, [profile, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      let aiResponseText = '';
      const stream = gemini.sendMessageStream(userMsg.text);
      
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        aiResponseText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: aiResponseText } : m
        ));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'error',
        sender: 'ai',
        text: 'দুঃখিত, সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করো?',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto glass shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            <img src={profile.image} alt={profile.name} className="h-10 w-10 rounded-full object-cover border-2 border-pink-500" />
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-black rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-white text-sm md:text-base leading-tight">{profile.name}</h2>
            <p className="text-xs text-green-400">অনলাইনে আছে</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowVoiceCall(true)}
            className="p-3 bg-pink-600 hover:bg-pink-700 rounded-full text-white shadow-lg transition-transform active:scale-90"
            title="Voice Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </button>
          <button 
            onClick={onMenuOpen}
            className="p-3 glass hover:bg-white/10 rounded-full text-white transition-transform active:scale-90"
            title="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
              m.sender === 'user' 
              ? 'bg-pink-600 text-white rounded-tr-none' 
              : 'glass text-gray-100 rounded-tl-none border-pink-500/20'
            }`}>
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <span className="text-[10px] opacity-50 block mt-1 text-right">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass p-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 flex gap-3 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="তোমার কথাগুলো এখানে লেখো..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-white placeholder:text-gray-500"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || isTyping}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed h-12 w-12 rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>

      {/* Voice Modal */}
      {showVoiceCall && (
        <VoiceCallModal 
          profile={profile} 
          onClose={() => setShowVoiceCall(false)} 
        />
      )}
    </div>
  );
};
