
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal, ArrowRightLeft } from 'lucide-react';

interface BeforeAfterProps {
  original: string;
  enhanced: string;
  className?: string;
}

export const BeforeAfterDivider: React.FC<BeforeAfterProps> = ({ original, enhanced, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Unified Pointer Handler (Works for both Mouse and Touch)
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    
    // Calculate percentage (0 to 100)
    // We enforce physical LTR coordinates here: 0 is Left, 100 is Right
    let percentage = (x / width) * 100;
    
    // Clamp between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));
    
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    // Capture pointer to ensure we get events even if user drags outside div
    containerRef.current?.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[3/2] sm:aspect-square md:aspect-[16/9] rounded-xl overflow-hidden select-none group cursor-ew-resize shadow-2xl ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Safety fallback
      style={{ 
        touchAction: 'none', // Prevents scrolling while dragging on mobile
        direction: 'ltr'     // Forces physical Left=Left layout logic
      }}
    >
      {/* 
        LOGIC EXPLANATION:
        - We want RTL FEEL: Original on Right, Enhanced on Left.
        - Bottom Layer: Enhanced Image (Full Width).
        - Top Layer: Original Image.
        - We CLIP the Top Layer from the LEFT side based on slider position.
          - 0% slider (Left): Clip 0% -> Full Original Image visible.
          - 100% slider (Right): Clip 100% -> Original Image hidden (Enhanced visible).
          
        WAIT - The previous logic was:
        Right = Original. Left = Enhanced.
        If Slider is at 10% (Left):
          - We want mostly Original (Right side) visible. 
          - Enhanced (Left side) is small (10%).
        
        If Slider is at 90% (Right):
          - We want mostly Enhanced (Left side) visible.
          - Original (Right side) is small (10%).
      */}

      {/* BACKGROUND: Enhanced Image (Visual Left) */}
      <img 
        src={enhanced} 
        alt="Enhanced" 
        className="absolute inset-0 w-full h-full object-contain bg-black/50" 
        draggable={false}
      />
      
      {/* FOREGROUND: Original Image (Visual Right) */}
      {/* We clip the LEFT side of this image to reveal the background underneath */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          clipPath: `inset(0 0 0 ${sliderPosition}%)` 
        }}
      >
        <img 
          src={original} 
          alt="Original" 
          className="absolute inset-0 w-full h-full object-contain bg-black/50"
          draggable={false}
        />
        
        {/* Label: Original (Right) */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded border border-white/10 z-10 font-sans shadow-lg">
          أصلي (قبل)
        </div>
      </div>

      {/* Label: Enhanced (Left) - Always visible on base layer */}
      <div className="absolute top-4 left-4 bg-cyan-600/80 backdrop-blur text-white text-xs px-2 py-1 rounded border border-white/10 z-10 font-sans shadow-lg">
        محسنة (بعد)
      </div>

      {/* SLIDER LINE & HANDLE */}
      <div 
        className="absolute inset-y-0 w-1 bg-white/50 cursor-ew-resize z-20 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center ring-4 ring-black/20">
          <ArrowRightLeft size={16} className="text-black" />
        </div>
      </div>
      
      {/* Hint Text (Only visible initially) */}
      {!isDragging && sliderPosition === 50 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none animate-pulse">
            اسحب للمقارنة
         </div>
      )}

    </div>
  );
};
