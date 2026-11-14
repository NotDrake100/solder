import React, { useState } from 'react';
import {
  Menu,
  PanelLeft,
  ChevronDown,
  Share2,
  Check,
  Zap,
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenShare: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const MODELS = [
  { id: 'gemini-3.8-flash', name: 'Solder 3.8 Flash', tag: 'Fast hardware reasoning & full builds' },
  { id: 'gemini-3.5-flash-lite', name: 'Solder 3.5 Flash-Lite', tag: 'Instant self-healing firmware fixes' },
  { id: 'gemini-4-hydrogen', name: 'Solder 4 Hydrogen', tag: 'Deep hardware co-design & clearance' },
];

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onOpenShare,
  selectedModel,
  onSelectModel,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <header className="h-[48px] shrink-0 bg-[#1f1e1c] border-b border-[#383430]/60 px-3 sm:px-4 flex items-center justify-between select-none z-20">
      {/* Left: Mobile hamburger or collapsed sidebar toggle + Model dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle icon button (visible on mobile, or on desktop when sidebar collapsed) */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg text-stone-400 hover:text-white hover:bg-[#262422] transition ${
            isSidebarOpen ? 'md:hidden' : 'block'
          }`}
          title="Open sidebar"
        >
          <Menu className="w-5 h-5 block md:hidden" />
          <PanelLeft className="w-4 h-4 hidden md:block" />
        </button>

        {/* Model-style dropdown: "Solder" + small chevron (like model picker) */}
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#262422] text-stone-200 transition group"
          >
            <span className="text-[16px] font-semibold tracking-tight text-stone-100">
              Solder
            </span>
            <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
              {currentModel.name.replace('Solder ', '')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-200 transition" />
          </button>

          {isModelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsModelDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-[#201e1c] border border-[#383430] shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-medium text-stone-400 uppercase tracking-wider border-b border-[#383430]">
                  Model Architecture
                </div>
                <div className="p-1 space-y-1">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#282623] flex items-start justify-between gap-2 transition"
                    >
                      <div>
                        <div className="text-sm font-medium text-stone-100 flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.id === 'gemini-3.8-flash' && (
                            <span className="text-[10px] text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.2 rounded font-mono">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5 leading-snug">
                          {m.tag}
                        </div>
                      </div>
                      {selectedModel === m.id && (
                        <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Share Button */}
      <button
        onClick={onOpenShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-[#262422] hover:bg-[#2c2825] border border-[#383430] transition"
        title="Share workspace link"
      >
        <Share2 className="w-3.5 h-3.5 text-orange-400" />
        <span>Share</span>
      </button>
    </header>
  );
};
