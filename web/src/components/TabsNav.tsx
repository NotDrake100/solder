import React from 'react';
import {
  Layers,
  Box,
  GitFork,
  Code2,
  Terminal,
  ShoppingCart,
  Package,
  QrCode,
} from 'lucide-react';

export type TabKey =
  | 'parts'
  | 'case'
  | 'wiring'
  | 'code'
  | 'agent'
  | 'order'
  | 'ship'
  | 'ar';

interface TabsNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  partsCount: number;
  hasAgentLog?: boolean;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onTabChange,
  partsCount,
  hasAgentLog = true,
}) => {
  const tabs: Array<{ id: TabKey; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'parts', label: 'Parts', icon: Layers, badge: partsCount },
    { id: 'case', label: 'Case 3D', icon: Box },
    { id: 'wiring', label: 'Wiring', icon: GitFork },
    { id: 'code', label: 'Code', icon: Code2, badge: '.ino' },
    { id: 'agent', label: 'Agent Log', icon: Terminal, badge: '✓' },
    { id: 'order', label: 'Order', icon: ShoppingCart },
    { id: 'ship', label: 'Ship', icon: Package },
    { id: 'ar', label: 'AR Preview', icon: QrCode },
  ];

  return (
    <div className="w-full border-b border-zinc-200/80 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap rounded-lg ${
                isActive
                  ? 'text-zinc-900 bg-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
