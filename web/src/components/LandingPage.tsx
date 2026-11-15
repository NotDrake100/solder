import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SolderLogo } from './SolderLogo';
import { ProductThumbnail } from './ProductThumbnails';

const SHOWCASE_PRODUCTS = [
  { id: 'pocket-ai', label: 'Pi pocket AI assistant' },
  { id: 'sip', label: 'Plant monitor' },
  { id: 'smart-lamp', label: 'Smart lamp' },
  { id: 'weather-station', label: 'Weather station' },
  { id: 'robot-car', label: 'Robot car' },
  { id: 'hasp', label: 'Doorbell' },
  { id: 'desk-fan', label: 'Desk fan' },
  { id: 'macro-pad', label: 'Macro keypad' },
];

interface LandingPageProps {
  onTryIt: (buildId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTryIt }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f5f5f5] flex flex-col justify-between selection:bg-white selection:text-black antialiased">
      {/* 1. STICKY SLIM NAV */}
      <nav className="sticky top-0 z-30 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 hover:opacity-80 transition cursor-pointer"
          >
            <SolderLogo className="w-4 h-4 text-white" />
            <span className="font-medium text-[15px] tracking-tight text-white">
              Solder
            </span>
          </a>

          <button
            onClick={() => onTryIt()}
            className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e5e5e5] transition cursor-pointer"
          >
            Try it
          </button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-6 flex flex-col items-center">
        {/* HERO SECTION (120px desktop, 72px mobile) */}
        <section className="w-full flex flex-col items-center text-center pt-14 pb-16 sm:pt-24 sm:pb-28">
          <h1 className="text-[40px] sm:text-[64px] font-semibold tracking-tight text-white leading-[1.08] max-w-[620px] mb-6">
            <span className="block">Type an idea.</span>
            <span className="block">Get a real build.</span>
          </h1>

          <p className="text-base sm:text-[17px] text-[#a3a3a3] max-w-xl font-normal leading-relaxed mb-8">
            Describe a gadget or point your camera at your parts. Solder picks the parts,
            wires them, writes the firmware, tests it and designs a case that fits.
          </p>

          <button
            onClick={() => onTryIt()}
            className="group px-7 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-[#e5e5e5] transition flex items-center gap-2 cursor-pointer shadow-sm mb-12"
          >
            <span>Try it</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* HERO DEMO VIDEO (reserved 16:9 aspect-video from first paint, no CLS) */}
          <div className="w-full max-w-[1100px] aspect-video relative rounded-2xl overflow-hidden border border-[#262626] bg-[#121212] shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster="/demo-poster.jpg"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            >
              <source src="/demo-loop.mp4" type="video/mp4" />
              <source src="/demo-loop.webm" type="video/webm" />
              <img
                src="/demo-poster.jpg"
                alt="Solder finished build preview"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                loading="lazy"
              />
            </video>
          </div>
        </section>

        {/* SECTION 2: SHOWCASE GALLERY (8 visual cards, NO text inside cards) */}
        <section className="w-full py-16 sm:py-24 border-t border-[#1f1f1f]">
          <div className="mb-10 text-left">
            <h2 className="text-2xl sm:text-[36px] font-semibold tracking-tight text-white">
              Featured builds
            </h2>
            <p className="text-sm sm:text-base text-[#a3a3a3] mt-2">
              Every build is verified before display: parts, wiring, firmware, and custom 3D enclosure.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {SHOWCASE_PRODUCTS.map((product, index) => (
              <a
                key={product.id}
                href={`/b/${product.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onTryIt(product.id);
                }}
                aria-label={product.label}
                title={product.label}
                className="group relative p-2 sm:p-3 rounded-xl border border-[#262626] bg-[#121212] hover:border-[#555] hover:-translate-y-1 card-hover-gpu transform-gpu cursor-pointer flex items-center justify-center aspect-[4/3] overflow-hidden"
              >
                <div
                  style={{
                    animationDelay: `${index * 50}ms`,
                    opacity: 0,
                  }}
                  className="w-full h-full flex items-center justify-center animate-gallery-entrance"
                >
                  <ProductThumbnail
                    id={product.id}
                    className="w-full h-full object-contain transform-gpu transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* SECTION 3: CAMERA MODE */}
        <section className="w-full py-16 sm:py-24 border-t border-[#1f1f1f]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Copy */}
            <div className="text-left space-y-4">
              <h2 className="text-2xl sm:text-[36px] font-semibold tracking-tight text-white leading-tight">
                Show it what you have.
              </h2>
              <p className="text-base sm:text-[17px] text-[#a3a3a3] leading-relaxed">
                Point your phone at your parts and Solder labels each one, then builds with what you own.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onTryIt()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#d4d4d4] transition cursor-pointer"
                >
                  <span>Open camera mode</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Camera still (replacing mock phone) with detected parts chip kept inside its section */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-[480px] rounded-2xl overflow-hidden border border-[#262626] bg-[#121212] shadow-2xl relative">
                <img
                  src="/camera-still.png"
                  alt="Live camera scan still"
                  className="w-full h-auto object-cover block rounded-2xl"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 px-3 py-1.5 rounded-xl bg-black/80 border border-[#333] text-center text-xs font-mono text-white backdrop-blur-md shadow-lg pointer-events-none">
                  2 parts detected · Ready to build
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: HARNESS */}
        <section className="w-full py-16 sm:py-24 border-t border-[#1f1f1f]">
          <div className="mb-10 text-left">
            <h2 className="text-2xl sm:text-[36px] font-semibold tracking-tight text-white">
              Checked before you see it.
            </h2>
            <p className="text-sm sm:text-base text-[#a3a3a3] mt-2">
              Every build passes a deterministic 6-stage hardware harness before presenting to you.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-[#262626] bg-[#121212] p-6 sm:p-8 space-y-4 font-mono text-xs">
            {/* Check 1 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Pin conflicts</span>
                <span className="text-[#888] font-sans text-xs">Audits GPIO allocations and shared buses for collisions.</span>
              </div>
            </div>

            {/* Check 2 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Power budget</span>
                <span className="text-[#888] font-sans text-xs">Validates current draw against supply headroom.</span>
              </div>
            </div>

            {/* Check 3 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Voltage levels</span>
                <span className="text-[#888] font-sans text-xs">Matches 3.3V and 5V logic thresholds across ICs.</span>
              </div>
            </div>

            {/* Check 4 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Compile</span>
                <span className="text-[#888] font-sans text-xs">Compiles sketch with real AVR-GCC or Python syntax linter.</span>
              </div>
            </div>

            {/* Check 5 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Simulate</span>
                <span className="text-[#888] font-sans text-xs">Emulates firmware on virtual core (Arduino) or verifies userspace.</span>
              </div>
            </div>

            {/* Check 6 */}
            <div className="flex items-start gap-3 py-2 border-b border-[#202020]">
              <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-1">
                <span className="font-medium text-white">Fit check</span>
                <span className="text-[#888] font-sans text-xs">Verifies 3D spatial clearance inside the parametric case.</span>
              </div>
            </div>

            {/* Honest statement */}
            <div className="pt-4 text-[#888] font-sans text-xs sm:text-sm leading-relaxed">
              If a check fails, an agent fixes it and the checks run again. If a check can't run, it says skipped. It never fakes a pass.
            </div>
          </div>
        </section>
      </main>

      {/* 5. MINIMAL FOOTER */}
      <footer className="w-full border-t border-[#1a1a1a] bg-[#080808] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666]">
          <div>
            Built with Gemini + Antigravity
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/NotDrake100/solder"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
            <span>© Solder</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
