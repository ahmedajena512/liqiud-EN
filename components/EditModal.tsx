
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Check, Square, Monitor, Smartphone, Layout, Loader2, Sparkles, Undo2 } from 'lucide-react';
import { api } from '../services/api';
import { useMediaQuery } from '../hooks/use-media-query';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  onSave: (newImage: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, originalImage, onSave }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setAspectRatio('1:1');
      setPreviewImage(null);
      setError(null);
    }
  }, [isOpen]);

  const ratios = [
    { label: 'مربع', value: '1:1', icon: Square },
    { label: 'أفقي', value: '16:9', icon: Monitor },
    { label: 'عمودي', value: '9:16', icon: Smartphone },
    { label: 'كلاسيكي', value: '4:3', icon: Layout },
    { label: '3:2', value: '3:2', icon: Monitor },
    { label: '2:3', value: '2:3', icon: Smartphone },
    { label: 'سينما', value: '21:9', icon: Monitor },
    { label: 'طويل', value: '3:4', icon: Layout },
  ];

  const zoomOptions = [
    { label: 'أصلي', value: 1 },
    { label: 'عريض (1.5x)', value: 1.5 },
    { label: 'عريض جداً (2x)', value: 2 },
    { label: 'أقصى (2.5x)', value: 2.5 },
  ];

  const handleProcessEdit = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Always edit the ORIGINAL image to avoid quality degradation from multiple passes
      const result = await api.editImage(originalImage, zoomLevel, aspectRatio);
      setPreviewImage(result);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "فشل تعديل الصورة. يرجى المحاولة مرة أخرى.";
      try {
        if (typeof error.message === 'string') {
           // Try to parse if it's a JSON string disguised as a message
           if (error.message.trim().startsWith('{')) {
               const parsed = JSON.parse(error.message);
               errorMessage = parsed.message || parsed.error?.message || errorMessage;
           } else {
               errorMessage = error.message;
           }
        }
      } catch (e) {
          errorMessage = error.message;
      }
      
      // Clean up common Google API error clutter
      errorMessage = errorMessage.replace(/https:\/\/[^\s]+/g, '').replace(/Quota exceeded.*/s, 'تم تجاوز الحصة اليومية. يرجى المحاولة لاحقاً.');

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (previewImage) {
      onSave(previewImage);
      onClose();
    }
  };

  const containerVariants: Variants = {
    hidden: isDesktop 
      ? { scale: 0.95, opacity: 0 } 
      : { y: "100%" },
    visible: isDesktop 
      ? { scale: 1, opacity: 1, transition: { type: "spring", duration: 0.5 } } 
      : { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: isDesktop 
      ? { scale: 0.95, opacity: 0 } 
      : { y: "100%" }
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          {/* Modal/Drawer Container */}
          <div className={`fixed inset-0 z-50 flex ${isDesktop ? 'items-center justify-center p-8' : 'items-end'} pointer-events-none`}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`
                pointer-events-auto w-full max-w-2xl bg-[#0f0f0f] border border-white/10
                flex flex-col shadow-2xl overflow-hidden
                ${isDesktop ? 'rounded-2xl max-h-[85vh]' : 'rounded-t-3xl h-[90vh]'}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-orange-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Sparkles size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight" dir="ltr">تعديل Banana Pro</h2>
                    <p className="text-xs text-white/40 font-mono" dir="ltr">مدعوم بواسطة Gemini 2.0</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
                
                {/* Preview Area */}
                <div className="relative w-full aspect-square sm:aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 opacity-10" 
                       style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    {isProcessing ? (
                       <div className="flex flex-col items-center gap-4 z-10">
                           <div className="relative">
                             <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                             <Loader2 className="animate-spin text-cyan-400 w-12 h-12 relative z-10" />
                           </div>
                           <span className="text-sm font-medium text-cyan-300 animate-pulse">جاري توسيع الواقع...</span>
                       </div>
                    ) : error ? (
                        <div className="text-center p-6 max-w-sm">
                             <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 mb-3">
                                 <X size={24} />
                             </div>
                             <h3 className="text-white font-medium mb-1">فشل التعديل</h3>
                             <p className="text-white/50 text-sm">{error}</p>
                        </div>
                    ) : (
                        <motion.img 
                          layoutId="preview-image"
                          src={previewImage || originalImage} 
                          alt="Preview" 
                          className="max-h-full max-w-full object-contain shadow-2xl"
                        />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className="bg-black/60 backdrop-blur border border-white/10 text-[10px] px-2 py-1 rounded-md text-white/70">
                      {previewImage ? 'معاينة' : 'أصلي'}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  
                  {/* Aspect Ratio */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-semibold pr-1">نسبة الأبعاد المستهدفة</label>
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                      {ratios.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setAspectRatio(r.value)}
                          className={`
                            relative overflow-hidden flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all duration-300
                            ${aspectRatio === r.value 
                              ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'}
                          `}
                        >
                          <r.icon size={18} />
                          <span className="text-[10px] sm:text-xs font-medium">{r.label}</span>
                          {aspectRatio === r.value && <div className="absolute inset-0 bg-cyan-400/5 animate-pulse"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom/Wide Controls */}
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-semibold pr-1">
                      توسيع الصورة (Outpainting)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                      {zoomOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setZoomLevel(opt.value)}
                          className={`
                            py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative
                            ${zoomLevel === opt.value
                              ? 'text-white shadow-md'
                              : 'text-white/40 hover:text-white hover:bg-white/5'}
                          `}
                        >
                          {zoomLevel === opt.value && (
                            <motion.div 
                              layoutId="active-zoom"
                              className="absolute inset-0 bg-gradient-to-l from-violet-600 to-indigo-600 rounded-lg -z-10"
                            />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-white/30 px-1 leading-relaxed">
                      * اختر قيمة أكبر من 1x "للتصغير" وتوليد محيط جديد للصورة.
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/5 bg-black/40 flex gap-3 sm:gap-4">
                {previewImage || error ? (
                   <button 
                     onClick={() => { setPreviewImage(null); setError(null); }}
                     disabled={isProcessing}
                     className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors"
                   >
                     <Undo2 size={20} />
                   </button>
                ) : null}

                <button 
                  onClick={handleProcessEdit}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10 disabled:opacity-50 text-sm sm:text-base"
                >
                  {previewImage || error ? 'إعادة التوليد' : 'توليد المعاينة'}
                </button>
                
                <button 
                  onClick={handleApply}
                  disabled={!previewImage || isProcessing}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Check size={18} />
                  اعتماد الصورة
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
