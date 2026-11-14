import React from 'react';
import { SHOWCASE_CARDS } from '../data/mockShowcases';
import { Layers, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface ShowcaseCardsProps {
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const ShowcaseCards: React.FC<ShowcaseCardsProps> = ({
  selectedId,
  onSelect,
  isLoading,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Showcase Builds
          </h2>
        </div>
        <span className="text-xs text-zinc-500">
          Precomputed • Zero latency • Ready to simulate
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {SHOWCASE_CARDS.map((item) => {
          const isSelected = selectedId.toLowerCase() === item.id.toLowerCase();
          return (
            <button
              key={item.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelect(item.id)}
              className={`group text-left p-4 rounded-2xl bg-white border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-zinc-900 ring-2 ring-zinc-900/10 shadow-sm'
                  : 'border-zinc-200/80 hover:border-zinc-300 hover:shadow-sm'
              }`}
            >
              <div className="w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight text-zinc-900 group-hover:text-black">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.board.includes('ESP32')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-sky-50 text-sky-700 border border-sky-200/60'
                      }`}
                    >
                      {item.board}
                    </span>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0" />
                  )}
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                  {item.tagline}
                </p>
              </div>

              <div className="w-full pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">
                  {item.priceEstimate}
                </span>
                <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                  <Layers className="w-3 h-3 text-zinc-400" />
                  {item.partsCount} parts
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
