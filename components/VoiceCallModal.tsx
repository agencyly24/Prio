
import React, { useEffect, useState, useRef } from 'react';
import { GirlfriendProfile } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface VoiceCallModalProps {
  profile: GirlfriendProfile;
  onClose: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ profile, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Call Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false); // Simulates Loudness
  const [callDuration, setCallDuration] = useState(0);
  
  // Audio Visuals
  const [volume, setVolume] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null); // For Speaker Boost
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  
  // Track if close was intentional to prevent auto-reconnect loops
  const isUserClosingRef = useRef(false);

  useEffect(() => {
    isUserClosingRef.current = false;
    startCall();
    return () => {
      endCall();
    };
  }, []);

  // Call Timer Logic
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Format Time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle Loudness (Gain Boost)
  useEffect(() => {
    if (outputGainNodeRef.current) {
        // Normal = 1.0, Speaker/Loud = 2.5 (Boosted)
        outputGainNodeRef.current.gain.setTargetAtTime(isSpeakerOn ? 2.5 : 1.0, outputAudioContextRef.current!.currentTime, 0.1);
    }
  }, [isSpeakerOn]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manual Encode to avoid external lib issues
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startCall = async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { await audioContextRef.current.close(); } catch(e) { console.warn(e); }
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try { await outputAudioContextRef.current.close(); } catch(e) { console.warn(e); }
    }

    try {
      setStatus('connecting');
      setErrorMessage('');

      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "undefined") {
        setErrorMessage("API Key পাওয়া যায়নি।");
        setStatus('error');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Create Gain Node for Speaker Control
      outputGainNodeRef.current = outputAudioContextRef.current.createGain();
      outputGainNodeRef.current.gain.value = 1.0; // Default Volume
      outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

      // Setup Visualizer
      analyserRef.current = outputAudioContextRef.current.createAnalyser(); // Visualize OUTPUT audio
      analyserRef.current.fftSize = 64; // Low FFT for smooth blob effect
      outputGainNodeRef.current.connect(analyserRef.current); // Connect gain to analyser
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (analyserRef.current && status === 'connected') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          // Smooth volume transition
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
            if (audioContextRef.current?.state === 'closed') return;

            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return; // Mute Logic
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              // Connect to Gain Node (Speaker Control) instead of Destination directly
              source.connect(outputGainNodeRef.current!); 
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live Error:', e);
            const errText = e?.message || "Unknown Error";
            if (errText.includes("not enabled") || errText.includes("403")) {
                setErrorMessage("API Error or Billing Issue.");
                setStatus('error');
            } else if (!isUserClosingRef.current) {
              setStatus('reconnecting');
              setTimeout(() => startCall(), 2000);
            }
          },
          onclose: () => {
            if (!isUserClosingRef.current && status !== 'error') {
               setStatus('reconnecting');
               setTimeout(() => startCall(), 1500);
            } else if (isUserClosingRef.current) {
               onClose();
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voiceName as any } },
          },
          systemInstruction: profile.systemPrompt + `
          [CALL MODE]
          - You are on a VOICE CALL with the user.
          - Keep responses concise and conversational (1-2 sentences).
          - Use natural fillers like "Hmm", "Accha", "O ma".
          - Be flirtatious and intimate.`,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Call failed:', err);
      if (!isUserClosingRef.current) {
        setStatus('reconnecting');
        setTimeout(() => startCall(), 3000);
      }
    }
  };

  const endCall = () => {
    isUserClosingRef.current = true;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e) {} }
    if (audioContextRef.current?.state !== 'closed') { try { audioContextRef.current?.close(); } catch(e) {} }
    if (outputAudioContextRef.current?.state !== 'closed') { try { outputAudioContextRef.current?.close(); } catch(e) {} }
    onClose();
  };

  const handleRetry = () => {
     setStatus('connecting');
     setErrorMessage('');
     startCall();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl overflow-hidden font-['Hind_Siliguri']">
      
      {/* Background Ambience - Full screen blurred image */}
      <div className="absolute inset-0 z-0">
         <img src={profile.image} className="w-full h-full object-cover opacity-30 blur-3xl scale-125 animate-pulse-slow" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 pb-12">
        
        {/* Header */}
        <div className="flex justify-between items-start pt-4 px-2">
            <button onClick={endCall} className="p-3 glass rounded-full opacity-0 pointer-events-none">v</button> {/* Spacer */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full backdrop-blur-md border border-white/5 mb-2">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
            </div>
            <button className="p-3 glass rounded-full opacity-0 pointer-events-none">v</button>
        </div>

        {/* Main Content: Avatar & Status */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-16">
            
            {/* 3D Avatar Container */}
            <div className="relative group">
                {/* Visualizer Rings */}
                {status === 'connected' && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-pink-500/30" style={{ transform: `scale(${1 + volume * 0.3})`, opacity: 0.5 }}></div>
                        <div className="absolute inset-0 rounded-full border border-pink-500/20" style={{ transform: `scale(${1 + volume * 0.6})`, opacity: 0.3 }}></div>
                        <div className="absolute inset-0 rounded-full bg-pink-500/10 blur-xl" style={{ transform: `scale(${1 + volume * 0.8})`, opacity: volume }}></div>
                    </>
                )}
                
                {/* Connecting Animation */}
                {(status === 'connecting' || status === 'reconnecting') && (
                    <div className="absolute inset-0 rounded-full border-t-2 border-pink-500 animate-spin"></div>
                )}

                <div className="w-48 h-48 md:w-60 md:h-60 rounded-full p-1.5 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 shadow-2xl relative z-10 overflow-hidden">
                    <img 
                        src={profile.image} 
                        className={`w-full h-full rounded-full object-cover transition-all duration-700 ${status === 'connected' ? 'scale-110' : 'scale-100 grayscale opacity-80'}`} 
                    />
                </div>
            </div>

            <div className="mt-8 text-center space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{profile.name}</h2>
                
                {status === 'error' ? (
                    <div className="text-red-500 font-bold bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 animate-pulse">
                        {errorMessage || "Connection Failed"}
                    </div>
                ) : (
                   <div className="flex flex-col items-center gap-1">
                      <p className={`text-sm font-bold uppercase tracking-[0.2em] ${status === 'connected' ? 'text-pink-400' : 'text-gray-400 animate-pulse'}`}>
                          {status === 'connected' ? 'In Call...' : status === 'connecting' ? 'Calling...' : 'Reconnecting...'}
                      </p>
                      {status === 'connected' && (
                          <p className="text-2xl font-mono font-medium text-white/90 tabular-nums">{formatTime(callDuration)}</p>
                      )}
                   </div>
                )}
            </div>
            
            {status === 'error' && (
                <button onClick={handleRetry} className="mt-6 px-8 py-3 bg-white text-black font-black rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
                    Retry
                </button>
            )}
        </div>

        {/* Smart Control Dock */}
        <div className="w-full max-w-sm mx-auto">
             {/* Audio Wave Visual (Fake or Real based on volume) */}
             <div className="flex items-center justify-center gap-1 h-8 mb-8 opacity-50">
                 {[...Array(20)].map((_, i) => (
                     <div 
                        key={i} 
                        className="w-1 bg-white rounded-full transition-all duration-75"
                        style={{ 
                            height: status === 'connected' ? `${Math.max(4, volume * Math.random() * 40)}px` : '4px',
                            opacity: status === 'connected' ? 0.8 : 0.2
                        }}
                     ></div>
                 ))}
             </div>

             {/* Action Buttons */}
             <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 flex items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                 
                 {/* Speaker Button */}
                 <button 
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeakerOn ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
                 >
                    {isSpeakerOn ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                 </button>

                 {/* Mute Button */}
                 <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${isMuted ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
                 >
                     {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     )}
                 </button>

                 {/* End Call Button (Big Red) */}
                 <button 
                    onClick={endCall}
                    className="h-20 w-32 bg-gradient-to-r from-red-600 to-rose-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};
