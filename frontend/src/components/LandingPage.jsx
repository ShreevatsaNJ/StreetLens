import React from 'react';
import { 
  ArrowRight, Sparkles, Camera, Eye, Droplet, ShieldCheck, 
  FileText, Quote, Zap, Activity
} from 'lucide-react';
import NeuralNetworkBackground from './NeuralNetworkBackground';

const ROAD_TELEMETRY_ITEMS = [
  {
    id: 1,
    src: '/samples/road_clean_spotlight.jpg',
    tag: 'YOLOv8',
    title: 'Pothole & Cavity Detection',
    detail: '94% Conf • BBox HUD',
    badge: 'LIVE AI',
    color: '#f5ebe1'
  },
  {
    id: 2,
    src: '/samples/sample4_bokeh.jpg',
    tag: 'Optics',
    title: 'Gaussian Bokeh Spotlight',
    detail: 'Isolation Focus',
    badge: 'BOKEH',
    color: '#ded4c7'
  },
  {
    id: 3,
    src: '/samples/sample1_waterlogged.jpg',
    tag: 'Hazard',
    title: 'Waterlogged Pothole Alert',
    detail: 'Depth Warning',
    badge: 'HYDROPLANING',
    color: '#38bdf8'
  },
  {
    id: 4,
    src: '/samples/sample2_cracks.png',
    tag: 'Fracture',
    title: 'Longitudinal Cracking',
    detail: 'P2 Maintenance',
    badge: 'CRACK AUDIT',
    color: '#fbbf24'
  },
  {
    id: 5,
    src: '/samples/sample3_annotated.jpg',
    tag: 'Telemetry',
    title: 'Corridor Transit Scan',
    detail: 'Multi-Defect Ledger',
    badge: 'NEURAL STREAM',
    color: '#f5ebe1'
  },
  {
    id: 6,
    src: '/samples/road_clean_raw.jpg',
    tag: 'Raw Feed',
    title: 'Urban Transit Corridor',
    detail: 'Raw Optical Input',
    badge: 'RAW CAPTURE',
    color: '#a29f99'
  }
];

