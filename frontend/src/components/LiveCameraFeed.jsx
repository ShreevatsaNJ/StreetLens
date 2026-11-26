import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Camera, CameraOff, Video, AlertTriangle, ShieldCheck, RefreshCw, Radio, Droplet, Sparkles } from 'lucide-react';

const API_BASE = "http://localhost:5000";

export default function LiveCameraFeed({ onSnapshotReady }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState('');
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

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access in browser settings.' 
          : `Camera error: ${err.message}`
      );
      setIsStreaming(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsStreaming(false);
    setActiveDefects([]);
    setRoadCondition('GOOD');
    setHasWaterlogged(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
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

    const offscreen = document.createElement('canvas');
    offscreen.width = 640;
    offscreen.height = Math.round((640 / video.videoWidth) * video.videoHeight);
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
    const dataUrl = offscreen.toDataURL('image/jpeg', 0.7);

    isProcessingRef.current = true;
    const now = Date.now();

    try {
      const res = await axios.post(`${API_BASE}/api/live_detect_frame`, { image: dataUrl });
      const data = res.data;

      setLatency(data.latency_ms || 0);
      setRoadCondition(data.road_condition || 'GOOD');
      setActiveDefects(data.defects || []);
      
      const waterlogged = (data.defects || []).some(d => d.is_waterlogged);
      setHasWaterlogged(waterlogged);

      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      if (delta > 0) {
        setFps(Math.round(1000 / delta));
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scaleX = canvas.width / offscreen.width;
      const scaleY = canvas.height / offscreen.height;

      (data.defects || []).forEach((d) => {
        const [x1, y1, x2, y2] = d.bbox.map((v, idx) => v * (idx % 2 === 0 ? scaleX : scaleY));
        const w = x2 - x1;
        const h = y2 - y1;

        const isHigh = d.severity === 'HIGH';
        const isMed = d.severity === 'MEDIUM';
        const color = isHigh ? '#f43f5e' : (isMed ? '#f59e0b' : '#f5ebe1');

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(x1, y1, w, h);
        ctx.shadowBlur = 0;

        const cornerLen = Math.min(12, w / 4, h / 4);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + cornerLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cornerLen, y1);
        ctx.moveTo(x2 - cornerLen, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + cornerLen);
        ctx.moveTo(x1, y2 - cornerLen); ctx.lineTo(x1, y2); ctx.lineTo(x1 + cornerLen, y2);
        ctx.moveTo(x2 - cornerLen, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - cornerLen);
        ctx.stroke();

        const label = `#${d.rank || 1} ${d.class} (${Math.round((d.confidence || 0.85) * 100)}%)`;
        ctx.font = 'bold 11px Space Grotesk, sans-serif';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = color;
        ctx.fillRect(x1, Math.max(0, y1 - 20), textWidth + 12, 20);

        ctx.fillStyle = (isHigh || isMed) ? '#ffffff' : '#0c0c0e';
        ctx.fillText(label, x1 + 6, Math.max(14, y1 - 6));
      });

    } catch (err) {
      console.warn("Live detection frame error:", err);
    } finally {
      isProcessingRef.current = false;
      setTimeout(() => {
        if (isStreaming) {
          animationFrameRef.current = requestAnimationFrame(captureAndDetect);
        }
      }, 80);
    }
  }, [isStreaming]);

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
      <div className="p-5 rounded-2xl bg-[#141417] border border-[#f5ebe1]/15 flex flex-wrap items-center justify-between gap-4 shadow-xl">
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
            </h4>
            <p className="text-xs text-zinc-400">
              Mount on patrol vehicle dashboard or smartphone for continuous road defect scanning.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isStreaming ? (
            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-[#f5ebe1] hover:bg-white text-[#0c0c0e] font-display font-bold text-xs shadow-[0_0_20px_rgba(245,235,225,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Feed</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCaptureSnapshot}
                className="px-4 py-2 rounded-xl bg-[#1a1a1e] hover:bg-zinc-800 border border-[#f5ebe1]/20 text-[#f5ebe1] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Freeze frame and run full engineering report"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f5ebe1]" />
                <span>Capture & Audit</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* Live Video Viewport */}
      <div className="relative w-full aspect-video max-h-[520px] rounded-2xl overflow-hidden border border-[#f5ebe1]/15 bg-[#0c0c0e] flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${isStreaming ? 'block' : 'hidden'}`}
        />

        {!isStreaming && (
          <div className="text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#141417] border border-[#f5ebe1]/15 flex items-center justify-center text-zinc-500 mx-auto">
              <Video className="w-8 h-8" />
            </div>
            <h4 className="font-syne font-bold text-white text-base">Dashcam Stream Inactive</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Click "Start Camera Feed" to stream live video through YOLOv8s. Bounding boxes and waterlogged cavity warnings will appear in real time.
            </p>
          </div>
        )}

        {/* Live HUD Telemetry Overlay */}
        {isStreaming && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              <div className="bg-[#0c0c0e]/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#f5ebe1]/15 text-xs flex items-center gap-3">
                <span className="font-mono text-[#f5ebe1] font-bold">{latency} ms</span>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-zinc-300 font-bold">{fps} FPS</span>
                <span className="text-zinc-600">|</span>
                <span className="font-display font-semibold text-white">YOLOv8s</span>
              </div>

              {hasWaterlogged && (
                <div className="bg-rose-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-rose-500/60 text-xs text-rose-200 flex items-center gap-1.5 font-bold animate-pulse font-display">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WATERLOGGED HAZARD DETECTED</span>
                </div>
              )}
            </div>

            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <div className="bg-[#0c0c0e]/85 backdrop-blur-md px-4 py-2 rounded-xl border border-[#f5ebe1]/15 text-xs flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Road Condition:</span>
                <span className={`font-display font-extrabold uppercase ${
                  roadCondition === 'CRITICAL' ? 'text-rose-400 animate-pulse' : (
                    roadCondition === 'FAIR' ? 'text-amber-400' : 'text-[#f5ebe1]'
                  )
                }`}>
                  {roadCondition}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono font-bold text-white">{activeDefects.length} Defect(s)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
