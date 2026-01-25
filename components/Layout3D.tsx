
import React, { createContext, useContext } from 'react';
import { ViewState } from '../types';

interface Layout3DProps {
  children: React.ReactNode;
  view: ViewState;
}

// Context to tell children if they are in light or dark mode
const ThemeContext = createContext<{ isLight: boolean }>({ isLight: false });

export const Layout3D: React.FC<Layout3DProps> = ({ children, view }) => {
  // Define which views use the LIGHT theme
  const isLightMode = view === 'landing' || view === 'dashboard' || view === 'profile-selection' || view === 'auth';

  const themeClass = isLightMode
    ? "bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-slate-900"
    : "bg-gradient-to-br from-[#0f0518] via-[#1a0b2e] to-[#0f0518] text-white";

  return (
    <ThemeContext.Provider value={{ isLight: isLightMode }}>
      <div className={`min-h-screen font-['Hind_Siliguri'] overflow-x-hidden relative perspective-1000 transition-colors duration-500 ${themeClass}`}>
        
        {/* Background Ambience (Adapts to Theme) */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {isLightMode ? (
            // Light Mode Blobs
            <>
              <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-300/20 blur-[100px] rounded-full mix-blend-multiply animate-blob"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-300/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000"></div>
              <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-blue-300/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000"></div>
            </>
          ) : (
             // Dark Mode Blobs (Subtle)
            <>
              <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full animate-blob"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
            </>
          )}
        </div>
        
        {/* Content Layer */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const Card3D = ({ children, className = '', onClick }: any) => {
  const { isLight } = useContext(ThemeContext);
  
  const glassClass = isLight 
    ? "bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-indigo-100/30 text-slate-900" 
    : "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/50 text-white";

  return (
    <div 
      onClick={onClick}
      className={`
        relative group transition-all duration-500 ease-out transform-style-3d rounded-3xl
        ${glassClass}
        ${isLight ? 'hover:-translate-y-2 hover:shadow-pink-200/50' : 'hover:-translate-y-2 hover:bg-white/10'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const Button3D = ({ children, onClick, variant = 'primary', className = '', disabled }: any) => {
  const { isLight } = useContext(ThemeContext);

  const baseStyle = "relative px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-pink-600/30 hover:shadow-pink-600/50",
    secondary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/30 hover:shadow-purple-600/50",
    gold: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/30 hover:shadow-yellow-500/50",
    glass: isLight 
       ? "bg-white/50 text-slate-800 hover:bg-white/80 border border-white/50 shadow-sm"
       : "bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-sm"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};