function CompactRoadTicker() {
  const items = [...ROAD_TELEMETRY_ITEMS, ...ROAD_TELEMETRY_ITEMS];

  return (
    <div className="w-full relative mt-5 overflow-hidden">
      {/* Side Edge Fade Masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-r from-[#0c0c0e] to-transparent"></div>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-l from-[#0c0c0e] to-transparent"></div>

      {/* Marquee Track with Compact Cards */}
      <div className="w-full overflow-hidden py-1">
        <div className="animate-road-marquee flex gap-3">
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-44 sm:w-48 md:w-52 shrink-0 rounded-lg bg-[#141418] border border-[#26262d] hover:border-[#f5ebe1]/40 transition-all p-1 shadow-md group/card cursor-pointer"
            >
              {/* Image Frame */}
              <div className="relative rounded-md overflow-hidden aspect-[16/10] bg-black">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                />

                {/* Floating HUD Badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-[#0c0c0e]/85 backdrop-blur-md text-[#f5ebe1] border border-white/10 shadow-sm">
                    {item.badge}
                  </span>
                </div>

                {/* Bottom Overlay within Image */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 pt-3 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-mono text-[#f5ebe1] font-semibold tracking-tight flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Card Footer Detail */}
              <div className="px-1 pt-1 pb-0.5 flex items-center justify-between text-[8px]">
                <span className="font-mono text-[#a29f99] truncate max-w-[120px]">
                  {item.detail}
                </span>
                <span className="text-[7px] font-mono uppercase tracking-wider text-[#8a8880] shrink-0">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4efe6] font-sans selection:bg-[#f5ebe1] selection:text-[#0c0c0e] flex flex-col relative overflow-hidden">
      
      {/* Ambient Deep Learning Neural Network Background */}
      <NeuralNetworkBackground opacity={0.65} />

      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#0c0c0e]/75 backdrop-blur-md border-b border-[#242429]/60 transition-all">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          
          {/* Logo with Cyan Glow */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5ebe1] via-[#bae6fd] to-[#38bdf8] text-[#0c0c0e] flex items-center justify-center font-syne font-extrabold text-xs shadow-[0_0_18px_rgba(56,189,248,0.4)]">
              SL
            </div>
            <div>
              <span className="font-syne font-extrabold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f5ebe1] to-[#7dd3fc] block leading-none drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                StreetLens
              </span>
              <span className="text-[9px] text-[#38bdf8]/90 font-display font-medium tracking-wider uppercase block">
                Road AI Vision
              </span>
            </div>
          </div>

          {/* Live System Status Beacon */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#141418]/90 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Neural Engine: Online</span>
          </div>

          {/* CTA Action */}
          <button
            onClick={onGetStarted}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#f5ebe1] via-white to-[#bae6fd] hover:from-white hover:to-[#7dd3fc] text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.03]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-800" />
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION WITH DUAL-TONE ATMOSPHERIC GLOW ================= */}
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden bg-grid-pattern border-b border-[#242429]">
        
        {/* Ambient Atmospheric Glow Orbs (Electric Cyan + Warm Amber) */}
        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[460px] h-[220px] bg-sky-500/12 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-14 right-1/4 translate-x-1/2 w-[400px] h-[200px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[#f5ebe1]/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          
          {/* Eyebrow badge with cyan glow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300 text-[9px] font-display font-semibold uppercase tracking-wider mb-3.5 shadow-[0_0_15px_rgba(56,189,248,0.2)] backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-sky-300 animate-pulse" />
            <span>Next-Gen Road Safety AI</span>
          </div>

          {/* Calibrated headline with glowing metallic text */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-syne font-extrabold text-[#f4efe6] tracking-tight leading-snug max-w-xl mb-3">
            Safeguarding Urban Transit Through{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#7dd3fc] to-[#f5ebe1] drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]">
              Autonomous Vision
            </span>
          </h1>

          {/* Editorial quote kicker with subtle cyan-to-gold quotes */}
          <p className="font-quote italic text-lg sm:text-xl md:text-2xl text-[#f5ebe1] max-w-xl mb-4 leading-relaxed tracking-wide drop-shadow-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300 not-italic mr-1 text-2xl leading-none">“</span>
            Vision is not merely seeing what lies in front of us, but safeguarding every meter of the road ahead.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-sky-400 not-italic ml-1 text-2xl leading-none">”</span>
          </p>

          <p className="text-[11px] sm:text-xs text-[#a29f99] max-w-md mb-6 leading-relaxed font-sans">
            StreetLens pairs fine-tuned YOLOv8 neural inference with optical Bokeh spotlighting, waterlogged puddle detection, and multi-vehicle risk modeling to protect pedestrians, two-wheelers, and motorists.
          </p>

          {/* Primary Action Button with radiant halo */}
          <div className="mb-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f5ebe1] via-white to-[#bae6fd] hover:from-white hover:to-[#7dd3fc] text-[#0c0c0e] font-syne font-extrabold text-xs shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.55)] transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-900" />
            </button>
          </div>

        </div>

        {/* Compact Continuous Moving Road Analysis Stream */}
        <CompactRoadTicker />
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="py-10 md:py-12 max-w-5xl mx-auto px-4 space-y-6">
        
        {/* Section Heading with Warm Amber Accent */}
        <div className="text-center max-w-lg mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-display font-semibold uppercase tracking-wider">
            Capabilities
          </div>
          <h2 className="text-lg sm:text-xl font-syne font-extrabold text-[#f4efe6] tracking-tight">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4efe6] via-[#fde047] to-[#f59e0b] drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]">Modern Road Audits</span>
          </h2>
          <p className="text-[11px] text-[#a29f99] font-sans">
            Every module in StreetLens addresses real-world hazards faced by municipal engineers, commuters, and field inspectors.
          </p>
        </div>

        {/* 6 Feature Grid Cards with Distinct Hover Glows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Feature 1: Real-Time Live Dashcam HUD (Rose Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-rose-300 transition-colors text-xs">
              Live Dashcam Stream (HUD)
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              Mount your phone or webcam on any vehicle dashboard. StreetLens executes real-time frame streaming with sub-100ms inference, corner-bracket tracking, and instant snapshot auditing.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-rose-400">
              <span>Real-time bounding</span> • <span>FPS HUD</span>
            </div>
          </div>

          {/* Feature 2: Optical Bokeh Spotlight (Ivory Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/60 hover:shadow-[0_0_25px_rgba(245,235,225,0.2)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-[#f5ebe1]/15 border border-[#f5ebe1]/40 flex items-center justify-center text-[#f5ebe1] group-hover:scale-110 transition-transform">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-[#f5ebe1] transition-colors text-xs">
              Optical Bokeh Spotlight Focus
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              Eliminates visual fatigue for road inspectors. Healthy asphalt is softly blurred with a Gaussian kernel while potholes and surface fractures stay tack-sharp with glow badges.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-[#f5ebe1]">
              <span>Interactive comparison slider</span>
            </div>
          </div>

          {/* Feature 3: Waterlogged Cavity Detection (Cyan Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
              <Droplet className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-cyan-300 transition-colors text-xs">
              Waterlogged Cavity Alert
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              Standing water conceals cavity depth. StreetLens performs adaptive color segmentation to detect submerged potholes, warning against severe hydroplaning and skid hazards.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-cyan-400">
              <span>Monsoon road defense</span>
            </div>
          </div>

          {/* Feature 4: Multi-User Vulnerability Scoring (Amber Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.22)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-amber-300 transition-colors text-xs">
              Multi-User Safety Index
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              A pothole is a minor bump for a truck, but potentially fatal for a 2-wheeler. StreetLens computes differentiated safety scores for motorcyclists, 4-wheelers, and pedestrians.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-amber-400">
              <span>Tri-modal safety breakdown</span>
            </div>
          </div>

          {/* Feature 5: Real-Time Sub-50ms Inference Loop (Emerald Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-emerald-400/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.22)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-emerald-300 transition-colors text-xs">
              Sub-50ms Neural Inference
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              High-frequency frame ingestion engine designed for zero lag during moving vehicle captures. Automatically buffers candidate frames and triggers instant classification.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <span>Real-time PyTorch pipeline</span>
            </div>
          </div>

          {/* Feature 6: Official Engineering PDF Dossiers (Purple Glow) */}
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.22)] transition-all shadow-sm group space-y-2 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] group-hover:text-purple-300 transition-colors text-xs">
              Official PDF &amp; CSV Dossiers
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed font-sans">
              One-click generation of formal municipal inspection reports with ReportLab. Includes embedded anomaly spotlight photos, defect dimensions, priority indices, and raw CSVs.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-purple-400">
              <span>Auditable municipal ledger</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= EDITORIAL QUOTES SECTION ================= */}
      <section id="quotes" className="py-10 bg-[#101014] border-y border-[#242429]">
        <div className="max-w-5xl mx-auto px-4 space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[9px] font-display font-semibold text-[#f5ebe1] uppercase tracking-wider mb-1">
                <Quote className="w-3 h-3 text-[#f5ebe1]" /> Guiding Principles
              </div>
              <h2 className="text-lg sm:text-xl font-syne font-extrabold text-[#f4efe6]">
                Infrastructure & Human Dignity
              </h2>
            </div>
            <p className="text-[10px] text-[#a29f99] max-w-xs font-sans">
              Elevating road monitoring from mundane maintenance to life-saving civic responsibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Quote Card 1 */}
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  A developed city is not one where the poor have cars, but where public roads are dignified and safe for every citizen.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-[#f5ebe1] block">Enrique Peñalosa</span>
                <span className="text-[9px] text-[#8a8880] font-display">Urbanist & Former Mayor of Bogotá</span>
              </div>
            </div>

            {/* Quote Card 2 */}
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  Vision is the art of seeing what is invisible to others — uncovering hidden fissures before they become catastrophe.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-[#f5ebe1] block">Jonathan Swift / StreetLens</span>
                <span className="text-[9px] text-[#8a8880] font-display">Foundational Design Principle</span>
              </div>
            </div>

            {/* Quote Card 3 */}
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  Civilization moves forward when the roads we build endure the passage of time without claiming human lives.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-[#f5ebe1] block">Urban Transit Ethos</span>
                <span className="text-[9px] text-[#8a8880] font-display">Global Infrastructure Forum</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE & PIPELINE ================= */}
      <section id="architecture" className="py-10 max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center max-w-md mx-auto space-y-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5ebe1]/10 text-[#f5ebe1] text-[9px] font-display font-semibold uppercase tracking-wider">
            Technical Stack
          </div>
          <h2 className="text-lg sm:text-xl font-syne font-extrabold text-[#f4efe6]">
            End-to-End Deep Learning Pipeline
          </h2>
          <p className="text-[10px] text-[#a29f99] font-sans">
            A modular microservice architecture engineered for high throughput and zero latency overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-sky-500/40 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">STAGE 01</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px] pt-1">Media Ingestion &amp; EXIF</h4>
            <p className="text-[#a29f99] text-[10px]">Extracts GPS metadata from EXIF tags or webcam stream telemetry.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-rose-500/40 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">STAGE 02</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px] pt-1">YOLOv8 Neural Inference</h4>
            <p className="text-[#a29f99] text-[10px]">Trained on RDD2020 dataset for D00, D10, D20 cracks &amp; D40 potholes.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-amber-500/40 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">STAGE 03</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px] pt-1">Bokeh Spotlight Focus</h4>
            <p className="text-[#a29f99] text-[10px]">OpenCV Gaussian blur on healthy asphalt; glow borders on anomalies.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#141418] border border-[#242429] hover:border-purple-500/40 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">STAGE 04</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px] pt-1">ReportLab PDF &amp; GIS</h4>
            <p className="text-[#a29f99] text-[10px]">Auto-generates official engineering audit PDF dossiers and CSV logs.</p>
          </div>
        </div>
      </section>

      {/* ================= MINIMAL FOOTER ================= */}
      <footer className="py-6 border-t border-[#242429] text-center text-[11px] text-[#8a8880] font-sans">
        <p>© StreetLens • Autonomous Road Surface Safety & Defect Assessment</p>
      </footer>

    </div>
  );
}