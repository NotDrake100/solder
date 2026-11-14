import React from 'react';
import {
  PenSquare,
  PanelLeftClose,
  Camera,
  Sparkles,
  Zap,
  Shield,
  CloudRain,
  Clock,
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

const SHOWCASE_ITEMS = [
  { id: 'sip', name: 'Sip', tagline: 'Drink reminder', icon: Sparkles },
  { id: 'wisp', name: 'Wisp', tagline: 'Air quality puck', icon: Zap },
  { id: 'hasp', name: 'Hasp', tagline: 'Smart deadbolt', icon: Shield },
  { id: 'eave', name: 'Eave', tagline: 'Rain closer', icon: CloudRain },
];

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
  const recentBuilds = builds.filter(
    (b) => !['sip', 'wisp', 'hasp', 'eave'].includes(b.id)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#181818] text-[#a3a3a3] select-none text-[14px] leading-normal border-r border-[#2a2a2a]">
      {/* Top row: Solder Logo + New build button */}
      <div className="h-[48px] px-3.5 flex items-center justify-between gap-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 font-medium text-[#f5f5f5] tracking-tight">
          <div className="w-5 h-5 rounded bg-[#262626] border border-[#333] flex items-center justify-center text-[#f5f5f5]">
            <Zap className="w-3 h-3" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Solder</span>
        </div>

        <div className="flex items-center gap-1 text-[#777]">
          <button
            onClick={() => {
              onNewBuild();
              if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="p-1.5 rounded-md hover:bg-[#212121] hover:text-[#f5f5f5] transition"
            title="New build"
          >
            <PenSquare className="w-4 h-4" />
          </button>

          {isMobileDrawer ? (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-md hover:bg-[#212121] hover:text-[#f5f5f5] transition"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-[#212121] hover:text-[#f5f5f5] transition"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main navigation list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Showcase group */}
        <div>
          <div className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wider text-[#666] uppercase">
            Showcase
          </div>
          <div className="space-y-0.5">
            {SHOWCASE_ITEMS.map((item) => {
              const isActive = activeBuildId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectBuild(item.id);
                    if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                  }}
                  className={`w-full h-[36px] flex items-center justify-between px-2.5 rounded-lg text-sm transition-colors text-left ${
                    isActive
                      ? 'bg-[#262626] text-[#f5f5f5] font-medium'
                      : 'text-[#a3a3a3] hover:bg-[#212121] hover:text-[#f5f5f5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-[#777] shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-[#666] shrink-0 font-normal">
                    {item.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent group */}
        {recentBuilds.length > 0 && (
          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wider text-[#666] uppercase">
              Recent
            </div>
            <div className="space-y-0.5">
              {recentBuilds.map((build) => {
                const isActive = activeBuildId === build.id;
                return (
                  <button
                    key={build.id}
                    onClick={() => {
                      onSelectBuild(build.id);
                      if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                    }}
                    className={`w-full h-[36px] flex items-center justify-between px-2.5 rounded-lg text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-[#262626] text-[#f5f5f5] font-medium'
                        : 'text-[#a3a3a3] hover:bg-[#212121] hover:text-[#f5f5f5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-[#666] shrink-0" />
                      <span className="truncate">{build.name || 'Custom Build'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Scrap Mode */}
      <div className="p-2 border-t border-[#2a2a2a]">
        <button
          onClick={() => {
            onOpenScrapMode();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="w-full h-[36px] flex items-center justify-between px-2.5 rounded-lg text-sm text-[#a3a3a3] hover:bg-[#212121] hover:text-[#f5f5f5] transition-colors"
          title="Open Scrap Drawer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Camera className="w-3.5 h-3.5 text-[#777] shrink-0" />
            <span className="truncate">Scrap Mode</span>
          </div>
          {savingsInr > 0 ? (
            <span className="text-[11px] font-mono text-emerald-400">
              -₹{savingsInr}
            </span>
          ) : ownedCount > 0 ? (
            <span className="text-[11px] font-mono text-[#a3a3a3]">
              {ownedCount} parts
            </span>
          ) : (
            <span className="text-[11px] text-[#666]">Photo scan</span>
          )}
        </button>
      </div>
    </div>
  );

  // Mobile Slide-in Drawer
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div
          onClick={onCloseMobileDrawer}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        />
        <div className="fixed inset-y-0 left-0 w-[260px] max-w-[80vw] shadow-2xl z-10">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop Sidebar
  if (!isOpen) return null;

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-screen bg-[#181818] z-30">
      {sidebarContent}
    </aside>
  );
};
