import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, ScanSearch, MapPin, BarChart3, FileSpreadsheet, 
  Upload, AlertTriangle, ShieldCheck, FileText, Download, 
  Eye, Activity, RefreshCw, BarChart2, Droplet, ArrowRight, 
  CheckCircle, ChevronRight, Sparkles, Cpu, Layers, Radio,
  Compass, ShieldAlert, X, ExternalLink, Camera, Video, Quote,
  Wrench, Clock, TrendingDown, Car, Bike, AlertOctagon, Zap,
  Shield, Info, ArrowUpRight, DollarSign, Construction
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import CompareSlider from './components/CompareSlider';
import LiveCameraFeed from './components/LiveCameraFeed';
import LandingPage from './components/LandingPage';
import DefectOverlays from './components/DefectOverlays';
import VideoAnalysisPlayer from './components/VideoAnalysisPlayer';
import NeuralNetworkBackground from './components/NeuralNetworkBackground';
import ErrorBoundary from './components/ErrorBoundary';

const API_BASE = typeof window !== 'undefined' && window.location.hostname 
  ? `http://${window.location.hostname}:5000` 
  : "http://localhost:5000";

export default function App() {
  // Navigation & View State
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inspector', 'live', 'analytics', 'reports'

  // Interactive Defect Selection & Hover State
  const [hoveredDefectRank, setHoveredDefectRank] = useState(null);
  const [selectedDefectRank, setSelectedDefectRank] = useState(null);
  const [seekToTime, setSeekToTime] = useState(null);

  // Upload & Inspection State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [sensitivity, setSensitivity] = useState(0.015);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeView, setActiveView] = useState('slider'); // 'slider' or 'annotated'

  // Sessions History State
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get(`${API_BASE}/api/sessions`);
      if (res.data?.sessions) {
        setPastSessions(res.data.sessions);
      }
    } catch (err) {
      console.warn("Could not load past sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg('');
    setAnalysisResult(null);
    setHoveredDefectRank(null);
    setSelectedDefectRank(null);

    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSelectSample = async (samplePath, sampleName) => {
    try {
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: blob.type || 'image/jpeg' });
      setSelectedFile(file);
      setErrorMsg('');
      setAnalysisResult(null);
      setHoveredDefectRank(null);
      setSelectedDefectRank(null);
      setMediaType('image');
      setPreviewUrl(samplePath);
    } catch (err) {
      console.error("Failed to load sample:", err);
      setErrorMsg("Failed to load sample image.");
    }
  };

  const handleSnapshotFromLive = (capturedFile) => {
    setSelectedFile(capturedFile);
    setPreviewUrl(URL.createObjectURL(capturedFile));
    setMediaType('image');
    setActiveTab('inspector');
    setErrorMsg('');
    setAnalysisResult(null);
    setHoveredDefectRank(null);
    setSelectedDefectRank(null);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select an image or video file first.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');
      setHoveredDefectRank(null);
      setSelectedDefectRank(null);
      setProcessingStep('Ingesting road media for inspection...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { session_id } = uploadRes.data;

      setProcessingStep('Executing YOLOv8s inference & Bokeh spotlighting...');
      const analyzeRes = await axios.post(`${API_BASE}/api/analyze/${session_id}?conf=${sensitivity}`);

      setAnalysisResult(analyzeRes.data);
      if (analyzeRes.data?.media_type === 'video' || analyzeRes.data?.media_urls?.video) {
        setActiveView('video');
      } else {
        setActiveView('slider');
      }
      setSeekToTime(null);
      fetchSessions(); // refresh history
    } catch (err) {
      console.error("Analysis Pipeline Error:", err);
      setErrorMsg(err.response?.data?.error || err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const getConditionBadge = (condition) => {
    switch (condition?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-syne font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80">CRITICAL</span>;
      case 'POOR':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-syne font-bold bg-orange-950/80 text-orange-300 border border-orange-800/80">POOR</span>;
      case 'FAIR':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-syne font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">FAIR</span>;
      case 'GOOD':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-syne font-bold bg-[#f5ebe1]/15 text-[#f5ebe1] border border-[#f5ebe1]/30">GOOD</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-display font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-display font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-display font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">LOW</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-display font-bold bg-[#1e1e24] text-[#d6d0c7]">{severity}</span>;
    }
  };

  const hasWaterlogged = analysisResult?.ranked_defects?.some(d => d.is_waterlogged);

  // If user is on the Landing Page, render the dedicated standalone landing view
  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4efe6] flex font-sans selection:bg-amber-400/30 selection:text-amber-100 relative overflow-hidden">
      
      {/* Ambient Deep Learning Neural Network Background */}
      <NeuralNetworkBackground opacity={0.55} />

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-56 border-r border-[#242429]/60 bg-[#0c0c0e]/80 backdrop-blur-md flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-40">
        <div>
          {/* Logo & Brand Status (Seamlessly blended, no opaque block or divider line) */}
          <div className="p-4 pb-2 flex items-center justify-between">
            <div 
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Return to StreetLens Landing Page"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fef08a] via-[#fbbf24] to-[#f59e0b] text-[#0c0c0e] flex items-center justify-center font-syne font-extrabold text-sm shadow-[0_0_18px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
                SL
              </div>
              <div>
                <span className="font-syne font-extrabold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fef08a] to-[#f59e0b] block leading-tight drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">StreetLens</span>
                <span className="text-[9px] text-[#fbbf24]/80 font-display font-medium tracking-wider uppercase block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse"></span>
                  AI Vision Active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-2.5 space-y-1">
            <span className="px-2.5 text-[9px] font-display font-bold text-[#8a8880] uppercase tracking-widest block mb-1 mt-1">
              Platform Menu
            </span>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-display font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-200 border border-amber-400/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-[#a29f99] hover:text-[#f4efe6] hover:bg-[#1a1a20]'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-amber-400' : ''}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-display font-medium transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-amber-500/10 text-amber-200 border border-amber-400/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-[#a29f99] hover:text-[#f4efe6] hover:bg-[#1a1a20]'
              }`}
            >
              <ScanSearch className={`w-3.5 h-3.5 ${activeTab === 'inspector' ? 'text-amber-400' : ''}`} />
              <span>Inspection Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-display font-medium transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-amber-500/10 text-amber-200 border border-amber-400/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-[#a29f99] hover:text-[#f4efe6] hover:bg-[#1a1a20]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Live Dashcam Feed</span>
              <span className="ml-auto flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-display font-medium transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/10 text-amber-200 border border-amber-400/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-[#a29f99] hover:text-[#f4efe6] hover:bg-[#1a1a20]'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'analytics' ? 'text-amber-400' : ''}`} />
              <span>Analytics & Risk</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-display font-medium transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-500/10 text-amber-200 border border-amber-400/30 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                  : 'text-[#a29f99] hover:text-[#f4efe6] hover:bg-[#1a1a20]'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'reports' ? 'text-amber-400' : ''}`} />
              <span>Audit Reports</span>
            </button>
          </div>
        </div>

        {/* Status Tag (no personal name) */}
        <div className="p-3 border-t border-[#242429]">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#141418] border border-[#242429] text-[10px] text-[#8a8880] font-mono">
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Online
            </span>
            <span>v1.0.4</span>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        
        {/* Top Header (Seamlessly blended, zero opaque box separation) */}
        <header className="h-13 bg-transparent px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-7 h-7 rounded-lg bg-gradient-to-br from-[#fef08a] via-[#fbbf24] to-[#f59e0b] text-[#0c0c0e] flex items-center justify-center font-syne font-extrabold text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              SL
            </div>
            <div>
              <h2 className="text-xs font-syne font-bold text-[#f4efe6] capitalize">
                {activeTab === 'dashboard' && 'Executive Road Safety Dashboard'}
                {activeTab === 'inspector' && 'Visual Inspection Studio'}
                {activeTab === 'live' && 'Real-Time Dashcam & Road Inspection Stream'}
                {activeTab === 'analytics' && 'Safety Risk & Defect Analytics'}
                {activeTab === 'reports' && 'Inspection Audit Ledger & Downloads'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141418] border border-[#242429] text-[#a29f99]">
              <Cpu className="w-3 h-3 text-amber-300" />
              <span className="font-mono text-[10px]">YOLOv8s CPU</span>
            </div>

            <button
              onClick={() => { setActiveTab('inspector'); setSelectedFile(null); setAnalysisResult(null); }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] font-syne font-bold text-[11px] shadow-[0_0_12px_rgba(217,119,6,0.25)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>+ New Inspection</span>
            </button>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="p-4 sm:p-5 max-w-6xl w-full mx-auto space-y-4">

          {/* ================= TAB 1: EXECUTIVE DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Hero Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#141418] via-[#121216] to-[#141418] border border-amber-400/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-display font-semibold mb-1.5 border border-amber-400/30">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-amber-400" /> Computer Vision Telemetry Active
                  </div>
                  <h3 className="text-base font-syne font-extrabold text-[#f4efe6]">Urban Infrastructure Safety Monitor</h3>
                  <p className="text-[11px] text-[#a29f99] mt-0.5 max-w-xl font-sans">
                    Automated defect detection, optical Bokeh spotlighting, and multi-vehicle vulnerability rating across monitored corridors.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_12px_rgba(217,119,6,0.25)] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Launch Inspection Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-950" />
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429]">
                  <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Total Monitored Scans</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-syne font-extrabold text-[#f4efe6]">{pastSessions.length}</span>
                    <span className="text-[10px] text-[#f5ebe1] font-medium">Logged in DB</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429]">
                  <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Detection Pipeline</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-syne font-extrabold text-[#f4efe6]">YOLOv8s</span>
                    <span className="text-[10px] text-[#8a8880] font-mono">640px</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429]">
                  <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Active Road Condition</span>
                  <div>{getConditionBadge(analysisResult?.summary?.road_condition || 'GOOD')}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429]">
                  <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Repair Priority Index</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-syne font-extrabold text-amber-400">
                      {analysisResult?.summary?.repair_priority || 1}
                    </span>
                    <span className="text-[10px] text-[#8a8880] font-sans">/ 5 (Scale)</span>
                  </div>
                </div>
              </div>

              {/* Corridor Hazard Density Map & Quick Samples */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-4 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-syne font-bold text-[#f4efe6] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#f5ebe1]" /> Recent Monitored Scans
                    </h4>
                    <button 
                      onClick={() => setActiveTab('reports')}
                      className="text-[11px] text-[#f5ebe1] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      View All in Audit Ledger <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#242429] text-[#8a8880] text-[10px] font-mono uppercase">
                          <th className="py-2 px-2.5">Corridor / Scan</th>
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Condition</th>
                          <th className="py-2 px-2.5">Defects</th>
                          <th className="py-2 px-2.5 text-right">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#242429]">
                        {pastSessions.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-[#8a8880] font-sans text-xs">
                              No recent scans found. Upload a video or run live camera to begin!
                            </td>
                          </tr>
                        ) : (
                          pastSessions.slice(0, 4).map((s) => (
                            <tr key={s.session_id} className="hover:bg-[#1a1a22] transition-colors">
                              <td className="py-2 px-2.5 font-medium text-[#f4efe6] truncate max-w-[150px]">
                                {s.filename || s.original_filename}
                              </td>
                              <td className="py-2 px-2.5 font-mono text-[10px] text-[#8a8880]">
                                {s.created_at || 'Recent'}
                              </td>
                              <td className="py-2 px-2.5">{getConditionBadge(s.road_condition)}</td>
                              <td className="py-2 px-2.5 font-syne font-bold text-[#f4efe6]">{s.total_defects}</td>
                              <td className="py-2 px-2.5 text-right font-syne font-bold text-amber-400">P{s.repair_priority}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-syne font-bold text-[#f4efe6] mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#f5ebe1]" /> Quick-Test Samples
                    </h4>
                    <p className="text-[11px] text-[#a29f99] mb-3">
                      Test the pipeline with 1 click using preloaded road condition captures.
                    </p>
                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          setActiveTab('inspector');
                          handleSelectSample('/samples/sample1_waterlogged.jpg', 'sample_waterlogged_pothole.jpg');
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-[#1a1a20] hover:bg-[#22222a] border border-[#2e2e38] hover:border-[#f5ebe1]/40 text-left transition-all group cursor-pointer"
                      >
                        <img src="/samples/sample1_waterlogged.jpg" alt="sample 1" className="w-11 h-9 object-cover rounded-md border border-[#3a3a46]" />
                        <div>
                          <span className="text-xs font-display font-semibold text-[#f4efe6] block group-hover:text-[#f5ebe1]">Sample 1: Waterlogged Pothole</span>
                          <span className="text-[9px] text-[#8a8880]">Cavity with standing water</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('inspector');
                          handleSelectSample('/samples/sample2_cracks.png', 'sample_road_cracks.png');
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-[#1a1a20] hover:bg-[#22222a] border border-[#2e2e38] hover:border-[#f5ebe1]/40 text-left transition-all group cursor-pointer"
                      >
                        <img src="/samples/sample2_cracks.png" alt="sample 2" className="w-11 h-9 object-cover rounded-md border border-[#3a3a46]" />
                        <div>
                          <span className="text-xs font-display font-semibold text-[#f4efe6] block group-hover:text-[#f5ebe1]">Sample 2: Surface Cracks</span>
                          <span className="text-[9px] text-[#8a8880]">Longitudinal & structural wear</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#242429] text-[10px] font-mono text-[#8a8880]">
                    Model: YOLOv8s • RDD2020 Dataset
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: INSPECTION STUDIO ================= */}
          {activeTab === 'inspector' && (
            <div className="space-y-6">
              
              {/* Inspection Mode Switcher */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-[#141418] border border-[#242429] text-xs">
                  <button
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 font-display font-bold border border-amber-400/30"
                  >
                    📁 File & Video Ingestion
                  </button>
                  <button
                    onClick={() => setActiveTab('live')}
                    className="px-3.5 py-1.5 rounded-lg text-[#a29f99] hover:text-[#f4efe6] font-display font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Live Dashcam Stream</span>
                  </button>
                </div>

                <span className="text-xs text-[#8a8880] hidden sm:inline font-mono">
                  Autonomous CV Pipeline
                </span>
              </div>

              {/* Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  selectedFile ? 'bg-amber-500/10 border-amber-400/40 text-amber-200' : 'bg-[#141418] border-[#242429] text-[#8a8880]'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-syne font-bold text-[10px] ${
                    selectedFile ? 'bg-amber-400 text-[#0c0c0e]' : 'bg-[#202026] text-[#f4efe6]'
                  }`}>1</span>
                  <span className="font-display font-semibold">Media Ingestion</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  isProcessing ? 'bg-amber-500/10 border-amber-400/40 text-amber-200 animate-pulse' : 'bg-[#141418] border-[#242429] text-[#8a8880]'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-syne font-bold text-[10px] ${
                    isProcessing ? 'bg-amber-400 text-[#0c0c0e]' : 'bg-[#202026] text-[#f4efe6]'
                  }`}>2</span>
                  <span className="font-display font-semibold">CV & Enhancement</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  analysisResult ? 'bg-amber-500/10 border-amber-400/40 text-amber-200' : 'bg-[#141418] border-[#242429] text-[#8a8880]'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-syne font-bold text-[10px] ${
                    analysisResult ? 'bg-amber-400 text-[#0c0c0e]' : 'bg-[#202026] text-[#f4efe6]'
                  }`}>3</span>
                  <span className="font-display font-semibold">Bokeh Spotlight</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  analysisResult ? 'bg-amber-500/10 border-amber-400/40 text-amber-200' : 'bg-[#141418] border-[#242429] text-[#8a8880]'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-syne font-bold text-[10px] ${
                    analysisResult ? 'bg-amber-400 text-[#0c0c0e]' : 'bg-[#202026] text-[#f4efe6]'
                  }`}>4</span>
                  <span className="font-display font-semibold">Report Generated</span>
                </div>
              </div>

              {/* Upload Dropzone & Action Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#141418] border border-[#242429] shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-syne font-bold uppercase tracking-wider text-[#a29f99]">
                      Step 1: Upload Road Surface Capture
                    </span>
                    <span className="text-[10px] font-mono text-[#8a8880]">JPG, PNG, MP4, AVI (Up to 200MB)</span>
                  </div>

                  <label className="border-2 border-dashed border-[#2e2e38] hover:border-[#f5ebe1]/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#101014] hover:bg-[#16161c] group">
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                    <div className="w-12 h-12 rounded-xl bg-[#1c1c22] group-hover:bg-[#f5ebe1]/20 flex items-center justify-center text-[#8a8880] group-hover:text-[#f5ebe1] transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-syne font-bold text-[#f4efe6]">
                      {selectedFile ? selectedFile.name : "Click or drag & drop road photos / dashcam videos"}
                    </span>
                    <span className="text-[11px] text-[#8a8880] mt-1 font-sans">
                      Automatic EXIF GPS extraction + manual location override
                    </span>
                  </label>

                  {/* One-Click Demo Samples */}
                  <div className="pt-2">
                    <span className="text-xs text-[#a29f99] font-medium block mb-2 font-display">
                      ⚡ Or test with one-click demo samples:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectSample('/samples/sample1_waterlogged.jpg', 'sample_waterlogged_pothole.jpg')}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18181e] hover:bg-[#202028] border border-[#2a2a34] hover:border-[#f5ebe1]/40 text-left transition-all group cursor-pointer"
                      >
                        <img 
                          src="/samples/sample1_waterlogged.jpg" 
                          alt="Waterlogged pothole" 
                          className="w-14 h-11 object-cover rounded-lg border border-[#343440] group-hover:border-[#f5ebe1]/60" 
                        />
                        <div>
                          <span className="text-xs font-display font-semibold text-[#f4efe6] block group-hover:text-[#f5ebe1]">
                            Demo 1: Waterlogged Pothole
                          </span>
                          <span className="text-[10px] text-[#8a8880] block">Severe cavity & puddle risk</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSample('/samples/sample2_cracks.png', 'sample_road_cracks.png')}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18181e] hover:bg-[#202028] border border-[#2a2a34] hover:border-[#f5ebe1]/40 text-left transition-all group cursor-pointer"
                      >
                        <img 
                          src="/samples/sample2_cracks.png" 
                          alt="Road surface cracks" 
                          className="w-14 h-11 object-cover rounded-lg border border-[#343440] group-hover:border-[#f5ebe1]/60" 
                        />
                        <div>
                          <span className="text-xs font-display font-semibold text-[#f4efe6] block group-hover:text-[#f5ebe1]">
                            Demo 2: Road Surface Cracks
                          </span>
                          <span className="text-[10px] text-[#8a8880] block">Longitudinal & structural cracks</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Box & Inspect Button */}
                <div className="p-6 rounded-2xl bg-[#141418] border border-[#242429] shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-syne font-bold uppercase tracking-wider text-[#a29f99] block mb-3">
                      Input Media Preview
                    </span>
                    {previewUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#2a2a34] aspect-video bg-black flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <video src={previewUrl} controls className="max-h-full max-w-full" />
                        ) : (
                          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-[#2a2a34] bg-[#101014] flex items-center justify-center text-xs text-[#8a8880]">
                        No media selected yet
                      </div>
                    )}
                    {/* Model Sensitivity Selector */}
                    <div className="mt-4 pt-3 border-t border-[#242429]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-syne font-bold text-[#f4efe6] flex items-center gap-1.5">
                          <Cpu className="w-3 h-3 text-[#f5ebe1]" /> Model Sensitivity
                        </span>
                        <span className="text-[10px] font-mono text-[#f5ebe1] font-bold">
                          {sensitivity === 0.015 ? 'High (Detect All Hazards)' : sensitivity === 0.03 ? 'Balanced' : 'Strict (Major Hazards Only)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#101014] border border-[#242429]">
                        <button
                          type="button"
                          onClick={() => setSensitivity(0.015)}
                          className={`py-1 text-[10px] font-syne font-semibold rounded transition-all cursor-pointer ${
                            sensitivity === 0.015 ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] font-bold shadow-sm' : 'text-[#8a8880] hover:text-[#f4efe6]'
                          }`}
                        >
                          High
                        </button>
                        <button
                          type="button"
                          onClick={() => setSensitivity(0.03)}
                          className={`py-1 text-[10px] font-syne font-semibold rounded transition-all cursor-pointer ${
                            sensitivity === 0.03 ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] font-bold shadow-sm' : 'text-[#8a8880] hover:text-[#f4efe6]'
                          }`}
                        >
                          Balanced
                        </button>
                        <button
                          type="button"
                          onClick={() => setSensitivity(0.05)}
                          className={`py-1 text-[10px] font-syne font-semibold rounded transition-all cursor-pointer ${
                            sensitivity === 0.05 ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] font-bold shadow-sm' : 'text-[#8a8880] hover:text-[#f4efe6]'
                          }`}
                        >
                          Strict
                        </button>
                      </div>
                      <span className="text-[9px] text-[#8a8880] mt-1 block">
                        High detects all subtle cracks & cavities; Strict focuses on major deep potholes.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadAndAnalyze}
                    disabled={!selectedFile || isProcessing}
                    className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 disabled:from-[#1c1c22] disabled:to-[#1c1c22] disabled:text-[#6a6860] font-syne font-bold text-[#0c0c0e] text-sm shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0c0c0e]" />
                        <span>Processing AI Inspection...</span>
                      </>
                    ) : (
                      <>
                        <span>Inspect Road Surface</span>
                        <ArrowRight className="w-4 h-4 text-amber-950" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status & Alerts */}
              {isProcessing && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-3 text-xs font-semibold text-amber-200 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{processingStep}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Inspection Results Dashboard */}
              {analysisResult && (
                <ErrorBoundary onReset={() => setAnalysisResult(null)}>
                  <div className="space-y-6 pt-2">
                    
                    {/* Waterlogged Alert Banner */}
                    {hasWaterlogged && (
                      <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/70 flex items-center gap-3 text-rose-200">
                        <Droplet className="w-6 h-6 text-cyan-400 shrink-0 animate-bounce" />
                        <div>
                          <h4 className="font-syne font-bold text-sm text-rose-100">Caution: Waterlogged Anomaly Detected</h4>
                          <p className="text-xs text-rose-300">
                            Standing water conceals cavity depth. High hydroplaning and loss-of-control risk for two-wheelers.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                        <span className="text-xs text-[#8a8880] font-medium block mb-1">Road Condition</span>
                        <div>{getConditionBadge(analysisResult.summary?.road_condition || 'GOOD')}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                        <span className="text-xs text-[#8a8880] font-medium block mb-1">Total Hazards Found</span>
                        <span className="text-3xl font-syne font-extrabold text-[#f4efe6]">{analysisResult.summary?.total_defects ?? 0}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                        <span className="text-xs text-[#8a8880] font-medium block mb-1">Damage Surface Density</span>
                        <span className="text-3xl font-syne font-extrabold text-[#f4efe6]">{analysisResult.summary?.damage_density_pct ?? 0}%</span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                        <span className="text-xs text-[#8a8880] font-medium block mb-1">Repair Priority Index</span>
                        <span className="text-3xl font-syne font-extrabold text-amber-400">
                          Priority {analysisResult.summary?.repair_priority ?? 1} <span className="text-xs text-[#8a8880] font-sans font-normal">/ 5</span>
                        </span>
                      </div>
                    </div>

                    {/* Visual Evidence (Bokeh Spotlight & Slider) */}
                    <div className="p-6 rounded-2xl bg-[#141418] border border-[#242429] shadow-2xl">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#242429] mb-6 gap-3">
                        <div>
                          <h3 className="text-base font-syne font-bold text-[#f4efe6] flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#f5ebe1]" />
                            Visual Inspection Evidence (Bokeh Spotlight Focus)
                          </h3>
                          <p className="text-xs text-[#a29f99] font-sans">
                            Healthy road asphalt is softly blurred while anomalies remain tack-sharp with glow badges.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {analysisResult.media_urls?.video && (
                            <button
                              onClick={() => setActiveView('video')}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeView === 'video' ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] shadow-sm' : 'bg-[#1e1e24] text-[#d6d0c7]'
                              }`}
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Real-Time AI Video</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActiveView('slider')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                              activeView === 'slider' ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] shadow-sm' : 'bg-[#1e1e24] text-[#d6d0c7]'
                            }`}
                          >
                            {analysisResult.media_urls?.video ? 'Keyframe Slider' : 'Before / After Slider'}
                          </button>
                          <button
                            onClick={() => setActiveView('annotated')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                              activeView === 'annotated' ? 'bg-gradient-to-r from-[#fde68a] to-[#d97706] text-[#0c0c0e] shadow-sm' : 'bg-[#1e1e24] text-[#d6d0c7]'
                            }`}
                          >
                            {analysisResult.media_urls?.video ? 'Spotlight Keyframe' : 'Full Spotlight View'}
                          </button>
                        </div>
                      </div>

                      {activeView === 'video' && analysisResult.media_urls?.video ? (
                        <VideoAnalysisPlayer
                          videoSrc={`${API_BASE}${analysisResult.media_urls.video}`}
                          frameDetections={analysisResult.frame_detections || []}
                          imageDimensions={analysisResult.image_dimensions || [960, 540]}
                          hoveredRank={hoveredDefectRank}
                          selectedRank={selectedDefectRank}
                          onHoverDefect={setHoveredDefectRank}
                          onSelectDefect={(rank) => setSelectedDefectRank(prev => prev === rank ? null : rank)}
                          seekToTime={seekToTime}
                        />
                      ) : activeView === 'slider' && analysisResult.media_urls?.raw ? (
                        <CompareSlider 
                          originalSrc={`${API_BASE}${analysisResult.media_urls.raw}`}
                          annotatedSrc={`${API_BASE}${analysisResult.media_urls.annotated}`}
                          aspectRatio={`${analysisResult.image_dimensions?.[0] || 612} / ${analysisResult.image_dimensions?.[1] || 408}`}
                        >
                          <DefectOverlays 
                            defects={analysisResult.ranked_defects || []}
                            imgDims={analysisResult.image_dimensions || [612, 408]}
                            hoveredRank={hoveredDefectRank}
                            selectedRank={selectedDefectRank}
                            onHover={setHoveredDefectRank}
                            onSelect={(rank) => setSelectedDefectRank(prev => prev === rank ? null : rank)}
                          />
                        </CompareSlider>
                      ) : (
                        <div 
                          className="relative w-full rounded-xl overflow-hidden border border-[#242429] bg-black flex items-center justify-center shadow-2xl"
                          style={{ aspectRatio: `${analysisResult.image_dimensions?.[0] || 612} / ${analysisResult.image_dimensions?.[1] || 408}` }}
                        >
                          {analysisResult.media_urls?.annotated && (
                            <img 
                              src={`${API_BASE}${analysisResult.media_urls.annotated}`} 
                              alt="Bokeh Spotlight View" 
                              className="w-full h-full object-cover"
                            />
                          )}
                          <DefectOverlays 
                            defects={analysisResult.ranked_defects || []}
                            imgDims={analysisResult.image_dimensions || [612, 408]}
                            hoveredRank={hoveredDefectRank}
                            selectedRank={selectedDefectRank}
                            onHover={setHoveredDefectRank}
                            onSelect={(rank) => setSelectedDefectRank(prev => prev === rank ? null : rank)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Ranked Defects Ledger */}
                    <div className="p-6 rounded-2xl bg-[#141418] border border-[#242429] shadow-xl">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-syne font-bold text-[#f4efe6]">
                            Ranked Hazards Ledger ({analysisResult.ranked_defects?.length || 0} detected)
                          </h3>
                          {selectedDefectRank !== null && (
                            <button 
                              onClick={() => setSelectedDefectRank(null)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#f5ebe1]/20 text-[#f5ebe1] border border-[#f5ebe1]/40 hover:bg-[#f5ebe1]/30 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>Pinned #{selectedDefectRank}</span>
                              <span className="text-xs">✕ Clear</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#8a8880] hidden sm:inline">
                            {analysisResult.media_urls?.video ? 'Click any defect row to seek video to that timestamp' : 'Hover or click row/box to highlight'}
                          </span>
                          <button 
                            onClick={() => setActiveTab('reports')}
                            className="text-xs text-[#f5ebe1] hover:underline font-semibold cursor-pointer"
                          >
                            View Full Ledger & PDF →
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] text-[#d6d0c7]">
                          <thead className="bg-[#101014] text-[#8a8880] uppercase text-[9px] font-display tracking-wider border-b border-[#242429]">
                            <tr>
                              <th className="py-2.5 px-3">Rank</th>
                              {analysisResult.media_urls?.video && <th className="py-2.5 px-3">Timestamp</th>}
                              <th className="py-2.5 px-3">Anomaly Class</th>
                              <th className="py-2.5 px-3">Severity</th>
                              <th className="py-2.5 px-3">Confidence</th>
                              <th className="py-2.5 px-3">Dimensions (px)</th>
                              <th className="py-2.5 px-3">Waterlogged</th>
                              <th className="py-2.5 px-3">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#242429]">
                            {(analysisResult.ranked_defects || []).map((d) => {
                              const isHovered = hoveredDefectRank === d.rank;
                              const isSelected = selectedDefectRank === d.rank;
                              const isActive = isSelected || isHovered;
                              const isDimmed = (selectedDefectRank !== null || hoveredDefectRank !== null) && !isActive;

                              return (
                                <tr 
                                  key={d.rank} 
                                  className={`transition-all duration-150 cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[#f5ebe1]/15 border-l-4 border-l-[#f5ebe1] shadow-inner' 
                                      : isHovered 
                                      ? 'bg-[#20202a] border-l-4 border-l-amber-400' 
                                      : isDimmed 
                                      ? 'opacity-35 hover:opacity-100 hover:bg-[#1a1a22]' 
                                      : 'hover:bg-[#1a1a22]'
                                  }`}
                                  onMouseEnter={() => setHoveredDefectRank(d.rank)}
                                  onMouseLeave={() => setHoveredDefectRank(null)}
                                  onClick={() => {
                                    setSelectedDefectRank(prev => prev === d.rank ? null : d.rank);
                                    if (d.video_timestamp !== undefined && d.video_timestamp !== null) {
                                      setSeekToTime(d.video_timestamp);
                                      if (activeView !== 'video') setActiveView('video');
                                    }
                                  }}
                                >
                                  <td className="py-2.5 px-3 font-syne font-bold">
                                    <span className={isActive ? 'text-[#f5ebe1] font-extrabold drop-shadow-[0_0_8px_rgba(245,235,225,0.7)]' : 'text-[#f4efe6]'}>
                                      #{d.rank}
                                    </span>
                                    {isSelected && (
                                      <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold bg-amber-400 text-[#0c0c0e]">
                                        PINNED
                                      </span>
                                    )}
                                  </td>
                                  {analysisResult.media_urls?.video && (
                                    <td className="py-2.5 px-3">
                                      <span className="inline-flex items-center gap-1 font-mono text-[9px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold hover:bg-amber-500/20 transition-colors">
                                        ⏱ {d.timestamp_str || `00:${String(Math.floor(d.video_timestamp || 0)).padStart(2, '0')}`}
                                        {d.track_duration && d.track_duration !== d.timestamp_str && (
                                          <span className="text-[#8a8880] text-[8px] ml-1">({d.track_duration})</span>
                                        )}
                                      </span>
                                    </td>
                                  )}
                                  <td className="py-2.5 px-3 font-semibold text-[#f4efe6]">
                                    {d.class}
                                  </td>
                                  <td className="py-2.5 px-3">{getSeverityBadge(d.severity)}</td>
                                  <td className="py-2.5 px-3 font-mono">{Math.round((d.confidence || 0) * 100)}%</td>
                                  <td className="py-2.5 px-3 font-mono text-[#8a8880] text-[10px]">
                                    {d.dimensions_px ? `${d.dimensions_px[0]} × ${d.dimensions_px[1]}` : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {d.is_waterlogged ? (
                                      <span className="text-cyan-400 font-semibold flex items-center gap-1 text-[10px]">
                                        <Droplet className="w-2.5 h-2.5" /> Yes
                                      </span>
                                    ) : (
                                      <span className="text-[#8a8880] font-mono text-[10px]">Dry</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[#f5ebe1] font-semibold">{d.severity_score}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Download PDF & CSV Action Bar */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#141418] to-[#18181f] border border-[#242429] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-syne font-bold text-[#f4efe6] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#f5ebe1]" />
                          Download Official Engineering Review
                        </h4>
                        <p className="text-[11px] text-[#a29f99]">
                          PDF includes plain border canvas, embedded anomaly photo, and ranked defect ledger.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <a
                          href={`${API_BASE}/api/report/csv/${analysisResult.session_id}`}
                          className="px-3 py-1.5 rounded-lg border border-[#343440] hover:bg-[#202028] text-[11px] font-semibold text-[#f4efe6] flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3 text-[#8a8880]" />
                          <span>CSV Data</span>
                        </a>
                        <a
                          href={`${API_BASE}/api/report/pdf/${analysisResult.session_id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] text-[11px] font-syne font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(217,119,6,0.25)] transition-all"
                        >
                          <Download className="w-3 h-3 text-amber-950" />
                          <span>Download PDF Report</span>
                        </a>
                      </div>
                    </div>

                  </div>
                </ErrorBoundary>
              )}
            </div>
          )}

          {/* ================= TAB 3: LIVE DASHCAM STREAM ================= */}
          {activeTab === 'live' && (
            <LiveCameraFeed onSnapshotReady={handleSnapshotFromLive} />
          )}



          {/* ================= TAB 5: ANALYTICS & RISK ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242429]">
                <div>
                  <h3 className="text-base font-syne font-bold text-[#f4efe6] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#f5ebe1]" />
                    <span>Road Safety & Anomaly Analytics</span>
                  </h3>
                  <p className="text-xs text-[#a29f99] font-sans">
                    Data-driven analysis of road health, defect distribution, commuter risk factors, and recommended maintenance.
                  </p>
                </div>
                {analysisResult && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#f5ebe1]/10 text-[#f5ebe1] border border-[#f5ebe1]/30 self-start sm:self-auto">
                    Session: {analysisResult.session_id ? analysisResult.session_id.slice(0, 8) : 'Active'} • {analysisResult.media_type ? analysisResult.media_type.toUpperCase() : 'IMAGE'}
                  </span>
                )}
              </div>

              {analysisResult && analysisResult.chart_data ? (() => {
                const s = analysisResult.summary || {};
                const totalDefects = s.total_defects ?? (analysisResult.ranked_defects?.length || 0);
                const damageDensity = s.damage_density_pct ?? 0;
                const roadCondition = s.road_condition || 'FAIR';
                const repairPriority = s.repair_priority ?? 2;
                
                const potholeCount = s.pothole_count ?? (analysisResult.ranked_defects?.filter(d => d.class?.toLowerCase().includes('pothole')).length || 0);
                const crackCount = s.crack_count ?? (totalDefects - potholeCount);
                const hasWaterlogged = s.has_waterlogged ?? analysisResult.ranked_defects?.some(d => d.is_waterlogged);

                // Road Health (0-100%) - Sensible, easily explainable score
                const roadHealth = s.road_health || {
                  score: Math.max(5, Math.round(100 - (damageDensity * 0.8 + ((s.severity_breakdown?.high || 0) * 12) + ((s.severity_breakdown?.medium || 0) * 6)))),
                  status: roadCondition === 'CRITICAL' ? 'Critical' : (roadCondition === 'POOR' ? 'Poor' : (roadCondition === 'FAIR' ? 'Fair' : 'Good')),
                  color: roadCondition === 'CRITICAL' ? '#ef4444' : (roadCondition === 'POOR' ? '#f97316' : (roadCondition === 'FAIR' ? '#f59e0b' : '#10b981'))
                };

                const summaryInsight = s.summary_insight || 
                  `Detected ${totalDefects} road anomalies (${potholeCount} pothole${potholeCount !== 1 ? 's' : ''}, ${crackCount} crack${crackCount !== 1 ? 's' : ''}) covering ${damageDensity}% of the road surface. Overall road health is rated at ${roadHealth.score}% (${roadHealth.status}). Repair priority is Level ${repairPriority}/5.`;

                const commuterAnalysis = s.commuter_analysis || [
                  {
                    category: "Two-Wheelers (Bikes & Scooters)",
                    risk_score: s.user_risks?.two_wheeler ?? 90,
                    risk_level: (s.user_risks?.two_wheeler ?? 90) >= 65 ? "High Risk" : ((s.user_risks?.two_wheeler ?? 90) >= 35 ? "Medium Risk" : "Low Risk"),
                    color: "#ef4444",
                    reason: "Narrow tires get trapped in potholes and longitudinal cracks, causing sudden balance loss or tipping." + (hasWaterlogged ? " Waterlogged potholes conceal depth." : ""),
                    safety_tip: "Reduce speed below 25 km/h and avoid riding through puddles."
                  },
                  {
                    category: "Four-Wheelers (Cars & Autos)",
                    risk_score: s.user_risks?.four_wheeler ?? 80,
                    risk_level: (s.user_risks?.four_wheeler ?? 80) >= 65 ? "High Risk" : ((s.user_risks?.four_wheeler ?? 80) >= 35 ? "Medium Risk" : "Low Risk"),
                    color: "#f59e0b",
                    reason: "Direct wheel impacts cause tire punctures, sidewall bulges, rim bending, and alignment drift.",
                    safety_tip: "Brake before the anomaly; avoid sudden swerving into neighboring lanes."
                  },
                  {
                    category: "Pedestrians & Cyclists",
                    risk_score: s.user_risks?.pedestrian ?? 70,
                    risk_level: (s.user_risks?.pedestrian ?? 70) >= 65 ? "High Risk" : ((s.user_risks?.pedestrian ?? 70) >= 35 ? "Medium Risk" : "Low Risk"),
                    color: "#38bdf8",
                    reason: "Uneven asphalt edges create tripping hazards, and bicycle wheels can get stuck in cracks.",
                    safety_tip: "Watch footsteps along road edges and maintain distance from fast traffic."
                  }
                ];

                const recommendations = s.recommendations || [
                  ...(potholeCount > 0 ? [`Pothole Patching: Fill ${potholeCount} detected pothole(s) to eliminate tire damage and fall hazards.`] : []),
                  ...(crackCount > 0 ? [`Crack Sealing: Seal ${crackCount} surface crack(s) before rain water enters and widens them into potholes.`] : []),
                  ...(hasWaterlogged ? ["Drainage Clearance: Clear road shoulders so standing water does not conceal pothole cavities."] : ["Routine Monitoring: Continue regular road surveillance."])
                ];

                return (
                  <ErrorBoundary>
                    <div className="space-y-6">

                      {/* 1. AI Summary Card */}
                      <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] shadow-lg flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#f5ebe1]/10 text-[#f5ebe1] shrink-0 mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-syne font-bold text-xs text-[#f4efe6]">Inspection Summary & Findings</h4>
                          <p className="text-xs text-[#d6d0c7] leading-relaxed font-sans">{summaryInsight}</p>
                          {hasWaterlogged && (
                            <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 pt-1">
                              <Droplet className="w-3.5 h-3.5 shrink-0" />
                              <span>Waterlogging Alert: Standing water is concealing pothole depth — extreme hazard for two-wheelers.</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 2. Key Metrics Row (4 Cards) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        
                        {/* Road Health Score */}
                        <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                          <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Road Health Score</span>
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="text-3xl font-syne font-extrabold" style={{ color: roadHealth.color }}>
                              {roadHealth.score}%
                            </span>
                            <span 
                              className="px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase"
                              style={{ backgroundColor: `${roadHealth.color}20`, color: roadHealth.color }}
                            >
                              {roadHealth.status}
                            </span>
                          </div>
                          <div className="w-full bg-[#101014] rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${roadHealth.score}%`, backgroundColor: roadHealth.color }} />
                          </div>
                        </div>

                        {/* Total Defects */}
                        <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                          <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Defects Found</span>
                          <span className="text-3xl font-syne font-extrabold text-[#f4efe6] block mb-1">
                            {totalDefects}
                          </span>
                          <span className="text-[10px] text-[#a29f99] font-mono">
                            {potholeCount} Pothole{potholeCount !== 1 ? 's' : ''} • {crackCount} Crack{crackCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Damage Surface Density */}
                        <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                          <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Surface Damage Coverage</span>
                          <span className="text-3xl font-syne font-extrabold text-[#f4efe6] block mb-1">
                            {damageDensity}%
                          </span>
                          <span className="text-[10px] text-[#a29f99] font-sans">
                            of surveyed road area
                          </span>
                        </div>

                        {/* Repair Priority Index */}
                        <div className="p-4 rounded-xl bg-[#141418] border border-[#242429]">
                          <span className="text-[11px] text-[#8a8880] font-medium block mb-1">Repair Priority</span>
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-syne font-extrabold text-amber-400">
                              Level {repairPriority}
                            </span>
                            <span className="text-xs text-[#8a8880] font-mono">/ 5</span>
                          </div>
                          <span className={`text-[10px] font-bold font-sans ${repairPriority >= 4 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {repairPriority >= 4 ? 'Immediate Repair Required' : 'Moderate Priority'}
                          </span>
                        </div>

                      </div>

                      {/* 3. Visual Charts (Defect Categories & Severity) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Defect Categories Bar Chart */}
                        <div className="p-5 rounded-2xl bg-[#141418] border border-[#242429] flex flex-col justify-between shadow-xl">
                          <div>
                            <h4 className="text-xs font-syne font-bold text-[#f4efe6] mb-1 flex items-center gap-2">
                              <BarChart2 className="w-4 h-4 text-[#f5ebe1]" /> Defect Classification Count
                            </h4>
                            <p className="text-[11px] text-[#8a8880] mb-3">Count of detected potholes and crack patterns</p>
                          </div>
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analysisResult.chart_data.category_distribution}>
                                <XAxis dataKey="name" stroke="#8a8880" fontSize={10} tickLine={false} />
                                <YAxis stroke="#8a8880" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#141418', borderColor: '#2b2b34', borderRadius: '10px', fontSize: '11px', color: '#f4efe6' }} />
                                <Bar dataKey="count" fill="#f5ebe1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Severity Breakdown Donut Chart */}
                        <div className="p-5 rounded-2xl bg-[#141418] border border-[#242429] flex flex-col justify-between shadow-xl">
                          <div>
                            <h4 className="text-xs font-syne font-bold text-[#f4efe6] mb-1 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-amber-400" /> Severity Breakdown
                            </h4>
                            <p className="text-[11px] text-[#8a8880] mb-3">High vs Medium vs Low hazard proportions</p>
                          </div>
                          <div className="h-56 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={analysisResult.chart_data.severity_pie} 
                                  dataKey="value" 
                                  nameKey="name" 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={45} 
                                  outerRadius={70} 
                                  paddingAngle={4}
                                >
                                  {analysisResult.chart_data.severity_pie.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#141418', borderColor: '#2b2b34', borderRadius: '10px', fontSize: '11px', color: '#f4efe6' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>

                      {/* 4. Commuter Safety & Risk Assessment (3 Cards) */}
                      <div>
                        <div className="mb-3">
                          <h4 className="text-sm font-syne font-bold text-[#f4efe6] flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-rose-400" />
                            <span>Road-User Safety & Risk Breakdown</span>
                          </h4>
                          <p className="text-xs text-[#a29f99] font-sans">
                            How the detected anomalies specifically affect bikes, cars, and pedestrians.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {commuterAnalysis.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between space-y-3 shadow-md hover:border-[#383842] transition-colors">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {idx === 0 && <Bike className="w-4 h-4 text-rose-400 shrink-0" />}
                                    {idx === 1 && <Car className="w-4 h-4 text-amber-400 shrink-0" />}
                                    {idx === 2 && <Compass className="w-4 h-4 text-cyan-400 shrink-0" />}
                                    <h5 className="font-syne font-bold text-xs text-[#f4efe6]">{item.category}</h5>
                                  </div>
                                  <span 
                                    className="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                                    style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}
                                  >
                                    {item.risk_level}
                                  </span>
                                </div>

                                <div className="space-y-1 mb-2.5">
                                  <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-[#8a8880]">Vulnerability Score</span>
                                    <span className="font-bold" style={{ color: item.color }}>{item.risk_score}%</span>
                                  </div>
                                  <div className="w-full bg-[#101014] rounded-full h-2 overflow-hidden border border-[#242429]">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.risk_score}%`, backgroundColor: item.color }} />
                                  </div>
                                </div>

                                <p className="text-[11px] text-[#d6d0c7] font-sans leading-relaxed">
                                  {item.reason}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-[#242429] text-[10px] text-amber-300 font-sans flex items-start gap-1.5">
                                <span className="font-bold shrink-0">Tip:</span>
                                <span>{item.safety_tip}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5. Actionable Maintenance Recommendations */}
                      <div className="p-5 rounded-2xl bg-[#141418] border border-[#242429] shadow-lg">
                        <h4 className="font-syne font-bold text-xs text-[#f4efe6] mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-[#f5ebe1]" />
                          <span>Recommended Action Plan</span>
                        </h4>
                        <div className="space-y-2 text-xs font-sans">
                          {recommendations.map((rec, i) => (
                            <div key={i} className="p-3 rounded-lg bg-[#0c0c0e]/80 border border-[#242429] flex items-start gap-2.5 text-[#d6d0c7]">
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </ErrorBoundary>
                );
              })() : (
                <div className="p-12 rounded-2xl border border-[#242429] bg-[#141418] text-center space-y-3">
                  <BarChart2 className="w-10 h-10 text-[#6a6860] mx-auto" />
                  <h4 className="font-syne font-bold text-[#f4efe6] text-base">No Active Inspection Data</h4>
                  <p className="text-xs text-[#a29f99] max-w-sm mx-auto font-sans">
                    Run an inspection in the Inspection Studio or select a demo sample to view real-time charts and multi-user risk indices.
                  </p>
                  <button
                    onClick={() => setActiveTab('inspector')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_15px_rgba(217,119,6,0.25)] cursor-pointer transition-all"
                  >
                    Go to Inspection Studio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 6: AUDIT REPORTS & PAST RECORDS ================= */}
          {activeTab === 'reports' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-syne font-bold text-[#f4efe6]">Inspection Audit Ledger</h3>
                  <p className="text-[11px] text-[#a29f99] font-sans">
                    Comprehensive log of past road inspections saved in database with download links.
                  </p>
                </div>
                <button
                  onClick={fetchSessions}
                  className="px-2.5 py-1 rounded-lg bg-[#141418] border border-[#242429] hover:bg-[#202028] text-[11px] text-[#d6d0c7] flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingSessions ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="rounded-xl border border-[#242429] bg-[#141418] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-[#d6d0c7]">
                    <thead className="bg-[#101014] text-[#8a8880] uppercase text-[9px] font-display tracking-wider border-b border-[#242429]">
                      <tr>
                        <th className="py-2 px-3">Session ID / Timestamp</th>
                        <th className="py-2 px-3">Filename</th>
                        <th className="py-2 px-3">Condition</th>
                        <th className="py-2 px-3">Defects</th>
                        <th className="py-2 px-3">Priority</th>
                        <th className="py-2 px-3">Format</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242429]">
                      {pastSessions.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-6 text-center text-[#8a8880] font-sans text-xs">
                            No past inspection records found. Run your first inspection!
                          </td>
                        </tr>
                      ) : (
                        pastSessions.map((s) => (
                          <tr key={s.session_id} className="hover:bg-[#1a1a22] transition-colors">
                            <td className="py-2 px-3 font-mono text-[10px] text-[#d6d0c7]">
                              <span className="block font-bold text-[#f4efe6]">{s.created_at || 'Recent'}</span>
                              <span className="text-[9px] text-[#8a8880]">{s.session_id.slice(0, 8)}...</span>
                            </td>
                            <td className="py-2 px-3 font-medium text-[#f4efe6] text-[11px]">{s.filename}</td>
                            <td className="py-2 px-3">{getConditionBadge(s.road_condition)}</td>
                            <td className="py-2 px-3 font-syne font-bold text-[#f4efe6] text-xs">{s.total_defects}</td>
                            <td className="py-2 px-3 font-syne font-bold text-amber-400 text-xs">P{s.repair_priority}</td>
                            <td className="py-2 px-3 font-mono text-[#8a8880] text-[10px]">
                              {s.media_type ? s.media_type.toUpperCase() : 'IMAGE'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#f5ebe1]/10 text-[#f5ebe1] border border-[#f5ebe1]/25">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {s.pdf_url && (
                                  <a
                                    href={`${API_BASE}${s.pdf_url}`}
                                    className="p-1 rounded-md bg-[#181820] hover:bg-[#20202a] text-[#f5ebe1] border border-[#2e2e38] hover:border-[#f5ebe1]/50 transition-colors"
                                    title="Download PDF"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </a>
                                )}
                                <a
                                  href={`${API_BASE}/api/report/csv/${s.session_id}`}
                                  className="p-1 rounded-md bg-[#181820] hover:bg-[#20202a] text-[#d6d0c7] border border-[#2e2e38] hover:border-[#f5ebe1]/50 transition-colors"
                                  title="Download CSV"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}