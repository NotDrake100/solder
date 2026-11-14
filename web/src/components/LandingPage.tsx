import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SolderLogo } from './SolderLogo';

interface LandingPageProps {
  onTryIt: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTryIt }) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f5f5f5] flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Minimal Top Header (Small logo in nav is enough) */}
      <header className="w-full max-w-5xl mx-auto px-6 h-16 flex items-center justify-between border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <SolderLogo className="w-5 h-5 text-white" />
          <span className="font-medium text-[16px] tracking-tight text-white">
            Solder
          </span>
        </div>

        <button
          onClick={onTryIt}
          className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-[#e5e5e5] transition cursor-pointer"
        >
          Try it
        </button>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center py-14 sm:py-20">
        {/* Big Headline (QA-R3 #1: line 1 "Type an idea.", line 2 "Get a real build.", 64px desktop / 40px mobile) */}
        <h1 className="text-[40px] sm:text-[64px] font-semibold tracking-tight text-white leading-[1.08] max-w-[540px] mb-6">
          <span className="block">Type an idea.</span>
          <span className="block">Get a real build.</span>
        </h1>

        {/* Sub line (QA-R3 #2: plain non-repetitive explainer) */}
        <p className="text-base sm:text-lg text-[#999999] max-w-xl font-normal leading-relaxed mb-8">
          Describe a gadget or point your camera at your parts. Solder picks the parts,
          wires them, writes the firmware, tests it and designs a case that fits.
        </p>

        {/* Try It CTA */}
        <div className="mb-14">
          <button
            onClick={onTryIt}
            className="group px-7 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-[#e5e5e5] transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Try it</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 3-Step "How it works" (QA-R3 #3: 3 plain columns with thin top rule, no card backgrounds/borders) */}
        <div className="w-full pt-8 border-t border-[#262626]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div>
              <div className="font-mono text-xs text-[#666666] mb-2">01 Describe it</div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Type what you want, or show your parts to the camera.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="font-mono text-xs text-[#666666] mb-2">02 Agents build and check it</div>
              <p className="text-xs text-[#888888] leading-relaxed">
                They catch wiring mistakes and fix them before you see the result.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="font-mono text-xs text-[#666666] mb-2">03 Get your build</div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Parts list with prices, wiring, firmware and a 3D printable case.
              </p>
            </div>
          </div>
        </div>

        {/* Product Image (QA-R3 #5: finished build screenshot in rounded 1px #262626 frame) */}
        <div className="w-full mt-12 rounded-xl overflow-hidden border border-[#262626] shadow-2xl bg-[#111]">
          <img
            src="/landing-shot.png"
            alt="Solder finished build preview"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-[#666666] border-t border-[#1a1a1a]">
        <span>Solder</span>
        <span className="font-mono">v1.0</span>
      </footer>
    </div>
  );
};

export default LandingPage;