
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Link as LinkIcon, Info, AlertCircle, Loader2, Zap, AlertTriangle, Edit3, History as HistoryIcon } from 'lucide-react';
import { GlassCard } from './components/GlassCard';
import { DropZone } from './components/DropZone';
import { BeforeAfterDivider } from './components/BeforeAfterDivider';
import { InteractiveBackground } from './components/InteractiveBackground';
import { EditModal } from './components/EditModal';
import { HistorySidebar } from './components/HistorySidebar';
import { CreatorBadge } from './components/CreatorBadge';
import { api } from './services/api';
import { APP_CONSTANTS, STATUS_MESSAGES } from './constants';
import { AppState, HistoryItem } from './types';

const App: React.FC = () => {
  // Application State
  const [state, setState] = useState<AppState>({
    inputImage: null,
    outputImage: null,
    inputDimensions: null,
    status: 'idle',
    progress: 0,
    errorMsg: null,
    predictionId: null,
    estimatedTime: 0,
  });

  // Control State
  const [scale, setScale] = useState<number>(APP_CONSTANTS.DEFAULT_SCALE);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(false);
  const [realStatus, setRealStatus] = useState<string>(""); 
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refs for intervals
  const pollInterval = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  // Computed Estimated Dimensions
  const estWidth = state.inputDimensions ? Math.round(state.inputDimensions.width * scale) : 0;
  const estHeight = state.inputDimensions ? Math.round(state.inputDimensions.height * scale) : 0;
  const totalOutputPixels = estWidth * estHeight;
  const isResolutionTooHigh = totalOutputPixels > APP_CONSTANTS.MAX_OUTPUT_PIXELS;

  // --- Load History on Mount ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('liquid_upscale_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load history from local storage");
    }
  }, []);

  // --- Save History Helper ---
  const saveHistory = (newHistory: HistoryItem[]) => {
    try {
      setHistory(newHistory);
      localStorage.setItem('liquid_upscale_history', JSON.stringify(newHistory));
    } catch (e) {
      // If quota exceeded, remove oldest and try again
      if (newHistory.length > 1) {
        const trimmed = newHistory.slice(0, -1);
        saveHistory(trimmed);
      } else {
         console.warn("Storage full, cannot save history");
      }
    }
  };

  const addToHistory = (original: string, enhanced: string, width: number, height: number) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalImage: original,
      enhancedImage: enhanced,
      dimensions: { width, height },
      params: { scale, faceEnhance }
    };
    
    // Keep max 10 items
    const newHistory = [newItem, ...history].slice(0, 10);
    saveHistory(newHistory);
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setState({
      inputImage: item.originalImage,
      outputImage: item.enhancedImage,
      inputDimensions: item.dimensions,
      status: 'completed',
      progress: 100,
      errorMsg: null,
      predictionId: null,
      estimatedTime: 0
    });
    setScale(item.params.scale);
    setFaceEnhance(item.params.faceEnhance);
    setRealStatus("تمت الاستعادة من السجل");
  };

  // --- Handlers ---

  const handleImageSelected = (base64: string, width: number, height: number) => {
    setState({
      ...state,
      inputImage: base64,
      outputImage: null,
      inputDimensions: { width, height },
      status: 'idle',
      errorMsg: null,
      progress: 0
    });
    setRealStatus("");
  };

  const handleEditComplete = (newImage: string) => {
    const img = new Image();
    img.onload = () => {
        setState(prev => ({
            ...prev,
            inputImage: newImage,
            inputDimensions: { width: img.width, height: img.height },
            outputImage: null, // Reset previous result if any
            status: 'idle'
        }));
    };
    img.src = newImage;
  };

  const estimateDuration = (): number => {
    if (!state.inputDimensions) return 5;
    const pixels = state.inputDimensions.width * state.inputDimensions.height;
    const megaPixels = pixels / 1000000;
    
    if (megaPixels < 1) return 5;
    if (megaPixels < 4) return 10;
    return 15 + (megaPixels * 1.5); 
  };

  const startEnhancement = async () => {
    if (!state.inputImage) return;
    if (isResolutionTooHigh) {
      handleError("أبعاد الصورة المخرجة تتجاوز الحد المسموح به.");
      return;
    }

    const duration = estimateDuration();
    setState(prev => ({ 
      ...prev, 
      status: 'uploading', 
      errorMsg: null, 
      progress: 5,
      estimatedTime: duration
    }));
    setRealStatus("جاري الرفع...");

    try {
      const prediction = await api.startPrediction({
        image: state.inputImage,
        scale,
        face_enhance: faceEnhance
      });

      setState(prev => ({ 
        ...prev, 
        status: 'processing', 
        predictionId: prediction.id 
      }));
      
      setRealStatus("جاري التهيئة...");

      startPolling(prediction.id);
      startProgressSimulation(duration);

    } catch (err: any) {
      handleError(err.message || "فشل بدء عملية التحسين");
    }
  };

  const startPolling = (id: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const response = await api.getPredictionStatus(id);
        
        if (response.status === 'starting') {
           setRealStatus("جاري تحضير المعالج... (قد يستغرق وقتاً)");
        } else if (response.status === 'processing') {
           setRealStatus("جاري تحسين التفاصيل...");
        }

        if (response.status === 'succeeded' && response.output) {
          completeEnhancement(response.output);
        } else if (response.status === 'failed' || response.status === 'canceled') {
          handleError(response.error || "فشلت العملية في الخادم");
        }
      } catch (err) {
        console.warn("Polling error", err);
      }
    }, APP_CONSTANTS.POLL_INTERVAL_MS);
  };

  const startProgressSimulation = (durationSec: number) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    const stepMs = 200;
    const totalSteps = (durationSec * 1000) / stepMs;
    let currentStep = 0;

    progressInterval.current = setInterval(() => {
      currentStep++;
      setState(prev => {
        if (prev.status !== 'processing' && prev.status !== 'uploading') return prev;
        
        const slowFactor = (realStatus.includes("تحضير") || realStatus.includes("التهيئة")) ? 2 : 1;
        const rawPercentage = 1 - Math.exp(-3 * currentStep / (totalSteps * slowFactor));
        const percentage = Math.min(95, Math.round(rawPercentage * 100));
        
        return { ...prev, progress: Math.max(prev.progress, percentage) };
      });
    }, stepMs);
  };

  const completeEnhancement = (outputUrl: string) => {
    cleanupTimers();
    setRealStatus("تم الاكتمال");
    
    // Add to history
    if (state.inputImage && state.inputDimensions) {
      addToHistory(state.inputImage, outputUrl, state.inputDimensions.width, state.inputDimensions.height);
    }

    setState(prev => ({
      ...prev,
      status: 'completed',
      outputImage: outputUrl,
      progress: 100
    }));
  };

  const handleError = (msg: string) => {
    cleanupTimers();
    setRealStatus("خطأ");
    setState(prev => ({
      ...prev,
      status: 'error',
      errorMsg: msg,
      progress: 0
    }));
  };

  const cleanupTimers = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  const copyToClipboard = () => {
    if (state.outputImage) {
      navigator.clipboard.writeText(state.outputImage);
      alert("تم نسخ الرابط للحافظة!"); 
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  return (
    <div className="min-h-screen w-full text-white font-sans pb-16 sm:pb-20 selection:bg-cyan-500/30">
      
      <InteractiveBackground />
      
      <div className="relative z-10">
        
        <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl transition-all duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 font-mono" dir="ltr">
                Liquid<span className="font-light">Upscale</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
               <div className="hidden md:block text-xs text-white/30 font-mono border-l border-white/10 pl-4" dir="ltr">
                   v1.2.0 • Real-ESRGAN
               </div>
               <button 
                 onClick={() => setIsHistoryOpen(true)}
                 className="p-2 sm:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5 flex items-center gap-2 group"
               >
                 <HistoryIcon size={18} className="group-hover:text-cyan-400 transition-colors" />
                 <span className="text-sm font-medium hidden sm:inline">السجل</span>
               </button>
            </div>
          </div>
        </header>

        <main className="pt-24 sm:pt-32 px-4 sm:px-6 max-w-5xl mx-auto space-y-6 sm:space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            <div className="lg:col-span-7 space-y-6">
               {state.outputImage ? (
                 <GlassCard className="h-full flex flex-col p-0 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center">
                      <h2 className="text-base sm:text-lg font-medium">مقارنة النتائج</h2>
                      <button 
                        onClick={() => setState(p => ({ ...p, outputImage: null, status: 'idle' }))}
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        تحسين صورة جديدة
                      </button>
                    </div>
                    <div className="flex-1 bg-black/20 relative min-h-[300px] sm:min-h-[400px]">
                      <BeforeAfterDivider 
                        original={state.inputImage!} 
                        enhanced={state.outputImage} 
                      />
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                      <a 
                        href={state.outputImage} 
                        download="enhanced-image.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 sm:py-3 rounded-xl transition-all font-medium border border-white/10 text-sm sm:text-base"
                      >
                        <Download size={18} /> تحميل
                      </a>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-2.5 sm:py-3 rounded-xl transition-all font-medium border border-white/10 text-sm sm:text-base"
                      >
                        <LinkIcon size={18} /> نسخ الرابط
                      </button>
                    </div>
                 </GlassCard>
               ) : (
                 <GlassCard className="h-full flex flex-col justify-center min-h-[350px] sm:min-h-[400px]">
                    <DropZone 
                      onImageSelected={handleImageSelected} 
                      disabled={state.status === 'processing' || state.status === 'uploading'}
                    />
                    {state.inputImage && (
                      <div className="mt-6 relative group rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={state.inputImage} alt="Preview" className="w-full h-48 sm:h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute top-2 left-2">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all hover:border-cyan-500/50 hover:text-cyan-300 shadow-lg group-hover:scale-105"
                                disabled={state.status !== 'idle'}
                            >
                                <Edit3 size={14} />
                                <span className="text-xs font-medium" dir="ltr">تعديل Banana Pro</span>
                            </button>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                           <p className="text-xs sm:text-sm font-mono text-cyan-400 text-left" dir="ltr">
                             Original: {state.inputDimensions?.width} x {state.inputDimensions?.height}px
                           </p>
                        </div>
                      </div>
                    )}
                 </GlassCard>
               )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              <GlassCard className="space-y-6 sm:space-y-8 lg:sticky lg:top-24">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                      معامل التكبير (Upscale)
                    </label>
                    
                    <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/10 rounded-lg blur-md group-hover:bg-cyan-500/20 transition-colors opacity-0 group-hover:opacity-100"></div>
                        <div className="relative flex items-center bg-black/40 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors px-3 py-1.5">
                          <span className="text-xs text-white/40 ml-2 font-medium font-mono">x</span>
                          <input 
                              type="number"
                              min="1"
                              max="10"
                              step="0.01"
                              value={scale}
                              onChange={(e) => {
                                 let val = parseFloat(e.target.value);
                                 if (isNaN(val)) return; 
                                 if (val > 10) val = 10;
                                 if (val < 1) val = 1;
                                 setScale(val);
                              }}
                              className="w-16 bg-transparent text-left text-cyan-300 font-mono font-bold outline-none focus:ring-0"
                          />
                        </div>
                    </div>
                  </div>

                  {/* Range Slider Container - FORCED LTR */}
                  <div className="relative w-full h-8 flex items-center select-none mb-2 group" dir="ltr">
                    <div className="absolute w-full h-2 bg-black/50 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-white/5"></div>
                    
                    {/* Visual Track - Anchored LEFT */}
                    <div 
                      className={`absolute h-2 left-0 top-1/2 -translate-y-1/2 rounded-full transition-[width] duration-75 ease-out
                        ${isResolutionTooHigh ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 via-cyan-500 to-cyan-800'}
                      `}
                      style={{ width: `${((scale - 1) / 9) * 100}%` }}
                    >
                        {!isResolutionTooHigh && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.01"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      disabled={state.status !== 'idle' && state.status !== 'error'}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      style={{ direction: 'ltr' }}
                    />

                    {/* Visual Thumb - Positioned from LEFT */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 -ml-3 pointer-events-none z-10 flex items-center justify-center transition-transform duration-150 ease-out group-active:scale-110"
                      style={{ left: `${((scale - 1) / 9) * 100}%` }}
                    >
                      <div className={`w-6 h-6 rounded-full bg-[#1a1a1a] shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center backdrop-blur-md border ${isResolutionTooHigh ? 'border-red-500 shadow-red-500/30' : 'border-cyan-500/50 shadow-cyan-500/30'}`}>
                          <div className={`w-2 h-2 rounded-full shadow-lg ${isResolutionTooHigh ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between px-1 mt-2" dir="ltr">
                     {[1, 2.5, 5, 7.5, 10].map(tick => (
                        <div key={tick} className="flex flex-col items-center gap-1">
                            <div className={`w-0.5 h-1 ${scale >= tick ? (isResolutionTooHigh ? 'bg-red-500/50' : 'bg-cyan-500/50') : 'bg-white/10'} transition-colors`}></div>
                            <span className="text-[10px] text-white/30 font-mono">{tick}</span>
                        </div>
                     ))}
                  </div>
                  
                  <div className={`mt-6 p-3 rounded-lg border transition-all duration-300 ${
                    isResolutionTooHigh 
                      ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)] animate-pulse' 
                      : 'bg-white/5 border-white/5'
                    } flex justify-between items-center`}>
                    
                    <div className="flex flex-col">
                      <p className={`text-xs uppercase tracking-wider ${isResolutionTooHigh ? 'text-red-400 font-bold' : 'text-white/60'}`}>
                        {isResolutionTooHigh ? 'تحذير: الأبعاد كبيرة جداً' : 'حجم الإخراج المتوقع'}
                      </p>
                      {isResolutionTooHigh && (
                        <span className="text-[10px] text-red-300 mt-1">
                          الحد الأقصى: {APP_CONSTANTS.MAX_OUTPUT_PIXELS.toLocaleString()} بكسل
                        </span>
                      )}
                    </div>
                    
                    <div className="text-left" dir="ltr">
                      <p className={`text-base sm:text-lg font-light font-mono ${isResolutionTooHigh ? 'text-red-400' : 'text-cyan-300'}`}>
                        {state.inputDimensions ? `${estWidth} × ${estHeight}` : '---'} <span className="text-xs text-white/40 font-sans">px</span>
                      </p>
                      {state.inputDimensions && (
                        <p className={`text-[10px] font-mono ${isResolutionTooHigh ? 'text-red-400' : 'text-white/30'}`}>
                          ≈ {((totalOutputPixels) / 1000000).toFixed(2)} MP
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white/90">تحسين الوجه (GFPGAN)</label>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                        checked={faceEnhance}
                        onChange={(e) => setFaceEnhance(e.target.checked)}
                        disabled={state.status !== 'idle' && state.status !== 'error'}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${faceEnhance ? 'bg-cyan-600' : 'bg-white/10'}`}></div>
                      <div className={`absolute right-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${faceEnhance ? '-translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start text-xs text-white/50 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    <Info size={14} className="mt-0.5 text-amber-400 shrink-0" />
                    <p>استخدمه فقط للصور الحقيقية التي تحتوي على وجوه.</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  {state.status === 'error' && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-sm text-red-200">
                      <AlertCircle size={18} />
                      {state.errorMsg}
                    </div>
                  )}

                  {(state.status === 'uploading' || state.status === 'processing') && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm text-cyan-300 font-medium">
                        <span>{realStatus || STATUS_MESSAGES[state.status]}</span>
                        <span className="font-mono">{state.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden" dir="ltr">
                        <div 
                          className="h-full bg-cyan-400 transition-all duration-300 ease-out relative"
                          style={{ width: `${state.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/50 w-full animate-[shine_1s_infinite] skew-x-12"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={startEnhancement}
                    disabled={!state.inputImage || state.status === 'processing' || state.status === 'uploading' || isResolutionTooHigh}
                    className={`
                      w-full py-3.5 sm:py-4 rounded-xl font-semibold text-lg relative overflow-hidden group
                      transition-all duration-300
                      ${(!state.inputImage || state.status !== 'idle' && state.status !== 'error' || isResolutionTooHigh)
                        ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_40px_rgba(8,145,178,0.4)] hover:shadow-[0_0_60px_rgba(8,145,178,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                      }
                    `}
                  >
                    {state.status === 'processing' || state.status === 'uploading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" /> جاري التحسين...
                      </span>
                    ) : isResolutionTooHigh ? (
                        <span className="flex items-center justify-center gap-2 relative z-10 text-red-400">
                            <AlertTriangle size={20} /> الدقة عالية جداً
                        </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 relative z-10">
                        <Zap className="fill-white" size={20} /> تحسين الصورة
                      </span>
                    )}
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
          
          {state.inputImage && (
             <EditModal 
               isOpen={isEditModalOpen} 
               onClose={() => setIsEditModalOpen(false)}
               originalImage={state.inputImage}
               onSave={handleEditComplete}
             />
          )}

          <HistorySidebar 
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={history}
            onSelect={loadFromHistory}
            onDelete={deleteHistoryItem}
            onClear={clearHistory}
          />

          <CreatorBadge />

        </main>
      </div>
    </div>
  );
};

export default App;
