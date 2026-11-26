import React from 'react';
import { 
  ArrowRight, Sparkles, Camera, Eye, Droplet, ShieldCheck, 
  MapPin, FileText, Quote
} from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#f4efe6] font-sans selection:bg-[#f5ebe1] selection:text-[#0c0c0e] flex flex-col">
      
      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0c0c0e]/85 border-b border-[#242429]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#f5ebe1] text-[#0c0c0e] flex items-center justify-center font-syne font-extrabold text-xs shadow-[0_0_15px_rgba(245,235,225,0.2)]">
              SL
            </div>
            <div>
              <span className="font-syne font-extrabold text-sm tracking-tight text-[#f4efe6] block leading-none">
                StreetLens
              </span>
              <span className="text-[9px] text-[#f5ebe1]/75 font-display font-medium tracking-wider uppercase block">
                Road AI Vision
              </span>
            </div>
          </div>

          {/* CTA Action */}
          <button
            onClick={onGetStarted}
            className="px-4 py-1.5 rounded-lg bg-[#f5ebe1] hover:bg-white text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_15px_rgba(245,235,225,0.2)] transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.02]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-10 pb-12 md:pt-14 md:pb-16 overflow-hidden bg-grid-pattern border-b border-[#242429]">
        {/* Ambient Subtle Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[200px] bg-[#f5ebe1]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-5 text-center relative z-10 flex flex-col items-center">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#f5ebe1]/30 bg-[#f5ebe1]/10 text-[#f5ebe1] text-[10px] font-display font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3 h-3" /> Next-Generation Urban Road Safety AI
          </div>

          {/* Calibrated headline */}
          <h1 className="text-2xl sm:text-4xl md:text-[44px] font-syne font-extrabold text-[#f4efe6] tracking-tight leading-[1.15] max-w-2xl mb-3">
            Safeguarding Urban Transit Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5ebe1] via-[#ded4c7] to-[#baa897] drop-shadow-[0_0_20px_rgba(245,235,225,0.25)]">Autonomous Vision</span>
          </h1>

          {/* Editorial quote kicker */}
          <p className="font-quote italic text-base sm:text-lg text-[#f5ebe1]/85 max-w-xl mb-4 leading-snug">
            "Vision is not merely seeing what lies in front of us, but safeguarding every meter of the road ahead."
          </p>

          <p className="text-xs sm:text-[13px] text-[#a29f99] max-w-lg mb-6 leading-relaxed font-sans">
            StreetLens pairs fine-tuned YOLOv8 neural inference with optical Bokeh spotlighting, waterlogged puddle detection, and multi-vehicle risk modeling to protect pedestrians, two-wheelers, and motorists.
          </p>

          {/* Primary Action Button */}
          <div className="mb-8">
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-lg bg-[#f5ebe1] hover:bg-white text-[#0c0c0e] font-syne font-bold text-xs shadow-[0_0_20px_rgba(245,235,225,0.25)] transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Static Pothole Image */}
          <div className="w-full max-w-lg rounded-xl bg-[#141418] border border-[#2e2e36] p-2 shadow-xl">
            <div className="relative rounded-lg overflow-hidden aspect-[16/9] max-h-56 bg-black">
              <img 
                src="/samples/sample1_waterlogged.jpg" 
                alt="Road Surface Pothole" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-2 pt-2 pb-0.5 flex items-center justify-between text-[11px] text-[#a29f99]">
              <span className="font-mono text-[#f5ebe1] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5ebe1]"></span>
                Road Surface Degradation
              </span>
              <span className="text-[10px] text-[#8a8880]">Pothole & Cavity Inspection</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="py-14 md:py-16 max-w-6xl mx-auto px-5 space-y-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5ebe1]/10 text-[#f5ebe1] text-[10px] font-display font-semibold uppercase tracking-wider">
            Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-syne font-extrabold text-[#f4efe6] tracking-tight">
            Engineered for Modern Road Audits
          </h2>
          <p className="text-xs text-[#a29f99] font-sans">
            Every module in StreetLens addresses real-world hazards faced by municipal engineers, commuters, and field inspectors.
          </p>
        </div>

        {/* 6 Feature Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Feature 1: Real-Time Live Dashcam HUD */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Live Dashcam Stream (HUD)
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              Mount your phone or webcam on any vehicle dashboard. StreetLens executes real-time frame streaming with sub-100ms inference, corner-bracket tracking, and instant snapshot auditing.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-[#f5ebe1]">
              <span>Real-time bounding</span> • <span>FPS HUD</span>
            </div>
          </div>

          {/* Feature 2: Optical Bokeh Spotlight */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5ebe1]/10 border border-[#f5ebe1]/30 flex items-center justify-center text-[#f5ebe1]">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Optical Bokeh Spotlight Focus
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              Eliminates visual fatigue for road inspectors. Healthy asphalt is softly blurred with a Gaussian kernel while potholes and surface fractures stay tack-sharp with glow badges.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-[#f5ebe1]">
              <span>Interactive comparison slider</span>
            </div>
          </div>

          {/* Feature 3: Waterlogged Cavity Detection */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplet className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Waterlogged Cavity Alert
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              Standing water conceals cavity depth. StreetLens performs adaptive color segmentation to detect submerged potholes, warning against severe hydroplaning and skid hazards.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
              <span>Monsoon road defense</span>
            </div>
          </div>

          {/* Feature 4: Multi-User Vulnerability Scoring */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Multi-User Safety Index
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              A pothole is a minor bump for a truck, but potentially fatal for a 2-wheeler. StreetLens computes differentiated safety scores for motorcyclists, 4-wheelers, and pedestrians.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
              <span>Tri-modal safety breakdown</span>
            </div>
          </div>

          {/* Feature 5: Geospatial Hazard Map */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#f5ebe1]/10 border border-[#f5ebe1]/30 flex items-center justify-center text-[#f5ebe1]">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Geospatial Hazard Map
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              Every captured scan is geo-referenced with EXIF GPS or manual coordinates. Interactive CartoDB dark-matter map renders severity-coded pulsing hazard pins across the city.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-[#f5ebe1]">
              <span>OpenStreetMap & Leaflet</span>
            </div>
          </div>

          {/* Feature 6: Official Engineering PDF Dossiers */}
          <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] hover:border-[#f5ebe1]/30 transition-all shadow-md group space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-syne font-bold text-[#f4efe6] text-sm">
              Official PDF & CSV Dossiers
            </h3>
            <p className="text-xs text-[#a29f99] leading-relaxed">
              One-click generation of formal municipal inspection reports with ReportLab. Includes embedded anomaly spotlight photos, defect dimensions, priority indices, and raw CSVs.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-purple-400">
              <span>Auditable municipal ledger</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= EDITORIAL QUOTES SECTION ================= */}
      <section id="quotes" className="py-14 bg-[#101014] border-y border-[#242429]">
        <div className="max-w-6xl mx-auto px-5 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-display font-semibold text-[#f5ebe1] uppercase tracking-wider mb-1">
                <Quote className="w-3.5 h-3.5 text-[#f5ebe1]" /> Guiding Principles
              </div>
              <h2 className="text-xl sm:text-2xl font-syne font-extrabold text-[#f4efe6]">
                Infrastructure & Human Dignity
              </h2>
            </div>
            <p className="text-[11px] text-[#a29f99] max-w-sm font-sans">
              Words that guide the mission of StreetLens — elevating road monitoring from mundane maintenance to life-saving civic responsibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Quote Card 1 */}
            <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-md">
              <div className="space-y-2.5">
                <span className="text-2xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-base sm:text-lg text-[#f4efe6] leading-snug">
                  A developed city is not one where the poor have cars, but where public roads are dignified and safe for every citizen.
                </p>
              </div>
              <div className="pt-4 border-t border-[#242429] mt-4">
                <span className="font-syne font-bold text-xs text-[#f5ebe1] block">Enrique Peñalosa</span>
                <span className="text-[10px] text-[#8a8880] font-display">Urbanist & Former Mayor of Bogotá</span>
              </div>
            </div>

            {/* Quote Card 2 */}
            <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-md">
              <div className="space-y-2.5">
                <span className="text-2xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-base sm:text-lg text-[#f4efe6] leading-snug">
                  Vision is the art of seeing what is invisible to others — uncovering hidden fissures before they become catastrophe.
                </p>
              </div>
              <div className="pt-4 border-t border-[#242429] mt-4">
                <span className="font-syne font-bold text-xs text-[#f5ebe1] block">Jonathan Swift / StreetLens</span>
                <span className="text-[10px] text-[#8a8880] font-display">Foundational Design Principle</span>
              </div>
            </div>

            {/* Quote Card 3 */}
            <div className="p-5 rounded-xl bg-[#141418] border border-[#242429] flex flex-col justify-between hover:border-[#f5ebe1]/40 transition-all shadow-md">
              <div className="space-y-2.5">
                <span className="text-2xl font-quote text-[#f5ebe1]/40 block leading-none">“</span>
                <p className="font-quote italic text-base sm:text-lg text-[#f4efe6] leading-snug">
                  Civilization moves forward when the roads we build endure the passage of time without claiming human lives.
                </p>
              </div>
              <div className="pt-4 border-t border-[#242429] mt-4">
                <span className="font-syne font-bold text-xs text-[#f5ebe1] block">Urban Transit Ethos</span>
                <span className="text-[10px] text-[#8a8880] font-display">Global Infrastructure Forum</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURE & PIPELINE ================= */}
      <section id="architecture" className="py-14 max-w-6xl mx-auto px-5 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5ebe1]/10 text-[#f5ebe1] text-[10px] font-display font-semibold uppercase tracking-wider">
            Technical Stack
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-extrabold text-[#f4efe6]">
            End-to-End Deep Learning Pipeline
          </h2>
          <p className="text-xs text-[#a29f99] font-sans">
            A modular microservice architecture engineered for high throughput and zero latency overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] space-y-1.5">
            <span className="text-[9px] font-mono text-[#f5ebe1]">STAGE 01</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-xs">Media Ingestion & EXIF</h4>
            <p className="text-[#a29f99] text-[11px]">Extracts GPS metadata from EXIF tags or webcam stream telemetry.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] space-y-1.5">
            <span className="text-[9px] font-mono text-[#f5ebe1]">STAGE 02</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-xs">YOLOv8 Neural Inference</h4>
            <p className="text-[#a29f99] text-[11px]">Trained on RDD2020 dataset for D00, D10, D20 cracks & D40 potholes.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] space-y-1.5">
            <span className="text-[9px] font-mono text-[#f5ebe1]">STAGE 03</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-xs">Bokeh Spotlight Focus</h4>
            <p className="text-[#a29f99] text-[11px]">OpenCV Gaussian blur on healthy asphalt; glow borders on anomalies.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141418] border border-[#242429] space-y-1.5">
            <span className="text-[9px] font-mono text-[#f5ebe1]">STAGE 04</span>
            <h4 className="font-syne font-bold text-[#f4efe6] text-xs">ReportLab PDF & GIS</h4>
            <p className="text-[#a29f99] text-[11px]">Auto-generates official engineering audit PDF dossiers and CSV logs.</p>
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