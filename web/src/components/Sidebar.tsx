import React from 'react';
import {
  Plus,
  Box,
  Cpu,
  Layers,
  Wrench,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import type { SolderBuild } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewBuild: () => void;
  builds: SolderBuild[];
  activeBuildId: string;
  onSelectBuild: (buildId: string) => void;
  onOpenScrapMode: () => void;
  ownedCount: number;
  savingsInr: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewBuild,
  builds,
  activeBuildId,
  onSelectBuild,
  onOpenScrapMode,
  ownedCount,
  savingsInr,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 select-none">
      {/* Top Header & New Build */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            onNewBuild();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-750 text-zinc-100 text-xs font-semibold border border-zinc-700/80 transition-all shadow-xs active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>New build</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded-md border border-zinc-800">
            ⌘K
          </span>
        </button>

        {/* Toggle / Close button */}
        {isMobileDrawer ? (
          <button
            onClick={onCloseMobileDrawer}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Builds History List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {/* Recents Section */}
        <div>
          <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400">
            Past Builds
          </div>
          <div className="mt-1 space-y-0.5">
            {builds.map((b) => {
              const isActive = b.id === activeBuildId;
              const price = b.parts?.reduce(
                (sum, p) => sum + (p.priceInr || 0) * (p.qty || 1),
                0
              );

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBuild(b.id);
                    if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold shadow-xs border border-zinc-700/80'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-400"></span>
                    <div className="truncate">
                      <div className="truncate text-xs">{b.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {b.tagline || b.summary}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded-md border border-zinc-800 shrink-0">
                    ₹{price || 890}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Scrap Mode Drawer & Status */}
      <div className="p-3 border-t border-zinc-800 space-y-2 bg-zinc-950/60">
        {/* Scrap Drawer Button */}
        <button
          onClick={() => {
            onOpenScrapMode();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/70 text-xs text-zinc-200 transition"
        >
          <div className="flex items-center gap-2 truncate">
            <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-medium">Scrap Drawer</span>
          </div>
          {ownedCount > 0 ? (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-800 shrink-0">
              -₹{savingsInr}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400">Photo scan</span>
          )}
        </button>

        {/* Footer info */}
        <div className="px-1 text-[11px] text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Solder Engine
          </span>
          <span className="font-mono text-[10px] text-zinc-400">v2.4-pro</span>
        </div>
      </div>
    </div>
  );

  // If Mobile Drawer
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Backdrop */}
        <div
          onClick={onCloseMobileDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        />
        {/* Slide-in drawer */}
        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
          {content}
        </div>
      </div>
    );
  }

  // Desktop Sidebar
  if (!isOpen) return null;

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-zinc-800 h-screen sticky top-0 z-30 transition-all">
      {content}
    </aside>
  );
};
