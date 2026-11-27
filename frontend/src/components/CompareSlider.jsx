import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function CompareSlider({ 
  originalSrc, 
  annotatedSrc, 
  rawLabel = "RAW CAPTURE",
  spotlightLabel = "AI SPOTLIGHT",
  aspectRatio = "16/10",
  children
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Measure container width accurately for the clipped raw image
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      ro.disconnect();
    };
  }, []);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleMouseDown = (e) => { 
    isDragging.current = true; 
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging.current) {
        handleMove(e.clientX);
      }
    };
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMove]);

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-[#2e2e38] select-none cursor-ew-resize bg-[#0c0c0e] shadow-2xl"
      style={{ aspectRatio: aspectRatio || '16/10' }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => { isDragging.current = true; if (e.touches[0]) handleMove(e.touches[0].clientX); }}
      onTouchEnd={() => { isDragging.current = false; }}
      onTouchMove={handleTouchMove}
    >
      {/* Annotated / AI Spotlight Layer (Underneath - Full Width) */}
      <img 
        src={annotatedSrc} 
        alt="AI Spotlight Inspection View" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* Original Raw Layer (Clipped to slider position) */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none z-20"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={originalSrc} 
          alt="Original Raw Input" 
          className="absolute inset-y-0 left-0 h-full object-cover pointer-events-none max-w-none"
          style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}
        />
      </div>

      {/* Interactive Defect Bounding Boxes Overlay (z-25: above raw layer, below slider handle z-30) */}
      {children && (
        <div className="absolute inset-0 pointer-events-none z-25">
          {children}
        </div>
      )}

      {/* Vertical Divider Line with Glow */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none z-30"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Center Circular Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#121215]/95 text-white border-2 border-white/80 flex items-center justify-center text-xs shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
          <span className="text-[11px] font-bold tracking-tighter">⇄</span>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute top-3 left-3 bg-[#0c0c0e]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-[#d6d0c7] border border-white/10 shadow-lg pointer-events-none z-30">
        {rawLabel}
      </div>
      <div className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg pointer-events-none z-30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        {spotlightLabel}
      </div>
    </div>
  );
}
