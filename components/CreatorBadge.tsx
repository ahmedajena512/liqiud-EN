
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';

export const CreatorBadge: React.FC = () => {
  return (
    <motion.a
      href="https://www.facebook.com/ahmedAJ512"
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr" // Force LTR for English content
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, duration: 0.6, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group cursor-pointer"
    >
      {/* Dynamic Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-80 group-hover:blur-lg transition-all duration-500 animate-pulse"></div>
      
      {/* Gradient Border Container */}
      <div className="relative p-[2px] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-[length:200%_auto] animate-shine">
        
        {/* Inner Glass Content */}
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-full border border-white/5 shadow-2xl">
          
          {/* Pulsing Dot / Icon */}
          <div className="relative flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50"></span>
            <Sparkles size={12} className="relative text-cyan-300 sm:w-[14px] sm:h-[14px]" />
          </div>
          
          <div className="flex flex-col leading-none items-start">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/50 font-medium mb-0.5">
              Created by
            </span>
            <span className="text-xs sm:text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white group-hover:from-cyan-300 group-hover:via-white group-hover:to-cyan-300 transition-all duration-300">
              AhmedAJ1
            </span>
          </div>
          
          <div className="pl-2 border-l border-white/10 ml-1">
             <ExternalLink size={12} className="text-white/40 group-hover:text-cyan-400 transition-colors duration-300 sm:w-[14px] sm:h-[14px]" />
          </div>
        </div>
      </div>
    </motion.a>
  );
};
