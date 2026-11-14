import React, { useState } from 'react';
import {
  Menu,
  PanelLeft,
  ChevronDown,
  Share2,
  Sparkles,
  Camera,
  Check,
  Plus,
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewBuild: () => void;
  onOpenShare: () => void;
  onOpenScrapMode: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  activeBuildName?: string;
}

const MODELS = [
  { id: 'gemini-3.8-flash', name: 'Solder 3.8 Flash', tag: 'Fast hardware reasoning & full builds' },
  { id: 'gemini-3.5-flash-lite', name: 'Solder 3.5 Flash-Lite', tag: 'Instant self-healing firmware fixes' },
  { id: 'gemini-4-hydrogen', name: 'Solder 4 Hydrogen', tag: 'Deep hardware co-design & clearance' },
];

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNewBuild,
  onOpenShare,
  onOpenScrapMode,
  selectedModel,
  onSelectModel,
  activeBuildName,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <header className="sticky top-0 z-20 h-12 sm:h-14 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 flex items-center justify-between gap-3 text-zinc-100 select-none">
      {/* Left: Sidebar toggle & Model Dropdown */}
      <div className="flex items-center gap-2">
        {/* Mobile Hamburger / Desktop Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
        >
          <PanelLeft className="w-4 h-4 hidden md:block" />
          <Menu className="w-5 h-5 block md:hidden" />
        </button>

        {/* New Build Shortcut button (desktop when collapsed) */}
        {!isSidebarOpen && (
          <button
            onClick={onNewBuild}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold border border-zinc-700/80 transition"
            title="Start fresh build"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New</span>
          </button>
        )}

        {/* Model-Style Dropdown "Solder" (like ChatGPT model selector) */}
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-900 text-sm font-semibold text-zinc-100 transition border border-transparent hover:border-zinc-800"
          >
            <span className="font-bold tracking-tight">Solder</span>
            <span className="text-xs text-zinc-400 hidden sm:inline font-mono">
              3.8 Flash
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isModelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsModelDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  Select Engine
                </div>
                <div className="p-1 space-y-1">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-800 flex items-start justify-between gap-2 transition"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.id === 'gemini-3.8-flash' && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded-full font-mono">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          {m.tag}
                        </div>
                      </div>
                      {selectedModel === m.id && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Active Build Title (subtle) */}
      {activeBuildName && (
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 truncate max-w-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">{activeBuildName}</span>
        </div>
      )}

      {/* Right: Actions (Scrap Mode & Share) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenScrapMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition shadow-xs"
          title="Scan parts drawer"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Scrap Drawer</span>
        </button>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold transition shadow-xs"
          title="Share build link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
};
