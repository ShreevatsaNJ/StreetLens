import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, ScanSearch, MapPin, BarChart3, FileSpreadsheet, 
  Upload, AlertTriangle, ShieldCheck, FileText, Download, 
  Eye, Activity, RefreshCw, BarChart2, Droplet, ArrowRight, 
  CheckCircle, ChevronRight, Sparkles, Cpu, Layers, Radio,
  Compass, ShieldAlert, Bot, X, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import CompareSlider from './components/CompareSlider';
import HazardMap from './components/HazardMap';

const API_BASE = "http://localhost:5000";

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('inspector'); // 'dashboard', 'inspector', 'map', 'analytics', 'reports'
  const [isLandingOpen, setIsLandingOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Upload & Inspection State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [manualCoords, setManualCoords] = useState({ lat: '12.9352', lon: '77.6944' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeView, setActiveView] = useState('slider'); // 'slider' or 'annotated'

  // Sessions History State
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch session history from backend database
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
      setMediaType('image');
      setPreviewUrl(samplePath);
    } catch (err) {
      console.error("Failed to load sample:", err);
      setErrorMsg("Failed to load sample image.");
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select an image or video first.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setProcessingStep("Ingesting media and extracting GPS telemetry...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (manualCoords.lat && manualCoords.lon) {
        formData.append("latitude", manualCoords.lat);
        formData.append("longitude", manualCoords.lon);
      }

      const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const sessionId = uploadRes.data.session_id;

      setProcessingStep("Executing YOLOv8s inference & Bokeh depth-of-field synthesis...");
      const analyzeRes = await axios.post(`${API_BASE}/api/analyze/${sessionId}`);

      setAnalysisResult(analyzeRes.data);
      setIsProcessing(false);
      fetchSessions();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Analysis failed. Ensure backend Flask server is running on port 5000.");
      setIsProcessing(false);
    }
  };

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'GOOD':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">GOOD (Sound Surface)</span>;
      case 'FAIR':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">FAIR (Minor Wear)</span>;
      case 'POOR':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">POOR (Repair Scheduled)</span>;
      case 'CRITICAL':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse">CRITICAL (Emergency Hazard)</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300">{condition}</span>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">LOW</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-800 text-zinc-300">{severity}</span>;
    }
  };

  const hasWaterlogged = analysisResult?.ranked_defects?.some(d => d.is_waterlogged);

  // Landing Page Mode
  if (isLandingOpen) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 bg-grid-pattern relative flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Top Navbar */}
        <header className="border-b border-zinc-800/80 bg-[#0a0d14]/85 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                SL
              </div>
              <span className="text-xl font-bold tracking-tight text-white">StreetLens</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsLandingOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Urban Road Safety AI
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mb-6">
            Assess Road Safety with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">Intelligent Vision</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            StreetLens combines custom YOLOv8 deep learning, asphalt enhancement, depth-of-field Bokeh spotlighting, and multi-vehicle risk modeling to safeguard modern urban infrastructure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button 
              onClick={() => setIsLandingOpen(false)}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(6,182,212,0.45)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setIsLandingOpen(false); setActiveTab('inspector'); }}
              className="px-8 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-white font-semibold text-sm transition-all"
            >
              Try Demo Inspector
            </button>
          </div>

          {/* 3 Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <div className="p-6 rounded-2xl bg-[#0c1017]/90 border border-zinc-800/90 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Bokeh Spotlight Focus</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies optical Gaussian blurring to healthy road sections while keeping potholes and fractures tack-sharp with glow badges.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1017]/90 border border-zinc-800/90 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                <Droplet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Waterlogged Cavity Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects standing water pools masking pothole depths to alert two-wheeler motorists against critical hydroplaning and skid hazards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1017]/90 border border-zinc-800/90 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Multi-User Risk Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes differentiated safety risk percentages for motorcyclists, four-wheelers, and pedestrians based on road fracture geometry.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* ================= LEFT SIDEBAR (Autonomous CV Identity) ================= */}
      <aside className="w-64 border-r border-zinc-800/80 bg-[#0a0d14] flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-40">
        <div>
          {/* Logo & Status */}
          <div className="p-5 border-b border-zinc-800/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-[0_0_18px_rgba(6,182,212,0.4)]">
                SL
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block">StreetLens</span>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  AI Vision Active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-3 space-y-1">
            <span className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 mt-3">
              Platform Menu
            </span>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <ScanSearch className="w-4 h-4" />
              <span>Inspection Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Hazard Map</span>
              <span className="ml-auto text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {pastSessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Risk</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Audit Reports</span>
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-zinc-800/70">
          <button 
            onClick={() => setIsLandingOpen(true)}
            className="w-full mb-3 flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Landing Page
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/40">
              S
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-white truncate block">Shreevatsa N J</span>
              <span className="text-[10px] text-zinc-400 truncate block">CSE (Data Science) • NHCE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/80 bg-[#0a0d14]/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-cyan-500 text-white flex items-center justify-center font-black text-sm">
              SL
            </div>
            <div>
              <h2 className="text-sm font-bold text-white capitalize">
                {activeTab === 'dashboard' && 'Executive Road Safety Dashboard'}
                {activeTab === 'inspector' && 'Visual Inspection Studio'}
                {activeTab === 'map' && 'Geospatial Hazard Map'}
                {activeTab === 'analytics' && 'Safety Risk & Defect Analytics'}
                {activeTab === 'reports' && 'Inspection Audit Ledger & Downloads'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>YOLOv8s CPU Engine</span>
            </div>

            <button
              onClick={() => { setActiveTab('inspector'); setSelectedFile(null); setAnalysisResult(null); }}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ New Inspection</span>
            </button>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ================= TAB 1: EXECUTIVE DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Hero Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c121e] via-[#091522] to-[#0a101b] border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold mb-2 border border-cyan-500/25">
                    <Radio className="w-3 h-3 animate-pulse text-cyan-400" /> Computer Vision Telemetry Active
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Urban Infrastructure Safety Monitor</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Automated defect detection, optical Bokeh spotlighting, and multi-vehicle vulnerability rating across monitored corridors.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Launch Inspection Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-medium block mb-1">Total Monitored Scans</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{pastSessions.length}</span>
                    <span className="text-xs text-cyan-400 font-medium">Logged in DB</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-medium block mb-1">Detection Pipeline</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">YOLOv8s</span>
                    <span className="text-xs text-zinc-400 font-mono">640px</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-medium block mb-1">Active Road Condition</span>
                  <div>{getConditionBadge(analysisResult?.summary?.road_condition || 'GOOD')}</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-medium block mb-1">Repair Priority Index</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400">
                      {analysisResult?.summary?.repair_priority || 1}
                    </span>
                    <span className="text-xs text-zinc-500">/ 5 (Scale)</span>
                  </div>
                </div>
              </div>

              {/* Corridor Hazard Density Map & Quick Samples */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c1017] border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" /> Corridor Hazard Density
                    </h4>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      View Fullscreen <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden">
                    <HazardMap sessions={pastSessions} />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Quick-Test Samples
                    </h4>
                    <p className="text-xs text-zinc-400 mb-4">
                      Test the pipeline with 1 click using preloaded road condition captures.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setActiveTab('inspector');
                          handleSelectSample('/samples/sample1_waterlogged.jpg', 'sample_waterlogged_pothole.jpg');
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                      >
                        <img src="/samples/sample1_waterlogged.jpg" alt="sample 1" className="w-12 h-10 object-cover rounded-lg border border-zinc-700" />
                        <div>
                          <span className="text-xs font-semibold text-white block group-hover:text-cyan-400">Sample 1: Waterlogged Pothole</span>
                          <span className="text-[10px] text-zinc-400">Cavity with standing water</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('inspector');
                          handleSelectSample('/samples/sample2_cracks.png', 'sample_road_cracks.png');
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                      >
                        <img src="/samples/sample2_cracks.png" alt="sample 2" className="w-12 h-10 object-cover rounded-lg border border-zinc-700" />
                        <div>
                          <span className="text-xs font-semibold text-white block group-hover:text-cyan-400">Sample 2: Surface Cracks</span>
                          <span className="text-[10px] text-zinc-400">Longitudinal & structural wear</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/70 text-[11px] text-zinc-500">
                    Model: YOLOv8s trained on RDD2020 dataset
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: INSPECTION STUDIO ================= */}
          {activeTab === 'inspector' && (
            <div className="space-y-6">
              
              {/* Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  selectedFile ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <span className="font-semibold">Media Ingestion</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isProcessing ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 animate-pulse' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <span className="font-semibold">CV & Enhancement</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  analysisResult ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <span className="font-semibold">Bokeh Spotlight</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  analysisResult ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                  <span className="font-semibold">Report Generated</span>
                </div>
              </div>

              {/* Upload Dropzone & Action Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c1017] border border-zinc-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Step 1: Upload Road Surface Capture
                    </span>
                    <span className="text-[10px] text-zinc-500">Supports JPG, PNG, MP4, AVI (Up to 200MB)</span>
                  </div>

                  <label className="border-2 border-dashed border-zinc-700/80 hover:border-cyan-400/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/70 group">
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-cyan-500/20 flex items-center justify-center text-zinc-400 group-hover:text-cyan-400 transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-200">
                      {selectedFile ? selectedFile.name : "Click or drag & drop road photos / dashcam videos"}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1">
                      Automatic EXIF GPS extraction + manual location override
                    </span>
                  </label>

                  {/* One-Click Demo Samples */}
                  <div className="pt-2">
                    <span className="text-xs text-zinc-400 font-semibold block mb-2">
                      ⚡ Or test with one-click demo samples:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectSample('/samples/sample1_waterlogged.jpg', 'sample_waterlogged_pothole.jpg')}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
                      >
                        <img 
                          src="/samples/sample1_waterlogged.jpg" 
                          alt="Waterlogged pothole" 
                          className="w-14 h-11 object-cover rounded-lg border border-zinc-700 group-hover:border-cyan-400" 
                        />
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block group-hover:text-cyan-400">
                            Demo 1: Waterlogged Pothole
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Severe cavity & puddle risk</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSample('/samples/sample2_cracks.png', 'sample_road_cracks.png')}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
                      >
                        <img 
                          src="/samples/sample2_cracks.png" 
                          alt="Road surface cracks" 
                          className="w-14 h-11 object-cover rounded-lg border border-zinc-700 group-hover:border-cyan-400" 
                        />
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block group-hover:text-cyan-400">
                            Demo 2: Road Surface Cracks
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Longitudinal & structural cracks</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* GPS Telemetry Inputs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-semibold text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> GPS Location:
                    </span>
                    <input 
                      type="text" 
                      placeholder="Latitude (e.g. 12.9352)" 
                      value={manualCoords.lat}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyan-400 text-xs"
                    />
                    <input 
                      type="text" 
                      placeholder="Longitude (e.g. 77.6944)" 
                      value={manualCoords.lon}
                      onChange={(e) => setManualCoords(prev => ({ ...prev, lon: e.target.value }))}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>
                </div>

                {/* Preview Box & Inspect Button */}
                <div className="p-6 rounded-2xl bg-[#0c1017] border border-zinc-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">
                      Input Media Preview
                    </span>
                    {previewUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-black flex items-center justify-center">
                        {mediaType === 'video' ? (
                          <video src={previewUrl} controls className="max-h-full max-w-full" />
                        ) : (
                          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-xs text-zinc-500">
                        No media selected yet
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUploadAndAnalyze}
                    disabled={!selectedFile || isProcessing}
                    className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-600 font-bold text-white text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Processing AI Inspection...</span>
                      </>
                    ) : (
                      <>
                        <span>Inspect Road Surface</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status & Alerts */}
              {isProcessing && (
                <div className="p-4 rounded-xl bg-cyan-950/25 border border-cyan-500/30 flex items-center gap-3 text-xs font-semibold text-cyan-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{processingStep}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Inspection Results Dashboard */}
              {analysisResult && (
                <div className="space-y-6 pt-2">
                  
                  {/* Waterlogged Alert Banner */}
                  {hasWaterlogged && (
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/70 flex items-center gap-3 text-rose-200">
                      <Droplet className="w-6 h-6 text-cyan-400 shrink-0 animate-bounce" />
                      <div>
                        <h4 className="font-bold text-sm text-rose-100">Caution: Waterlogged Anomaly Detected</h4>
                        <p className="text-xs text-rose-300">
                          Standing water conceals cavity depth. High hydroplaning and loss-of-control risk for two-wheelers.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#0c1017] border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">Road Condition</span>
                      <div>{getConditionBadge(analysisResult.summary.road_condition)}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1017] border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">Total Hazards Found</span>
                      <span className="text-2xl font-black text-white">{analysisResult.summary.total_defects}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1017] border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">Damage Surface Density</span>
                      <span className="text-2xl font-black text-white">{analysisResult.summary.damage_density_pct}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0c1017] border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-medium block mb-1">Repair Priority Index</span>
                      <span className="text-2xl font-black text-amber-400">
                        Priority {analysisResult.summary.repair_priority} <span className="text-xs text-zinc-500 font-normal">/ 5</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Evidence (Bokeh Spotlight & Slider) */}
                  <div className="p-6 rounded-2xl bg-[#0c1017] border border-zinc-800/80 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-800 mb-6 gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          Visual Inspection Evidence (Bokeh Spotlight Focus)
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Healthy road asphalt is softly blurred while anomalies remain tack-sharp with glow badges.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveView('slider')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            activeView === 'slider' ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          Before / After Slider
                        </button>
                        <button
                          onClick={() => setActiveView('annotated')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            activeView === 'annotated' ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          Full Spotlight View
                        </button>
                      </div>
                    </div>

                    {activeView === 'slider' && analysisResult.media_urls.raw ? (
                      <CompareSlider 
                        originalSrc={`${API_BASE}${analysisResult.media_urls.raw}`}
                        annotatedSrc={`${API_BASE}${analysisResult.media_urls.annotated}`}
                      />
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center max-h-[500px]">
                        <img 
                          src={`${API_BASE}${analysisResult.media_urls.annotated}`} 
                          alt="Bokeh Spotlight View" 
                          className="max-h-[500px] w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ranked Defects Ledger */}
                  <div className="p-6 rounded-2xl bg-[#0c1017] border border-zinc-800/80 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white">
                        Ranked Hazards Ledger ({analysisResult.ranked_defects.length} detected)
                      </h3>
                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        View Full Ledger & PDF →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-900/60 text-zinc-400 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Rank</th>
                            <th className="py-2.5 px-3">Anomaly Class</th>
                            <th className="py-2.5 px-3">Severity</th>
                            <th className="py-2.5 px-3">Confidence</th>
                            <th className="py-2.5 px-3">Dimensions (px)</th>
                            <th className="py-2.5 px-3">Waterlogged</th>
                            <th className="py-2.5 px-3">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/70">
                          {analysisResult.ranked_defects.map((d) => (
                            <tr key={d.rank} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-3 font-bold text-white">#{d.rank}</td>
                              <td className="py-3 px-3 font-semibold text-zinc-200">{d.class}</td>
                              <td className="py-3 px-3">{getSeverityBadge(d.severity)}</td>
                              <td className="py-3 px-3">{Math.round(d.confidence * 100)}%</td>
                              <td className="py-3 px-3 text-zinc-400">{d.dimensions_px[0]} × {d.dimensions_px[1]}</td>
                              <td className="py-3 px-3">
                                {d.is_waterlogged ? (
                                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                    <Droplet className="w-3 h-3" /> Yes
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">Dry</span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-cyan-400">{d.severity_score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Download PDF & CSV Action Bar */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-[#0c1420] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Download Official Engineering Review
                      </h4>
                      <p className="text-xs text-zinc-400">
                        PDF includes plain border canvas, embedded anomaly photo, and ranked defect ledger.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`${API_BASE}/api/report/csv/${analysisResult.session_id}`}
                        className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-400" />
                        <span>CSV Data</span>
                      </a>
                      <a
                        href={`${API_BASE}/api/report/pdf/${analysisResult.session_id}`}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Report</span>
                      </a>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: HAZARD MAP ================= */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Geospatial Hazard Map</h3>
                  <p className="text-xs text-zinc-400">
                    Live OpenStreetMap visualization with color-coded pulsing pins based on road condition severity.
                  </p>
                </div>
                <button
                  onClick={fetchSessions}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
                  <span>Refresh Map Pins</span>
                </button>
              </div>

              <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl">
                <HazardMap 
                  sessions={pastSessions} 
                  currentCoords={manualCoords} 
                />
              </div>
            </div>
          )}

          {/* ================= TAB 4: ANALYTICS & RISK ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Road-User Risk & Anomaly Analytics</h3>
                <p className="text-xs text-zinc-400">
                  Statistical breakdown of defect classes, severity proportions, and multi-vehicle vulnerability ratings.
                </p>
              </div>

              {analysisResult ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Defect Categories Bar Chart */}
                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-cyan-400" /> Defect Distribution
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-4">Detected frequency by classification</p>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysisResult.chart_data.category_distribution}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#07090e', borderColor: '#27272a', borderRadius: '10px', fontSize: '11px' }} />
                          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Severity Breakdown Donut Chart */}
                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" /> Severity Breakdown
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-4">High vs Medium vs Low ratio</p>
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
                          <Tooltip contentStyle={{ backgroundColor: '#07090e', borderColor: '#27272a', borderRadius: '10px', fontSize: '11px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Road-User Specific Risk Bars */}
                  <div className="p-5 rounded-2xl bg-[#0c1017] border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 mb-1 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-rose-400" /> Road-User Safety Risk
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-4">Vulnerability index (0–100%) by user type</p>
                    </div>
                    <div className="h-56 w-full flex flex-col justify-center space-y-4">
                      {analysisResult.chart_data.user_risk_bars.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-300">{item.user}</span>
                            <span style={{ color: item.color }}>{item.risk}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${item.risk}%`, backgroundColor: item.color }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl border border-zinc-800 bg-[#0c1017] text-center space-y-3">
                  <BarChart2 className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="font-bold text-white text-sm">No Active Inspection Data</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Run an inspection in the Inspection Studio or select a demo sample to view real-time charts and multi-user risk indices.
                  </p>
                  <button
                    onClick={() => setActiveTab('inspector')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
                  >
                    Go to Inspection Studio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 5: AUDIT REPORTS & PAST RECORDS ================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Inspection Audit Ledger</h3>
                  <p className="text-xs text-zinc-400">
                    Comprehensive log of past road inspections saved in database with download links.
                  </p>
                </div>
                <button
                  onClick={fetchSessions}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#0c1017] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="py-3.5 px-4">Session ID / Timestamp</th>
                        <th className="py-3.5 px-4">Filename</th>
                        <th className="py-3.5 px-4">Condition</th>
                        <th className="py-3.5 px-4">Defects</th>
                        <th className="py-3.5 px-4">Priority</th>
                        <th className="py-3.5 px-4">GPS Coordinates</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {pastSessions.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-zinc-500">
                            No past inspection records found. Run your first inspection!
                          </td>
                        </tr>
                      ) : (
                        pastSessions.map((s) => (
                          <tr key={s.session_id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-300">
                              <span className="block font-bold text-white">{s.created_at || 'Recent'}</span>
                              <span className="text-[10px] text-zinc-500">{s.session_id.slice(0, 8)}...</span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-zinc-200">{s.filename}</td>
                            <td className="py-3.5 px-4">{getConditionBadge(s.road_condition)}</td>
                            <td className="py-3.5 px-4 font-bold text-white">{s.total_defects}</td>
                            <td className="py-3.5 px-4 font-semibold text-amber-400">P{s.repair_priority}</td>
                            <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                              {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {s.pdf_url && (
                                  <a
                                    href={`${API_BASE}${s.pdf_url}`}
                                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 hover:border-cyan-500/50 transition-colors"
                                    title="Download PDF"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <a
                                  href={`${API_BASE}/api/report/csv/${s.session_id}`}
                                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                                  title="Download CSV"
                                >
                                  <Download className="w-3.5 h-3.5" />
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

      {/* ================= FLOATING AI ASSISTANT (Electric Cyan FAB) ================= */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 cursor-pointer"
          title="StreetLens AI Quick Diagnostic"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* Quick AI Assistant Drawer Modal */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1017] border border-zinc-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAssistantOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">StreetLens AI Assistant</h3>
                <span className="text-[10px] text-cyan-400">Urban Road Condition Diagnostic</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 mb-6 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
              <p>
                👋 Hello! I am the StreetLens diagnostic assistant.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-zinc-400">
                <p>• <strong>Potholes (D40):</strong> High risk for 2-wheelers; triggers waterlogged alerts.</p>
                <p>• <strong>Cracks (D00/D10/D20):</strong> Structural wear categorized into Longitudinal, Transverse, and Alligator.</p>
                <p>• <strong>Bokeh Spotlight:</strong> Distinguishes defects visually from normal asphalt.</p>
              </div>
            </div>

            <button
              onClick={() => setIsAssistantOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              Close Assistant
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
