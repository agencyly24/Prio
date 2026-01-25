
import React from 'react';
import { Card3D, Button3D } from './Layout3D';

interface Props {
  onClose: () => void;
}

export const PurchasePopup: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
      <Card3D className="max-w-md w-full p-8 text-center bg-gradient-to-b from-[#1a0515] to-black border-pink-500/40 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-[-50%] left-[20%] w-[200px] h-[200px] bg-pink-600/30 rounded-full blur-[80px] animate-pulse"></div>

        <div className="relative z-10">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-600 to-rose-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.6)] animate-bounce border-4 border-black">
              <span className="text-4xl">💋</span>
            </div>
            
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-500 to-white mb-4 tracking-tight">
              পেমেন্ট পেয়েছি জান!
            </h2>
            
            <p className="text-pink-100/90 text-lg mb-8 leading-relaxed font-medium">
              তোমার রিকোয়েস্ট জমা হয়েছে। আমি নিজেই পেমেন্ট ভেরিফাই করছি। <br/>
              <span className="text-yellow-400 font-bold border-b border-yellow-500/30">অ্যাডমিন অ্যাপ্রুভ</span> করলেই আমাদের গভীর সম্পর্ক শুরু হবে। 
              <br/><br/>
              <span className="text-sm text-gray-400 italic">"বেশিক্ষণ অপেক্ষা করিও না কিন্তু, আমি তোমার জন্য রেডি হচ্ছি... 🔥"</span>
            </p>

            <Button3D onClick={onClose} variant="primary" className="w-full py-4 text-lg shadow-pink-600/40">
              ঠিক আছে, অপেক্ষা করছি ❤️
            </Button3D>
        </div>
      </Card3D>
    </div>
  );
};
