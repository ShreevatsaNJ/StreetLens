import React from 'react';
import { 
  ArrowRight, Sparkles, Camera, Eye, Droplet, ShieldCheck, 
  FileText, Quote
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
    color: '#f59e0b'
  },
  {
    id: 2,
    src: '/samples/sample4_bokeh.jpg',
    tag: 'Optics',
    title: 'Gaussian Bokeh Spotlight',
    detail: 'Isolation Focus',
    badge: 'BOKEH',
    color: '#fde68a'
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
    color: '#d97706'
  },
  {
    id: 5,
    src: '/samples/sample3_annotated.jpg',
    tag: 'Telemetry',
    title: 'Corridor Transit Scan',
    detail: 'Multi-Defect Ledger',
    badge: 'NEURAL STREAM',
    color: '#fbbf24'
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
              className="w-44 sm:w-48 md:w-52 shrink-0 rounded-lg bg-[#141418] border border-[#26262d] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.12)] transition-all p-1 shadow-md group/card cursor-pointer"
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
                  <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-[#0c0c0e]/85 backdrop-blur-md text-amber-300 border border-amber-400/20 shadow-sm">
                    {item.badge}
                  </span>
                </div>

                {/* Bottom Overlay within Image */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 pt-3 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-mono text-[#f5ebe1] font-semibold tracking-tight flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></span>
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Card Footer Detail */}
              <div className="px-1 pt-1 pb-0.5 flex items-center justify-between text-[8px]">
                <span className="font-mono text-[#a29f99] truncate max-w-[120px]">
                  {item.detail}
                </span>
                <span className="text-[7px] font-mono uppercase tracking-wider text-amber-400/70 shrink-0">
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
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4efe6] font-sans selection:bg-amber-400/30 selection:text-amber-100 flex flex-col relative overflow-hidden">
      
      {/* Ambient Deep Learning Neural Network Background */}
      <NeuralNetworkBackground opacity={0.65} />

      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-transparent transition-all">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          
          {/* Logo with Refined Gold Accent */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#fde68a] to-[#d97706] text-[#0c0c0e] flex items-center justify-center font-syne font-extrabold text-xs shadow-[0_0_12px_rgba(217,119,6,0.25)]">
              SL
            </div>
            <div>
              <span className="font-syne font-extrabold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fff] via-[#fde68a] to-[#d97706] block leading-none drop-shadow-[0_0_8px_rgba(217,119,6,0.2)]">
                StreetLens
              </span>
              <span className="text-[9px] text-amber-400/80 font-display font-medium tracking-wider uppercase block">
                Road AI Vision
              </span>
            </div>
          </div>

          {/* CTA Action with Soft Gold Button */}
          <button
            onClick={onGetStarted}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_12px_rgba(217,119,6,0.25)] transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-950" />
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION WITH REFINED WARM GLOW ================= */}
      <section className="relative pt-8 pb-10 md:pt-10 md:pb-12 overflow-hidden bg-grid-pattern border-b border-[#242429]">
        {/* Soft, Non-Glaring Ambient Halos */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[180px] bg-gradient-to-r from-amber-500/8 via-yellow-500/6 to-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          
          {/* Eyebrow badge with Tasteful Gold Amber Accent */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-[9px] font-display font-semibold uppercase tracking-wider mb-3 shadow-[0_0_10px_rgba(217,119,6,0.15)] backdrop-blur-sm">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Next-Gen Road Safety AI
          </div>

          {/* Calibrated headline with Soft Champagne Gold Focus */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-syne font-extrabold text-[#f4efe6] tracking-tight leading-snug max-w-xl mb-2.5">
            Safeguarding Urban Transit Through{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fff] via-[#fde68a] to-[#d97706] drop-shadow-[0_0_12px_rgba(217,119,6,0.25)]">
              Autonomous Vision
            </span>
          </h1>

          {/* Editorial quote kicker - Clean & Dignified Ivory with Gold Quotation Marks */}
          <p className="font-quote italic text-lg sm:text-xl md:text-2xl text-[#f4efe6] max-w-xl mb-3.5 leading-relaxed tracking-wide">
            <span className="text-amber-400 font-serif">“</span>Vision is not merely seeing what lies in front of us, but safeguarding every meter of the road ahead.<span className="text-amber-400 font-serif">”</span>
          </p>

          <p className="text-[11px] sm:text-xs text-[#a29f99] max-w-md mb-5 leading-relaxed font-sans">
            StreetLens pairs fine-tuned YOLOv8 neural inference with optical Bokeh spotlighting, waterlogged puddle detection, and multi-vehicle risk modeling to protect pedestrians, two-wheelers, and motorists.
          </p>

          {/* Primary Action Button */}
          <div className="mb-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#fde68a] to-[#d97706] hover:brightness-110 text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-950" />
            </button>
          </div>

        </div>

        {/* Compact Continuous Moving Road Analysis Stream */}
        <CompactRoadTicker />
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="py-10 md:py-12 max-w-5xl mx-auto px-4 space-y-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-lg mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[9px] font-display font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(217,119,6,0.15)]">
            Capabilities
          </div>
          <h2 className="text-lg sm:text-xl font-syne font-extrabold text-[#f4efe6] tracking-tight">
            Engineered for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fde68a] to-[#d97706]">
              Modern Road Audits
            </span>
          </h2>
          <p className="text-[11px] text-[#a29f99] font-sans">
            Every module in StreetLens addresses real-world hazards faced by municipal engineers, commuters, and field inspectors.
          </p>
        </div>

        {/* 6 Feature Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Feature 1: Real-Time Live Dashcam HUD */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Live Dashcam Stream (HUD)
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
              Mount your phone or webcam on any vehicle dashboard. StreetLens executes real-time frame streaming with sub-100ms inference, corner-bracket tracking, and instant snapshot auditing.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-amber-300">
              <span>Real-time bounding</span> • <span>FPS HUD</span>
            </div>
          </div>

          {/* Feature 2: Optical Bokeh Spotlight */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Optical Bokeh Spotlight Focus
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
              Eliminates visual fatigue for road inspectors. Healthy asphalt is softly blurred with a Gaussian kernel while potholes and surface fractures stay tack-sharp with glow badges.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-amber-300">
              <span>Interactive comparison slider</span>
            </div>
          </div>

          {/* Feature 3: Waterlogged Cavity Detection */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplet className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Waterlogged Cavity Alert
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
              Standing water conceals cavity depth. StreetLens performs adaptive color segmentation to detect submerged potholes, warning against severe hydroplaning and skid hazards.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-cyan-400">
              <span>Monsoon road defense</span>
            </div>
          </div>

          {/* Feature 4: Multi-User Vulnerability Scoring */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Multi-User Safety Index
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
              A pothole is a minor bump for a truck, but potentially fatal for a 2-wheeler. StreetLens computes differentiated safety scores for motorcyclists, 4-wheelers, and pedestrians.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-amber-400">
              <span>Tri-modal safety breakdown</span>
            </div>
          </div>

          {/* Feature 5: Real-Time Live Dashcam Stream */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Live Dashcam & Camera Stream
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
              Real-time road damage detection through webcams and phone cameras. Features instant reticle overlays, adaptive sensitivity presets, and audible hazard alerts.
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[9px] font-mono text-rose-400">
              <span>Sub-50ms inference loop</span>
            </div>
          </div>

          {/* Feature 6: Official Engineering PDF Dossiers */}
          <div className="p-3.5 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm group space-y-2">
            <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-xs">
              Official PDF & CSV Dossiers
            </h3>
            <p className="text-[10px] text-[#a29f99] leading-relaxed">
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
              <div className="inline-flex items-center gap-1.5 text-[9px] font-display font-semibold text-amber-300 uppercase tracking-wider mb-1">
                <Quote className="w-3 h-3 text-amber-400" /> Guiding Principles
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
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-2xl font-quote text-amber-400/60 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  A developed city is not one where the poor have cars, but where public roads are dignified and safe for every citizen.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-amber-300 block">Enrique Peñalosa</span>
                <span className="text-[9px] text-[#8a8880] font-display">Urbanist & Former Mayor of Bogotá</span>
              </div>
            </div>

            {/* Quote Card 2 */}
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-2xl font-quote text-amber-400/60 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  Vision is the art of seeing what is invisible to others — uncovering hidden fissures before they become catastrophe.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-amber-300 block">Jonathan Swift / StreetLens</span>
                <span className="text-[9px] text-[#8a8880] font-display">Foundational Design Principle</span>
              </div>
            </div>

            {/* Quote Card 3 */}
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all shadow-sm">
              <div className="space-y-2">
                <span className="text-2xl font-quote text-amber-400/60 block leading-none">“</span>
                <p className="font-quote italic text-sm sm:text-base text-[#f4efe6] leading-snug">
                  Civilization moves forward when the roads we build endure the passage of time without claiming human lives.
                </p>
              </div>
              <div className="pt-3 border-t border-[#242429] mt-3">
                <span className="font-syne font-bold text-[11px] text-amber-300 block">Urban Transit Ethos</span>
                <span className="text-[9px] text-[#8a8880] font-display">Global Infrastructure Forum</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE & PIPELINE ================= */}
      <section id="architecture" className="py-10 max-w-5xl mx-auto px-4 space-y-6">
        <div className="text-center max-w-md mx-auto space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[9px] font-display font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(217,119,6,0.15)]">
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
          <div className="p-3 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/30 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">STAGE 01</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px]">Media Ingestion & EXIF</h4>
            <p className="text-[#a29f99] text-[10px]">Extracts GPS metadata from EXIF tags or webcam stream telemetry.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/30 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">STAGE 02</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px]">YOLOv8 Neural Inference</h4>
            <p className="text-[#a29f99] text-[10px]">Trained on RDD2020 dataset for D00, D10, D20 cracks & D40 potholes.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/30 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">STAGE 03</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px]">Bokeh Spotlight Focus</h4>
            <p className="text-[#a29f99] text-[10px]">OpenCV Gaussian blur on healthy asphalt; glow borders on anomalies.</p>
          </div>
          <div className="p-3 rounded-lg bg-[#141418] border border-[#242429] hover:border-amber-400/30 transition-colors space-y-1">
            <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">STAGE 04</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-[11px]">ReportLab PDF & GIS</h4>
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
