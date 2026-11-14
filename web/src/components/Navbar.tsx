import React from 'react';
import { Sparkles, Camera, Share2, Layers, Cpu } from 'lucide-react';
import { SHOWCASE_PILLS } from '../data/showcases';

interface NavbarProps {
  activeBuildId: string;
  onSelectShowcase: (id: string) => void;
  onOpenScrapMode: () => void;
  onOpenShare: () => void;
  ownedCount?: number;
  savingsInr?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeBuildId,
  onSelectShowcase,
  onOpenScrapMode,
  onOpenShare,
  ownedCount = 0,
  savingsInr = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <span>S</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-zinc-900 tracking-tight text-lg">solder</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium ml-1">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Type an idea. Get a build.</p>
          </div>
        </div>

        {/* Showcase Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-zinc-50/80 p-1 rounded-full border border-zinc-200/60 shadow-inner">
          <span className="text-[11px] font-medium text-zinc-400 px-2.5">Showcase:</span>
          {SHOWCASE_PILLS.map((pill) => {
            const isActive = activeBuildId === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onSelectShowcase(pill.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/80 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {pill.name}
                  <span
                    className={`text-[10px] px-1 rounded ${
                      isActive ? 'bg-zinc-100 text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {pill.board}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Scrap Mode, Share */}
        <div className="flex items-center gap-2">
          {/* Scrap Mode Photo Button */}
          <button
            onClick={onOpenScrapMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              ownedCount > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${ownedCount > 0 ? 'text-emerald-600' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline">Scrap Mode</span>
            {ownedCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
                Save ₹{savingsInr}
              </span>
            )}
          </button>

          {/* Share */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            title="Share or remix permalink"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Mobile pills bar */}
      <div className="flex md:hidden items-center gap-1 px-4 py-2 bg-zinc-50/60 border-t border-zinc-100 overflow-x-auto">
        <span className="text-[10px] font-medium text-zinc-400 shrink-0">Showcase:</span>
        {SHOWCASE_PILLS.map((pill) => {
          const isActive = activeBuildId === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => onSelectShowcase(pill.id)}
              className={`px-3 py-1 rounded-full text-xs shrink-0 font-medium transition-all ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {pill.name}
            </button>
          );
        })}
      </div>
    </header>
  );
};
