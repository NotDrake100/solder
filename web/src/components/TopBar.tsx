import React, { useState } from 'react';
import {
  Menu,
  PanelLeft,
  ChevronDown,
  Share2,
  Check,
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
    <header className="h-[48px] shrink-0 bg-[#181818] border-b border-[#2a2a2a] px-3 sm:px-4 flex items-center justify-between select-none z-20">
      {/* Left: Mobile hamburger or collapsed sidebar toggle + Model dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-md text-[#777] hover:text-[#f5f5f5] hover:bg-[#212121] transition ${
            isSidebarOpen ? 'md:hidden' : 'block'
          }`}
          title="Open sidebar"
        >
          <Menu className="w-5 h-5 block md:hidden" />
          <PanelLeft className="w-4 h-4 hidden md:block" />
        </button>

        {/* Model dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#212121] text-[#f5f5f5] transition group"
          >
            <span className="text-[15px] font-medium tracking-tight">
              Solder
            </span>
            <span className="text-[11px] font-mono text-[#777] bg-[#212121] px-1.5 py-0.5 rounded border border-[#2a2a2a]">
              {currentModel.name.replace('Solder ', '')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#777] group-hover:text-[#a3a3a3] transition" />
          </button>

          {isModelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsModelDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[#212121] border border-[#2a2a2a] shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-medium text-[#777] uppercase tracking-wider border-b border-[#2a2a2a]">
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
                      className="w-full text-left p-2.5 rounded-lg hover:bg-[#262626] flex items-start justify-between gap-2 transition"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#f5f5f5] flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.id === 'gemini-3.8-flash' && (
                            <span className="text-[10px] text-[#777] bg-[#181818] border border-[#2a2a2a] px-1.5 py-0.2 rounded font-mono">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#777] mt-0.5 leading-snug">
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

      {/* Right: Share Button */}
      <button
        onClick={onOpenShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#a3a3a3] hover:text-[#f5f5f5] bg-[#212121] hover:bg-[#262626] border border-[#2a2a2a] transition"
        title="Share workspace link"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </button>
    </header>
  );
};
