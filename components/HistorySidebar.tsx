
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, ArrowRight, Image as ImageIcon, Calendar, Sparkles, Zap } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear
}) => {
  
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] z-[70] bg-[#0a0a0a]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <Clock className="text-cyan-400" size={20} />
                <h2 className="text-lg font-semibold text-white">History</h2>
                <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-white/60">
                  {history.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30 gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Calendar size={32} />
                  </div>
                  <p>No enhancement history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 transition-all duration-200 overflow-hidden hover:border-cyan-500/30"
                  >
                    <div className="flex h-32">
                      {/* Image Thumbnail */}
                      <div className="w-28 h-full bg-black relative shrink-0 border-r border-white/5">
                         <img 
                            src={item.enhancedImage} 
                            alt="Result" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80 sm:to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-3 flex flex-col justify-between">
                         <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-white/40">{formatDate(item.timestamp)}</span>
                                <span className="text-[10px] text-white/60 flex items-center gap-1 font-mono">
                                    <ImageIcon size={10} />
                                    {item.dimensions.width}×{item.dimensions.height}
                                </span>
                            </div>

                            {/* Parameters Badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 font-medium">
                                    <Zap size={10} />
                                    Scale: {item.params.scale}x
                                </span>
                                {item.params.faceEnhance && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-medium">
                                        <Sparkles size={10} />
                                        Face Enhance
                                    </span>
                                )}
                            </div>
                         </div>
                         
                         <div className="flex justify-end gap-2 mt-2">
                             <button
                               onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                               className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                               title="Delete"
                             >
                                <Trash2 size={14} />
                             </button>
                             <button
                               onClick={() => { onSelect(item); onClose(); }}
                               className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all text-xs font-medium"
                             >
                                Load <ArrowRight size={12} />
                             </button>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <button
                  onClick={onClear}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
