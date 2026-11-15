import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SolderLogo } from './SolderLogo';

interface LandingPageProps {
  onTryIt: (buildId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTryIt }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [cameraStillFailed, setCameraStillFailed] = useState(false);

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

          {/* HERO DEMO VIDEO (max-width 1100px, 16px radius, 1px #262626 border) */}
          <div className="w-full max-w-[1100px] rounded-2xl overflow-hidden border border-[#262626] bg-[#121212] shadow-2xl relative">
            {!videoFailed ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/demo-poster.jpg"
                onError={() => setVideoFailed(true)}
                className="w-full h-auto block rounded-2xl"
              >
                <source src="/demo-loop.mp4" type="video/mp4" />
                <source src="/demo-loop.webm" type="video/webm" />
                <img
                  src="/landing-shot.png"
                  alt="Solder finished build preview"
                  className="w-full h-auto object-cover rounded-2xl"
                  loading="lazy"
                />
              </video>
            ) : (
              <img
                src="/landing-shot.png"
                alt="Solder finished build preview"
                className="w-full h-auto object-cover rounded-2xl"
                loading="lazy"
              />
            )}
          </div>
        </section>

        {/* SECTION 2: FEATURED BUILDS (3 plain cards, 1px border, no icons) */}
        <section className="w-full py-16 sm:py-24 border-t border-[#1f1f1f]">
          <div className="mb-10 text-left">
            <h2 className="text-2xl sm:text-[36px] font-semibold tracking-tight text-white">
              Featured builds
            </h2>
            <p className="text-sm sm:text-base text-[#a3a3a3] mt-2">
              Every build is verified before display: parts, wiring, firmware, and custom 3D enclosure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: AI Pocket Assistant */}
            <div
              onClick={() => onTryIt('pocket-ai')}
              className="group p-6 rounded-xl border border-[#262626] bg-[#121212] hover:border-[#444] transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider mb-2">
                  Raspberry Pi
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-white transition mb-2">
                  AI pocket assistant
                </h3>
                <p className="text-sm text-[#8e8e8e] leading-relaxed mb-6">
                  Linux voice prototype with 24-bit I2S MEMS mic, dynamic 3W speaker, and dual-mode Python AI client.
                </p>
              </div>
              <div className="pt-4 border-t border-[#202020] text-xs font-mono text-[#a3a3a3]">
                9 parts · 5/5 checks · Rs 1,955
              </div>
            </div>

            {/* Card 2: Plant Waterer */}
            <div
              onClick={() => onTryIt('sip')}
              className="group p-6 rounded-xl border border-[#262626] bg-[#121212] hover:border-[#444] transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider mb-2">
                  Arduino Uno
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-white transition mb-2">
                  Plant waterer
                </h3>
                <p className="text-sm text-[#8e8e8e] leading-relaxed mb-6">
                  Corrosion-proof capacitive probe measuring soil moisture, driving a 5V galvanically isolated relay.
                </p>
              </div>
              <div className="pt-4 border-t border-[#202020] text-xs font-mono text-[#a3a3a3]">
                4 parts · 6/6 checks · Rs 890
              </div>
            </div>

            {/* Card 3: Night Light */}
            <div
              onClick={() => onTryIt('wisp')}
              className="group p-6 rounded-xl border border-[#262626] bg-[#121212] hover:border-[#444] transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider mb-2">
                  Arduino Uno
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-white transition mb-2">
                  Night light
                </h3>
                <p className="text-sm text-[#8e8e8e] leading-relaxed mb-6">
                  PIR wide-angle motion detection and calibrated ambient light sensor with diffused warm illumination.
                </p>
              </div>
              <div className="pt-4 border-t border-[#202020] text-xs font-mono text-[#a3a3a3]">
                4 parts · 6/6 checks · Rs 675
              </div>
            </div>
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

            {/* Right: Phone Frame with live scan still */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-[340px] aspect-[9/16] rounded-[36px] p-3 border border-[#262626] bg-[#0d0d0d] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                {!cameraStillFailed ? (
                  <img
                    src="/camera-still.png"
                    alt="Live camera scan still"
                    onError={() => setCameraStillFailed(true)}
                    className="w-full h-full object-cover rounded-[28px]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-[28px] bg-[#141414] p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="text-[11px] font-mono text-[#888] flex items-center justify-between">
                      <span>SCANNING</span>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>

                    {/* Mock markers matching marker-style-ref */}
                    <div className="relative w-full h-48 my-auto">
                      {/* Marker 1: Arduino Uno */}
                      <div className="absolute top-4 left-6 flex items-center gap-2">
                        <div className="w-9 h-9 rounded-[10px] border-2 border-white bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-[9px] text-white select-none">▲</span>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-white text-black font-sans text-[11px] font-medium shadow-sm">
                          Arduino Uno 94%
                        </div>
                      </div>

                      {/* Marker 2: 5V Relay */}
                      <div className="absolute bottom-6 right-4 flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded bg-white text-black font-sans text-[11px] font-medium shadow-sm">
                          5V Relay 91%
                        </div>
                        <div className="w-9 h-9 rounded-[10px] border-2 border-white bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-[9px] text-white select-none">▲</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/80 border border-[#2a2a2a] text-center text-xs font-mono text-white">
                      2 parts detected · Ready to build
                    </div>
                  </div>
                )}
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
