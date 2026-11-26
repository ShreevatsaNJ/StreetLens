import React, { useState, useRef, useCallback } from 'react';

export default function CompareSlider({ originalSrc, annotatedSrc }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl border border-zinc-800 select-none cursor-ew-resize bg-[#07090e] shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* Annotated / Enhanced Layer (Underneath) */}
      <img 
        src={annotatedSrc} 
        alt="Annotated Inspection with Bokeh Spotlight" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
      
      {/* Original Raw Layer (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={originalSrc} 
          alt="Original Raw Input" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
        />
      </div>

      {/* Vertical Divider Line with Cyan Glow */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_15px_#06b6d4] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0a0d14] border-2 border-cyan-400 flex items-center justify-center text-xs font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          ⇄
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 border border-zinc-700/80 shadow-lg">
        Raw Road Capture
      </div>
      <div className="absolute top-4 right-4 bg-cyan-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 border border-cyan-700/60 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        AI Bokeh Spotlight
      </div>
    </div>
  );
}
