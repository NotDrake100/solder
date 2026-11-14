import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SolderLogo } from './SolderLogo';

interface LandingPageProps {
  onTryIt: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTryIt }) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f5f5f5] flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Minimal Top Header */}
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
      <main className="flex-1 max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center py-16 sm:py-24">
        {/* Cube Logo 06 Mark */}
        <div className="mb-6 p-3 rounded-2xl bg-[#141414] border border-[#262626] shadow-sm">
          <SolderLogo className="w-10 h-10 text-white" />
        </div>

        {/* Big Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white max-w-2xl leading-[1.15] mb-5">
          Type an idea. Get a build.
        </h1>

        {/* One Plain Line Explaining Solder */}
        <p className="text-base sm:text-lg text-[#999999] max-w-xl font-normal leading-relaxed mb-8">
          Type an idea or point your camera at parts, get a verified build:
          parts, wiring, firmware, 3D case.
        </p>

        {/* Try It CTA */}
        <div className="mb-20">
          <button
            onClick={onTryIt}
            className="group px-7 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-[#e5e5e5] transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Try it</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 3-Step "How it works" */}
        <div className="w-full pt-10 border-t border-[#1f1f1f]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {/* Step 1 */}
            <div className="p-5 rounded-xl bg-[#121212] border border-[#222222] flex flex-col justify-between">
              <div className="font-mono text-xs text-[#666666] mb-3">01</div>
              <div>
                <h3 className="font-medium text-white text-sm mb-1.5">
                  Describe or show
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Type what you want to make in plain English, or point your camera
                  at parts on your desk.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl bg-[#121212] border border-[#222222] flex flex-col justify-between">
              <div className="font-mono text-xs text-[#666666] mb-3">02</div>
              <div>
                <h3 className="font-medium text-white text-sm mb-1.5">
                  Agents build and verify
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Deterministic harness checks pin conflicts, voltage levels,
                  power budget, and 3D fit before outputting.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl bg-[#121212] border border-[#222222] flex flex-col justify-between">
              <div className="font-mono text-xs text-[#666666] mb-3">03</div>
              <div>
                <h3 className="font-medium text-white text-sm mb-1.5">
                  Get your build
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  A snap-fit 3D printable case, complete wiring netlist, tested
                  firmware, and one-click BOM cart.
                </p>
              </div>
            </div>
          </div>
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
