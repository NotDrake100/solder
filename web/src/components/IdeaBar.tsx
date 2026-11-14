import React, { useState } from 'react';
import { Sparkles, ArrowRight, Camera, Wand2, Loader2 } from 'lucide-react';

interface IdeaBarProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const CHANGE_CHIPS = [
  'solar powered',
  'smaller',
  'add WiFi',
  'battery powered',
  'add buzzer alarm',
  'OLED telemetry display',
];

export const IdeaBar: React.FC<IdeaBarProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  const handleChipClick = (chip: string) => {
    if (isLoading) return;
    if (!prompt.trim()) {
      setPrompt(chip);
      onSubmit(chip);
    } else {
      const updated = `${prompt.trim()}, ${chip}`;
      setPrompt(updated);
      onSubmit(updated);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white rounded-2xl border border-zinc-200/90 shadow-sm focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/5 transition-all p-1.5 sm:p-2">
          <div className="pl-3 sm:pl-4 text-zinc-400">
            <Sparkles className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Type any hardware idea (e.g. Plant waterer with soil moisture probe and pump)..."
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 sm:gap-2 pr-1">
            <button
              type="button"
              title="Scrap Mode: Snap parts drawer photo"
              onClick={() => {
                const samplePrompt = "Scrap mode: build an automated nightlight using parts from drawer";
                setPrompt(samplePrompt);
                onSubmit(samplePrompt);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
            >
              <Camera className="w-3.5 h-3.5 text-zinc-500" />
              <span>Scrap photo</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white text-sm font-medium shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                  <span className="hidden sm:inline">Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Build</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Change-it chips */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-zinc-600 font-medium whitespace-nowrap flex items-center gap-1 pl-1">
          <Wand2 className="w-3.5 h-3.5 text-zinc-600" />
          Change-it:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {CHANGE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() => handleChipClick(chip)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 transition-all text-xs font-normal disabled:opacity-50"
            >
              +{chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
