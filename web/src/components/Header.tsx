import React from 'react';
import { Cpu, Sparkles, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-900">Solder</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-normal -mt-0.5">
              Type an idea. Get a build.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gemini 3.8 Flash • Hardware Engine
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Antigravity</span> Swarm
          </div>
        </div>
      </div>
    </header>
  );
};
