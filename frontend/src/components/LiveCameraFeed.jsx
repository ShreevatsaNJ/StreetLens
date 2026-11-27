import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Camera, CameraOff, Video, AlertTriangle, ShieldCheck, 
  RefreshCw, Radio, Droplet, Sparkles, Sliders, Volume2, 
  VolumeX, Play, RotateCcw, CheckCircle2 
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.hostname 
  ? `http://${window.location.hostname}:5000` 
  : "http://localhost:5000";

export default function LiveCameraFeed({ onSnapshotReady }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [sensitivity, setSensitivity] = useState('high'); // 'high' (0.08), 'normal' (0.12), 'strict' (0.18)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [apiStatus, setApiStatus] = useState('idle'); // 'idle', 'connected', 'error'
  
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [activeDefects, setActiveDefects] = useState([]);
  const [roadCondition, setRoadCondition] = useState('GOOD');
  const [hasWaterlogged, setHasWaterlogged] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(Date.now());
  const lastChimeTimeRef = useRef(0);

  // Sound alert using Web Audio API
  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - lastChimeTimeRef.current < 2000) return; // throttle chime
    lastChimeTimeRef.current = now;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // AudioContext blocked or unsupported
    }
  }, [soundEnabled]);

  const getConfThreshold = () => {
    switch (sensitivity) {
      case 'high': return 0.09;
      case 'strict': return 0.20;
      case 'normal':
      default: return 0.14;
    }
  };

  // Start Real Hardware Camera
  const startCamera = async (overrideFacing = facingMode) => {
    stopStream();
    setCameraError('');
    setIsSimulated(false);

    try {
      const constraints = {
        video: {
          facingMode: { ideal: overrideFacing },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.srcObject = stream;
        videoRef.current.loop = false;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsStreaming(true);
            setApiStatus('connected');
          }).catch(() => {});
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access in browser permissions.' 
          : `Camera error: ${err.message}. You can test using "Simulate Road Feed" below.`
      );
      setIsStreaming(false);
    }
  };

  // Start Simulated Road Feed (for quick desktop testing without physical road setup)
  const startSimulatedFeed = () => {
    stopStream();
    setCameraError('');
    setIsSimulated(true);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = `${API_BASE}/storage/uploads/32cdaca4-5613-43d5-9b5c-de41dcab9ddb_raw.mp4`;
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().then(() => {
          setIsStreaming(true);
          setApiStatus('connected');
        }).catch(() => {});
      };
    }
  };

  // Toggle Camera Facing Mode (Front / Rear)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isStreaming && !isSimulated) {
      startCamera(nextMode);
    }
  };

  // Stop Stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsStreaming(false);
    setIsSimulated(false);
    setActiveDefects([]);
    setRoadCondition('GOOD');
    setHasWaterlogged(false);
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // Frame Inference Loop
  const captureAndDetect = useCallback(async () => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;
    if (isProcessingRef.current) {
      animationFrameRef.current = requestAnimationFrame(captureAndDetect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(captureAndDetect);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');

    // Downscale slightly (512px) for sub-50ms inference latency & minimal payload size
    const targetW = 512;
    const targetH = Math.round((targetW / video.videoWidth) * video.videoHeight);
    const offscreen = document.createElement('canvas');
    offscreen.width = targetW;
    offscreen.height = targetH;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(video, 0, 0, targetW, targetH);
    const dataUrl = offscreen.toDataURL('image/jpeg', 0.65);

    isProcessingRef.current = true;
    const now = Date.now();

    try {
      const res = await axios.post(`${API_BASE}/api/live_detect_frame`, { 
        image: dataUrl,
        conf_threshold: getConfThreshold()
      }, { timeout: 3000 });

      const data = res.data;
      setApiStatus('connected');
      setLatency(data.latency_ms || 0);

      const defects = data.defects || [];
      setActiveDefects(defects);
      
      const condition = defects.length === 0 ? 'GOOD' : (data.road_condition || 'GOOD');
      setRoadCondition(condition);
      
      const waterlogged = defects.some(d => d.is_waterlogged);
      setHasWaterlogged(waterlogged);

      if (condition === 'CRITICAL' || waterlogged) {
        playAlertChime();
      }

      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      if (delta > 0) {
        setFps(Math.round(1000 / delta));
      }

      // Draw Detection Reticles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (defects.length === 0) {
        // Road / Scene is clear - no lingering reticles
        return;
      }

      const scaleX = canvas.width / targetW;
      const scaleY = canvas.height / targetH;

      defects.forEach((d) => {
        const [x1, y1, x2, y2] = d.bbox.map((v, idx) => v * (idx % 2 === 0 ? scaleX : scaleY));
        const w = x2 - x1;
        const h = y2 - y1;

        const isHigh = d.severity === 'HIGH';
        const isMed = d.severity === 'MEDIUM';
        const color = d.is_waterlogged ? '#38bdf8' : (isHigh ? '#f43f5e' : (isMed ? '#f59e0b' : '#10b981'));

        // Outer Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.strokeRect(x1, y1, w, h);
        ctx.shadowBlur = 0;

        // Tactical Corner Marks
        const cornerLen = Math.min(14, w / 3, h / 3);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + cornerLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cornerLen, y1);
        ctx.moveTo(x2 - cornerLen, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + cornerLen);
        ctx.moveTo(x1, y2 - cornerLen); ctx.lineTo(x1, y2); ctx.lineTo(x1 + cornerLen, y2);
        ctx.moveTo(x2 - cornerLen, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - cornerLen);
        ctx.stroke();

        // Label Badge
        const tagText = d.is_waterlogged ? `💧 #${d.rank || 1} ${d.class}` : `#${d.rank || 1} ${d.class}`;
        const confText = `${Math.round((d.confidence || 0.8) * 100)}%`;
        const fullLabel = `${tagText} • ${confText}`;

        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(fullLabel).width;
        
        ctx.fillStyle = color;
        ctx.fillRect(x1, Math.max(0, y1 - 22), textWidth + 14, 22);

        ctx.fillStyle = '#0c0c0e';
        ctx.fillText(fullLabel, x1 + 7, Math.max(15, y1 - 7));
      });

    } catch (err) {
      console.warn("Live detection frame error:", err);
      setApiStatus('error');
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setActiveDefects([]);
      setRoadCondition('GOOD');
      setHasWaterlogged(false);
    } finally {
      isProcessingRef.current = false;
      setTimeout(() => {
        if (isStreaming) {
          animationFrameRef.current = requestAnimationFrame(captureAndDetect);
        }
      }, 60);
    }
  }, [isStreaming, sensitivity, playAlertChime]);

  useEffect(() => {
    if (isStreaming) {
      animationFrameRef.current = requestAnimationFrame(captureAndDetect);
    }
  }, [isStreaming, captureAndDetect]);

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob && onSnapshotReady) {
        const file = new File([blob], `dashcam_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onSnapshotReady(file);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Telemetry & Control Bar */}
      <div className="p-5 rounded-2xl bg-[#141418] border border-[#242429] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f5ebe1]/10 border border-[#f5ebe1]/25 flex items-center justify-center text-[#f5ebe1]">
            <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse text-[#f5ebe1]' : 'text-zinc-500'}`} />
          </div>
          <div>
            <h4 className="font-syne font-bold text-white text-base flex items-center gap-2">
              Real-Time Dashcam Stream
              {isStreaming && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> LIVE
                </span>
              )}
              {isSimulated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[9px] font-mono border border-amber-500/30">
                  DEMO ROAD FEED
                </span>
              )}
            </h4>
            <p className="text-xs text-[#8a8880]">
              Continuous road damage scanning with instant reticle overlays and audio alerts.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sensitivity Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#101014] border border-[#242429] text-[11px]">
            <span className="px-2 text-[#8a8880] flex items-center gap-1 text-[10px] font-mono">
              <Sliders className="w-3 h-3" /> Sensitivity:
            </span>
            <button
              onClick={() => setSensitivity('high')}
              title="Best when pointing at phone screens or in indoor light (0.09 conf)"
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                sensitivity === 'high' ? 'bg-[#f5ebe1] text-[#0c0c0e]' : 'text-[#8a8880] hover:text-white'
              }`}
            >
              High (Phone)
            </button>
            <button
              onClick={() => setSensitivity('normal')}
              title="Standard road camera balance (0.14 conf)"
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                sensitivity === 'normal' ? 'bg-[#f5ebe1] text-[#0c0c0e]' : 'text-[#8a8880] hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSensitivity('strict')}
              title="High precision / clean road filter (0.20 conf)"
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                sensitivity === 'strict' ? 'bg-[#f5ebe1] text-[#0c0c0e]' : 'text-[#8a8880] hover:text-white'
              }`}
            >
              Strict
            </button>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#18181e] text-[#8a8880] border-[#242429]'
            }`}
            title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Warning Chimes on Defects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {!isStreaming ? (
            <>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2.5 rounded-xl bg-[#f5ebe1] hover:bg-white text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_20px_rgba(245,235,225,0.25)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Feed</span>
              </button>
              
              <button
                onClick={startSimulatedFeed}
                className="px-3.5 py-2.5 rounded-xl bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e38] text-[#d6d0c7] font-display font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Test live detection using recorded rough road feed"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Simulate Road Feed</span>
              </button>
            </>
          ) : (
            <>
              {!isSimulated && (
                <button
                  onClick={toggleFacingMode}
                  className="px-3 py-2 rounded-xl bg-[#1c1c22] hover:bg-[#25252e] border border-[#2e2e38] text-[#f4efe6] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Switch between front and rear cameras"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                </button>
              )}

              <button
                onClick={handleCaptureSnapshot}
                className="px-4 py-2 rounded-xl bg-[#1c1c22] hover:bg-[#262630] border border-[#f5ebe1]/25 text-[#f5ebe1] font-syne font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Freeze frame and run full engineering report in Inspection Studio"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f5ebe1]" />
                <span>Capture & Audit</span>
              </button>

              <button
                onClick={stopStream}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-syne font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Stream</span>
              </button>
            </>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {apiStatus === 'error' && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connecting to API at {API_BASE}... Retrying frame inference...</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400">STATUS: RETRYING</span>
        </div>
      )}

      {/* Live Video Viewport */}
      <div className="relative w-full aspect-video max-h-[540px] rounded-2xl overflow-hidden border border-[#242429] bg-[#0c0c0e] flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 ${isStreaming ? 'block' : 'hidden'}`}
        />

        {!isStreaming && (
          <div className="text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#141418] border border-[#242429] flex items-center justify-center text-[#8a8880] mx-auto">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-syne font-bold text-white text-base">Dashcam Stream Inactive</h4>
              <p className="text-xs text-[#8a8880] max-w-md mx-auto mt-1 font-sans">
                Point your laptop camera, webcam, or patrol phone at a road or screen showing road defects.
                Set Sensitivity to <strong>High (Phone)</strong> when testing with photos on smartphone screens.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startCamera(facingMode)}
                className="px-5 py-2.5 rounded-xl bg-[#f5ebe1] hover:bg-white text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_20px_rgba(245,235,225,0.2)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Live Camera</span>
              </button>
              <button
                onClick={startSimulatedFeed}
                className="px-4 py-2.5 rounded-xl bg-[#18181e] hover:bg-[#202028] border border-[#2e2e38] text-[#d6d0c7] font-display font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Simulate Road Feed</span>
              </button>
            </div>
          </div>
        )}

        {/* Live HUD Telemetry Overlay */}
        {isStreaming && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
              <div className="bg-[#0c0c0e]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-xs flex items-center gap-3 shadow-lg">
                <span className="font-mono text-[#f5ebe1] font-bold">{latency} ms</span>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-zinc-300 font-bold">{fps} FPS</span>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-amber-400 text-[10px] font-bold">
                  SENS: {sensitivity.toUpperCase()}
                </span>
                <span className="text-zinc-600">|</span>
                <span className="font-display font-semibold text-white">YOLOv8s</span>
              </div>

              {hasWaterlogged && (
                <div className="bg-cyan-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-cyan-500/60 text-xs text-cyan-200 flex items-center gap-1.5 font-bold animate-pulse font-display shadow-lg">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WATERLOGGED HAZARD DETECTED</span>
                </div>
              )}
            </div>

            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <div className="bg-[#0c0c0e]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs flex items-center gap-2 shadow-lg">
                <span className="text-zinc-400 font-medium">Road Condition:</span>
                <span className={`font-display font-extrabold uppercase ${
                  roadCondition === 'CRITICAL' ? 'text-rose-400 animate-pulse' : (
                    roadCondition === 'POOR' ? 'text-orange-400' : (
                      roadCondition === 'FAIR' ? 'text-amber-400' : 'text-[#f5ebe1]'
                    )
                  )
                }`}>
                  {roadCondition}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono font-bold text-white">
                  {activeDefects.length} {activeDefects.length === 1 ? 'Hazard' : 'Hazards'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
