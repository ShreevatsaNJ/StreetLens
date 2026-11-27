import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Rewind, Volume2, 
  VolumeX, Maximize2, ShieldAlert, Droplet, Eye, Sparkles
} from 'lucide-react';

function formatTime(secs) {
  if (isNaN(secs) || secs === null) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VideoAnalysisPlayer({
  videoSrc,
  frameDetections = [],
  imageDimensions = [960, 540],
  hoveredRank = null,
  selectedRank = null,
  onHoverDefect = () => {},
  onSelectDefect = () => {},
  seekToTime = null
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  const imgW = imageDimensions?.[0] || 960;
  const imgH = imageDimensions?.[1] || 540;

  // External seek trigger (e.g. user clicked a defect in the ledger)
  useEffect(() => {
    if (seekToTime !== null && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration || 999, seekToTime));
      setCurrentTime(seekToTime);
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [seekToTime, duration]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skipSeconds = (seconds) => {
    if (!videoRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  // Find the detection frame matching current video playback time
  // Matches the closest sampled frame within a smooth 0.65s temporal window
  const matchedFrame = frameDetections.reduce((closest, f) => {
    if (!closest) return f;
    return Math.abs(f.timestamp_sec - currentTime) < Math.abs(closest.timestamp_sec - currentTime) ? f : closest;
  }, null);

  const activeDefects = (matchedFrame && Math.abs(matchedFrame.timestamp_sec - currentTime) <= 0.65)
    ? (matchedFrame.defects || []) 
    : [];

  const currentCondition = matchedFrame?.road_condition || 'GOOD';

  // Condition color scheme
  let conditionColor = '#10b981'; // green
  if (currentCondition === 'CRITICAL') conditionColor = '#f43f5e';
  else if (currentCondition === 'POOR') conditionColor = '#f97316';
  else if (currentCondition === 'FAIR') conditionColor = '#f59e0b';

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-[#2a2a34] bg-black shadow-2xl select-none group"
      style={{ aspectRatio: `${imgW} / ${imgH}` }}
    >
      {/* HTML5 Video Source */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Synchronized Real-Time Detection Overlays Layer */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {activeDefects.map((d) => {
          const x1 = d.bbox?.[0] ?? 0;
          const y1 = d.bbox?.[1] ?? 0;
          const x2 = d.bbox?.[2] ?? 100;
          const y2 = d.bbox?.[3] ?? 100;

          const left = Math.max(0, Math.min(98, (x1 / imgW) * 100));
          const top = Math.max(0, Math.min(98, (y1 / imgH) * 100));
          const width = Math.max(3, Math.min(100 - left, ((x2 - x1) / imgW) * 100));
          const height = Math.max(3, Math.min(100 - top, ((y2 - y1) / imgH) * 100));

          const isHovered = hoveredRank === d.rank;
          const isSelected = selectedRank === d.rank;
          const isActive = isSelected || isHovered;
          const isDimmed = (selectedRank !== null || hoveredRank !== null) && !isActive;

          let accent = '#f5ebe1';
          let glow = 'rgba(245, 235, 225, 0.85)';
          if (d.is_waterlogged) {
            accent = '#38bdf8';
            glow = 'rgba(56, 189, 248, 0.9)';
          } else if (d.severity === 'HIGH') {
            accent = '#f43f5e';
            glow = 'rgba(244, 63, 94, 0.9)';
          } else if (d.severity === 'MEDIUM') {
            accent = '#f59e0b';
            glow = 'rgba(245, 158, 11, 0.9)';
          } else {
            accent = '#10b981';
            glow = 'rgba(16, 185, 129, 0.9)';
          }

          return (
            <div
              key={d.rank || `${left}-${top}`}
              className={`absolute pointer-events-auto transition-all duration-100 cursor-pointer ${
                isActive ? 'z-40 scale-[1.02]' : isDimmed ? 'opacity-25 z-10' : 'opacity-90 hover:opacity-100 z-20'
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
              onMouseEnter={() => onHoverDefect(d.rank)}
              onMouseLeave={() => onHoverDefect(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) videoRef.current.pause();
                onSelectDefect(d.rank);
              }}
            >
              {/* Box Frame */}
              <div
                className={`w-full h-full rounded-md transition-all ${
                  isSelected
                    ? 'border-2 ring-2 ring-white/90 bg-[#f5ebe1]/15'
                    : isActive
                    ? 'border-2 bg-[#f5ebe1]/10'
                    : 'border-2 bg-black/10'
                }`}
                style={{
                  borderColor: isSelected ? '#ffffff' : accent,
                  boxShadow: isActive
                    ? `0 0 25px ${glow}, inset 0 0 12px ${glow.replace('0.9', '0.3')}`
                    : `0 0 10px ${glow.replace('0.9', '0.4')}`
                }}
              >
                {/* HUD Corner Reticles */}
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: isSelected ? '#fff' : accent }} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: isSelected ? '#fff' : accent }} />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: isSelected ? '#fff' : accent }} />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: isSelected ? '#fff' : accent }} />
              </div>

              {/* Tag Pill Badge */}
              <div
                className={`absolute -top-6 left-0 whitespace-nowrap px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight flex items-center gap-1.5 shadow-xl transition-all ${
                  isActive
                    ? 'bg-[#0c0c0e] text-white border border-white/60 scale-105'
                    : 'bg-[#0c0c0e]/90 backdrop-blur-md text-[#d6d0c7] border border-white/20'
                }`}
                style={{
                  borderLeftColor: isSelected ? '#ffffff' : accent,
                  borderLeftWidth: '3px'
                }}
              >
                <span className="text-[#f5ebe1] font-extrabold">#{d.rank}</span>
                <span>{d.class}</span>
                <span className="text-[#a29f99] font-normal">• {Math.round((d.confidence || 0.8) * 100)}%</span>
                {d.is_waterlogged && <span className="text-cyan-400">💧 Waterlogged</span>}
                {isSelected && <span className="px-1 rounded bg-emerald-500 text-black font-extrabold text-[7px]">PINNED</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top HUD Overlay: Road Condition & Telemetry */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0c0c0e]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono shadow-lg">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
            <span className="font-bold text-white tracking-wider">
              {isPlaying ? 'AI REAL-TIME SCAN' : 'FRAME PAUSED'}
            </span>
          </div>

          {/* Real-Time Road Condition Badge */}
          <div 
            className="px-2.5 py-1 rounded-md backdrop-blur-md text-[10px] font-mono font-extrabold border shadow-lg uppercase tracking-wide"
            style={{
              backgroundColor: `${conditionColor}22`,
              color: conditionColor,
              borderColor: `${conditionColor}66`
            }}
          >
            {currentCondition}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Defect Counter in Current Frame */}
          <div className="px-2.5 py-1 rounded-md bg-[#0c0c0e]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#f5ebe1] shadow-lg flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>
              <strong className="text-white">{activeDefects.length}</strong> {activeDefects.length === 1 ? 'Hazard' : 'Hazards'} in frame
            </span>
          </div>

          {/* Time Code */}
          <div className="px-2.5 py-1 rounded-md bg-[#0c0c0e]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#d6d0c7] shadow-lg">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Center Play Button Overlay when Paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#121215]/90 hover:bg-[#1a1a20] text-white border-2 border-white/60 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:scale-110 transition-all cursor-pointer z-30 pointer-events-auto"
        >
          <Play className="w-6 h-6 fill-white ml-0.5 text-white" />
        </button>
      )}

      {/* Bottom Playback & Scrubber Controls */}
      <div className="absolute bottom-0 inset-x-0 p-3 pt-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 transition-opacity">
        
        {/* Scrubber Track with Defect Marker Pips */}
        <div className="relative mb-2 w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-[#2a2a34] rounded-lg appearance-none cursor-pointer accent-[#f5ebe1]"
          />

          {/* Defect Markers along the Timeline */}
          {duration > 0 && frameDetections.map((f, idx) => {
            if (!f.defects || f.defects.length === 0) return null;
            const pct = Math.max(0, Math.min(100, (f.timestamp_sec / duration) * 100));
            const hasHigh = f.defects.some(d => d.severity === 'HIGH');
            const dotColor = hasHigh ? '#f43f5e' : '#f59e0b';

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  skipSeconds(f.timestamp_sec - currentTime);
                }}
                title={`${f.timestamp_str}: ${f.defects.length} hazard(s)`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white hover:scale-150 transition-transform cursor-pointer shadow-md"
                style={{
                  left: `${pct}%`,
                  backgroundColor: dotColor,
                  boxShadow: `0 0 6px ${dotColor}`
                }}
              />
            );
          })}
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-between text-xs text-[#d6d0c7]">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-[#18181e] hover:bg-[#252530] text-white border border-white/10 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => skipSeconds(-5)}
              className="p-1.5 rounded-lg bg-[#18181e] hover:bg-[#252530] text-[#a29f99] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Rewind 5s"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => skipSeconds(5)}
              className="p-1.5 rounded-lg bg-[#18181e] hover:bg-[#252530] text-[#a29f99] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Skip 5s"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="p-1.5 rounded-lg bg-[#18181e] hover:bg-[#252530] text-[#a29f99] hover:text-white border border-white/10 transition-colors cursor-pointer ml-1"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <span className="font-mono text-[11px] text-[#8a8880] ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={changeSpeed}
              className="px-2 py-1 rounded-md bg-[#18181e] hover:bg-[#252530] border border-white/10 text-[10px] font-mono font-bold text-[#f5ebe1] transition-colors cursor-pointer"
              title="Toggle playback rate"
            >
              {playbackRate}x
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-[#18181e] hover:bg-[#252530] text-[#a29f99] hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
