import React from 'react';
import { Menu, PanelLeft, Plus, Share2 } from 'lucide-react';
import { SolderLogo } from './SolderLogo';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewBuild: () => void;
  onOpenShare?: () => void;
  onGoHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNewBuild,
  onOpenShare,
  onGoHome,
}) => {
  return (
    <header className="h-[48px] shrink-0 bg-[#0f0f0f] border-b border-[#262626] px-3 sm:px-4 flex items-center justify-between select-none z-20">
      {/* Left: Mobile hamburger or collapsed sidebar toggle + Wordmark */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-[#888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] transition cursor-pointer"
          title="Toggle sidebar"
        >
          <Menu className="w-4 h-4 md:hidden" />
          <PanelLeft className="w-4 h-4 hidden md:block" />
        </button>

        <button
          onClick={onGoHome}
          className={`flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left ${
            isSidebarOpen ? 'md:hidden' : ''
          }`}
          title="Back to home"
        >
          <SolderLogo className="w-4 h-4 text-white" />
          <span className="font-medium text-[15px] tracking-tight text-white">
            Solder
          </span>
        </button>
      </div>

      {/* Right: New build icon button + Share */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onNewBuild}
          className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-[#1a1a1a] transition cursor-pointer"
          title="New build"
          aria-label="New build"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 2.5v9M2.5 7h9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {onOpenShare && (
          <button
            onClick={onOpenShare}
            className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-[#1a1a1a] transition cursor-pointer"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
