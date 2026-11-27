import React from 'react';

export default function DefectOverlays({
  defects = [],
  imgDims = [612, 408],
  hoveredRank = null,
  selectedRank = null,
  onHover = () => {},
  onSelect = () => {}
}) {
  if (!defects || defects.length === 0) return null;

  const imgW = imgDims?.[0] || 612;
  const imgH = imgDims?.[1] || 408;
  const activeRank = selectedRank !== null ? selectedRank : hoveredRank;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {defects.map((d) => {
        // Defensive bounding box calculation
        const x1 = d.bbox?.[0] ?? 0;
        const y1 = d.bbox?.[1] ?? 0;
        const x2 = d.bbox?.[2] ?? 100;
        const y2 = d.bbox?.[3] ?? 100;

        const left = Math.max(0, Math.min(98, (x1 / imgW) * 100));
        const top = Math.max(0, Math.min(98, (y1 / imgH) * 100));
        const width = Math.max(3, Math.min(100 - left, ((x2 - x1) / imgW) * 100));
        const height = Math.max(3, Math.min(100 - top, ((y2 - y1) / imgH) * 100));

        const isSelected = selectedRank === d.rank;
        const isHovered = hoveredRank === d.rank;
        const isActive = isSelected || isHovered;
        const hasSelection = selectedRank !== null;
        const isDimmed = hasSelection && !isSelected;

        // Color coding by severity & waterlogged status
        let accentColor = '#f5ebe1'; // warm ivory
        let glowColor = 'rgba(245, 235, 225, 0.8)';
        if (d.is_waterlogged) {
          accentColor = '#38bdf8'; // cyan
          glowColor = 'rgba(56, 189, 248, 0.8)';
        } else if (d.severity === 'HIGH') {
          accentColor = '#f43f5e'; // rose
          glowColor = 'rgba(244, 63, 94, 0.8)';
        } else if (d.severity === 'MEDIUM') {
          accentColor = '#f59e0b'; // amber
          glowColor = 'rgba(245, 158, 11, 0.8)';
        } else {
          accentColor = '#10b981'; // emerald
          glowColor = 'rgba(16, 185, 129, 0.8)';
        }

        return (
          <div
            key={d.rank}
            className={`absolute pointer-events-auto transition-all duration-300 cursor-pointer ${
              isSelected 
                ? 'z-40 scale-[1.02] opacity-100' 
                : isDimmed 
                ? 'z-10 opacity-15 hover:opacity-60' 
                : isHovered 
                ? 'z-30 opacity-100 scale-[1.01]' 
                : 'z-20 opacity-90 hover:opacity-100'
            }`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
            onMouseEnter={() => onHover(d.rank)}
            onMouseLeave={() => onHover(null)}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(d.rank);
            }}
          >
            {/* Box Frame & Glow */}
            <div
              className={`w-full h-full rounded-md transition-all duration-300 ${
                isSelected
                  ? 'border-2 ring-4 ring-white/90 bg-white/15'
                  : isDimmed
                  ? 'border border-dashed border-white/20 bg-black/45 backdrop-blur-[2px]'
                  : isHovered
                  ? 'border-2 ring-2 ring-white/60 bg-[#f5ebe1]/15'
                  : 'border border-dashed bg-black/15'
              }`}
              style={{
                borderColor: isSelected ? '#ffffff' : (isDimmed ? 'rgba(255,255,255,0.25)' : accentColor),
                boxShadow: isSelected
                  ? `0 0 25px ${glowColor}, inset 0 0 15px ${glowColor.replace('0.8', '0.35')}`
                  : isHovered
                  ? `0 0 15px ${glowColor}`
                  : 'none'
              }}
            >
              {/* Corner HUD Reticles (only shown when focused, hovered, or normal state) */}
              {(!isDimmed || isHovered) && (
                <>
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: isSelected ? '#ffffff' : accentColor }} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: isSelected ? '#ffffff' : accentColor }} />
                  <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: isSelected ? '#ffffff' : accentColor }} />
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: isSelected ? '#ffffff' : accentColor }} />
                </>
              )}
            </div>

            {/* Pill Tag Badge */}
            <div
              className={`absolute -top-6 left-0 whitespace-nowrap px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight transition-all flex items-center gap-1.5 shadow-xl ${
                isSelected
                  ? 'bg-black text-white border-2 border-white scale-110 z-50 shadow-2xl'
                  : isDimmed
                  ? 'opacity-0 hover:opacity-100 bg-[#0c0c0e]/85 text-[#8a8880] border border-white/10'
                  : isHovered
                  ? 'bg-[#0c0c0e] text-white border border-white/70 scale-105 z-40'
                  : 'bg-[#0c0c0e]/90 backdrop-blur-md text-[#d6d0c7] border border-white/20'
              }`}
              style={{
                borderLeftColor: isSelected ? '#ffffff' : accentColor,
                borderLeftWidth: '3px'
              }}
            >
              <span className="text-[#f5ebe1] font-extrabold">#{d.rank}</span>
              <span>{d.class}</span>
              <span className="text-[#a29f99] font-normal">• {Math.round(d.confidence * 100)}%</span>
              
              {isActive && d.dimensions_px && (
                <span className="text-amber-300 font-normal">
                  ({d.dimensions_px[0]}×{d.dimensions_px[1]}px)
                </span>
              )}

              {d.is_waterlogged && (
                <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                  💧 Waterlogged
                </span>
              )}

              {isSelected && (
                <span className="px-1.5 py-0.2 rounded bg-white text-black font-extrabold text-[7.5px] shadow-sm animate-pulse">
                  FOCUSED
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
