import React from 'react';
import { X } from 'lucide-react';
import type { SolderBuild } from '../types';
import { SolderLogo } from './SolderLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewBuild: () => void;
  builds: SolderBuild[];
  activeBuildId?: string;
  onSelectBuild: (buildId: string) => void;
  onOpenScrapMode?: () => void;
  ownedCount?: number;
  savingsInr?: number;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  onGoHome?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewBuild,
  builds,
  activeBuildId,
  onSelectBuild,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  onGoHome,
}) => {
  // Recent builds list: only past builds and default maker recents
  const defaultItems = [
    { id: 'desk-fan', name: 'Desk fan' },
    { id: 'sip', name: 'Soil waterer' },
    { id: 'wisp', name: 'Dusk night light' },
  ];

  const displayBuilds = [
    ...builds.map((b) => ({
      id: b.id,
      name: b.name || b.tagline || 'Custom build',
    })),
    ...defaultItems.filter((d) => !builds.some((b) => b.id === d.id)),
  ];

  const handleItemClick = (id: string) => {
    onSelectBuild(id);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleNewBuildClick = () => {
    onNewBuild();
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const sidebarContent = (
    <div className="w-[232px] h-full bg-[#121212] border-r border-[#222222] flex flex-col justify-between text-[#d4d4d4] select-none text-[13.5px]">
      {/* Top Section */}
      <div className="p-3 flex flex-col gap-3 min-h-0 flex-1">
        {/* Wordmark + Mobile Close */}
        <div className="flex items-center justify-between px-1.5 pt-1">
          <a
            href="/"
            onClick={(e) => {
              if (onGoHome) {
                e.preventDefault();
                onGoHome();
              }
            }}
            className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
          >
            <SolderLogo className="w-4 h-4 text-white" />
            <span className="font-medium text-[15px] tracking-tight text-white">
              Solder
            </span>
          </a>

          {isMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded text-[#888] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Build Button */}
        <button
          onClick={handleNewBuildClick}
          className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg border border-[#333] hover:border-[#555] bg-[#1a1a1a] hover:bg-[#222222] text-xs font-medium text-white transition cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="text-white"
          >
            <path
              d="M7 2.5v9M2.5 7h9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span>New build</span>
        </button>

        {/* Recents Label */}
        <div className="px-1.5 pt-3 text-[11px] font-medium text-[#777] uppercase tracking-wider">
          Recent
        </div>

        {/* Recents List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {displayBuilds.map((item) => {
            const isCurrent = activeBuildId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs truncate transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[#262626] text-white font-medium'
                    : 'text-[#999] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Minimal Footer: Simple brand line, no cards or buttons */}
      <div className="p-3 border-t border-[#222222] text-[11px] text-[#666] flex items-center justify-between">
        <span>Solder</span>
        <span className="mono">v1.0</span>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <div
          onClick={onCloseMobileDrawer}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        />
        <div className="fixed inset-y-0 left-0 w-[232px] shadow-2xl z-10">
          {sidebarContent}
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <aside className="hidden md:flex flex-col w-[232px] shrink-0 h-screen bg-[#121212] z-30">
      {sidebarContent}
    </aside>
  );
};
