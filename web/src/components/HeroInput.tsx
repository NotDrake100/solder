import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, X, Paperclip } from 'lucide-react';
import { QUICK_CHIPS } from '../data/showcases';

interface HeroInputProps {
  onSubmit: (prompt: string, selectedChips: string[]) => void;
  isLoading: boolean;
  scrapDrawerSummary?: string | null;
  onClearScrap?: () => void;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  onSubmit,
  isLoading,
  scrapDrawerSummary,
  onClearScrap,
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeChips, setActiveChips] = useState<string[]>([]);

  const handleChipClick = (chip: string) => {
    if (activeChips.includes(chip)) {
      setActiveChips(activeChips.filter((c) => c !== chip));
    } else {
      setActiveChips([...activeChips, chip]);
      // If prompt is empty, suggest prompt with chip
      if (!prompt.trim()) {
        setPrompt(`A smart maker project with ${chip}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && activeChips.length === 0) return;
    onSubmit(prompt, activeChips);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-4">
      {/* Hero Headline */}
      <div className="text-center mb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          Type an idea. <span className="text-zinc-400">Get a build.</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto">
          AI-designed schematics, 3D enclosures, verified firmware, and local INR maker kits.
        </p>
      </div>

      {/* Scrap Drawer Active Notification Tag */}
      {scrapDrawerSummary && (
        <div className="mb-3 flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold">Parts Drawer Scanned:</span>
            <span className="truncate text-emerald-700">{scrapDrawerSummary}</span>
          </div>
          {onClearScrap && (
            <button
              onClick={onClearScrap}
              className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700 transition"
              title="Clear attached parts"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Search / Idea Input Container */}
      <form
        onSubmit={handleSubmit}
        className="relative group bg-white rounded-2xl border border-zinc-200/90 shadow-soft hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all"
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <Sparkles className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors shrink-0" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. A desk plant waterer with moisture telemetry, or a fingerprint vault..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && activeChips.length === 0)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs sm:text-sm font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 transition-all shrink-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Build</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />
              </>
            )}
          </button>
        </div>

        {/* Quick Change-it Chips */}
        <div className="flex items-center gap-1.5 px-4 pb-3 pt-1 border-t border-zinc-100 overflow-x-auto">
          <span className="text-[11px] font-medium text-zinc-400 shrink-0">Modify:</span>
          {QUICK_CHIPS.map((chip) => {
            const isSelected = activeChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-xs'
                    : 'bg-zinc-50 border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                +{chip}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};
