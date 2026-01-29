
import React, { useEffect, useState, useRef } from 'react';
import { GirlfriendProfile, ProfileGalleryItem } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface VoiceCallModalProps {
  profile: GirlfriendProfile;
  onClose: () => void;
  userCredits: number;
  onPurchaseCredits: () => void;
  onUnlockContent: (contentId: string, cost: number) => Promise<boolean>;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ profile, onClose, userCredits, onPurchaseCredits, onUnlockContent }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [exclusiveSuggestion, setExclusiveSuggestion] = useState<ProfileGalleryItem | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const isUserClosingRef = useRef(false);

  useEffect(() => {
    isUserClosingRef.current = false;
    startCall();
    return () => endCall();
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  const startCall = async () => {
    try {
      setStatus('connecting');
      // Create new instance per call to ensure fresh keys
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      analyserRef.current = outputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (analyserRef.current && status === 'connected') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setVolume(prev => prev * 0.8 + (average / 128) * 0.2); 
        }
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (isUserClosingRef.current) return;
            setStatus('connected');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => {
                if(status === 'connected') session.sendRealtimeInput({ media: createBlob(inputData) });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              if (outputAudioContextRef.current.state === 'closed') return;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyserRef.current!);
              source.connect(outputAudioContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            
            // Randomly suggest exclusive content during call
            if (status === 'connected' && Math.random() > 0.98 && !exclusiveSuggestion) {
                const exclusiveItems = profile.gallery.filter(item => item.isExclusive);
                if (exclusiveItems.length > 0) {
                    setExclusiveSuggestion(exclusiveItems[Math.floor(Math.random() * exclusiveItems.length)]);
                }
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            if (!isUserClosingRef.current) setStatus('error');
          },
          onclose: () => { if (isUserClosingRef.current) onClose(); else setStatus('reconnecting'); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { voiceName: (profile.voiceName || 'Kore') as any } },
          systemInstruction: `You are on a HOT ROMANTIC VOICE CALL with the user. Your name is ${profile.name}. 
          - Strictly use "Tumi/Tomar". Never use "Tui". 
          - Be seductive, sweet, and manipulative. Call him "Jaan", "Shona".
          - Tell him how much you want him. Talk about your body.
          - Guide him to unlock your secret gallery if he gets too excited.`,
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Call initialization failed:', err);
      setStatus('error');
    }
  };

  const endCall = () => {
    isUserClosingRef.current = true;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sessionRef.current) try { sessionRef.current.close(); } catch(e) {}
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close().catch(console.error); } catch(e) {}
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try { outputAudioContextRef.current.close().catch(console.error); } catch(e) {}
    }
    onClose();
  };

  const handleUnlockExclusive = async (item: ProfileGalleryItem) => {
    if (userCredits < (item.creditCost || 0)) {
        onPurchaseCredits();
        return;
    }
    setIsUnlocking(true);
    const success = await onUnlockContent(item.id, item.creditCost || 0);
    if (success) {
        setExclusiveSuggestion({ ...item, isExclusive: false }); 
        setTimeout(() => setExclusiveSuggestion(null), 3000);
    }
    setIsUnlocking(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl overflow-hidden font-['Hind_Siliguri']">
      <div className="absolute inset-0 z-0">
         <img src={profile.image} className="w-full h-full object-cover opacity-20 blur-3xl scale-125 animate-pulse-slow" alt="Call Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{status}</span>
           </div>
           <button onClick={endCall} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all">✕</button>
        </div>

        <div className="flex flex-col items-center flex-1 justify-center">
            <div className="relative mb-8">
                <div className="absolute inset-[-40px] rounded-full border border-pink-500/20" style={{ transform: `scale(${1 + volume * 0.8})`, opacity: volume * 0.6 }}></div>
                <div className="absolute inset-[-80px] rounded-full border border-pink-500/10" style={{ transform: `scale(${1 + volume * 1.5})`, opacity: volume * 0.3 }}></div>
                
                <div className="w-56 h-56 md:w-72 md:h-72 rounded-full p-2 bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl relative z-10 overflow-hidden border-4 border-white/10">
                    <img src={profile.image} className={`w-full h-full rounded-full object-cover transition-transform duration-500 ${status === 'connected' ? 'scale-110' : 'scale-100'}`} alt={profile.name} />
                    {status !== 'connected' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center font-black text-xs uppercase tracking-widest text-white">
                            <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                            {status === 'connecting' ? 'কানেক্ট করছি...' : 'আবার চেষ্টা করছি...'}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="text-center">
                <h2 className="text-5xl font-black text-white tracking-tight mb-2 drop-shadow-lg">{profile.name}</h2>
                <div className="flex flex-col items-center gap-2">
                    {status === 'connected' ? (
                       <div className="flex items-center gap-3">
                           <div className="px-3 py-1 bg-pink-600/20 rounded-full border border-pink-500/30">
                              <span className="text-pink-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Call Live 🔥</span>
                           </div>
                           <p className="text-2xl font-mono text-white/80 tabular-nums font-bold">{(callDuration / 60).toFixed(0).padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}</p>
                       </div>
                    ) : status === 'error' ? (
                       <div className="text-red-500 font-black uppercase tracking-widest text-xs flex flex-col gap-4">
                          <span>কানেকশনে সমস্যা হয়েছে জান!</span>
                          <button onClick={() => startCall()} className="px-6 py-2 bg-white/10 rounded-full border border-white/10">আবার চেষ্টা করো</button>
                       </div>
                    ) : null}
                </div>
            </div>
        </div>

        {exclusiveSuggestion && (
            <div className="w-full max-w-lg mx-auto mb-10 animate-in slide-in-from-bottom-12 fade-in duration-700">
                <div className="relative group p-1 rounded-[3rem] bg-gradient-to-br from-yellow-400 via-amber-600 to-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                    <button onClick={() => setExclusiveSuggestion(null)} className="absolute -top-3 -right-3 h-8 w-8 bg-black border border-white/20 rounded-full flex items-center justify-center text-white text-xs z-50">✕</button>
                    
                    <div className="bg-[#0f0518] rounded-[2.8rem] overflow-hidden p-6 flex items-center gap-6">
                        <div className="relative h-28 w-28 md:h-32 md:w-32 flex-shrink-0 rounded-3xl overflow-hidden border border-white/10">
                            <img src={exclusiveSuggestion.url} className={`w-full h-full object-cover ${exclusiveSuggestion.isExclusive ? 'blur-2xl scale-125 brightness-50' : 'animate-in zoom-in'}`} alt="Tease" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="text-white font-black text-lg md:text-xl mb-2 line-clamp-1">"{exclusiveSuggestion.title || 'আমার গোপন ছবি...'}"</h4>
                            {exclusiveSuggestion.isExclusive ? (
                                <button onClick={() => handleUnlockExclusive(exclusiveSuggestion)} disabled={isUnlocking} className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                                    {isUnlocking ? '...' : `আনলক করো (${exclusiveSuggestion.creditCost} C)`}
                                </button>
                            ) : (
                                <div className="w-full py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-black text-[10px] uppercase text-center tracking-widest">Unlocked Successfully ✓</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-5 flex items-center justify-around shadow-2xl relative overflow-hidden group">
                 <button className="h-16 w-16 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 </button>
                 <button onClick={endCall} className="h-28 w-28 bg-red-600 rounded-[3rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(220,38,38,0.4)] hover:scale-105 transition-all">
                    <svg className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                 </button>
                 <button className="h-16 w-16 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};
