import React, { useState } from 'react';
import {
  Box,
  Cpu,
  Activity,
  Play,
  Code2,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  Truck,
  Eye,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';

interface AssistantResultCardProps {
  build: SolderBuild;
  onOpenOrder?: () => void;
  onOpenShip?: () => void;
  onOpenAr?: () => void;
}

export const AssistantResultCard: React.FC<AssistantResultCardProps> = ({
  build,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
}) => {
  // Tabs: Parts, 3D Case, Wiring, Simulate, Firmware
  const [activeTab, setActiveTab] = useState<'parts' | 'case' | 'wiring' | 'simulate' | 'firmware'>('case');
  const [isExploded, setIsExploded] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const totalCost = build.parts?.reduce(
    (sum, p) => sum + (p.owned ? 0 : (p.priceInr || 0) * (p.qty || 1)),
    0
  );

  const handleCopyCode = () => {
    if (build.code?.ino) {
      navigator.clipboard.writeText(build.code.ino);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-[16px] bg-[#262626] border border-[#3a3a3a] overflow-hidden my-3 select-none">
      {/* Panel Header: Segmented Tabs & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#212121]/90 border-b border-[#3a3a3a]">
        {/* Segmented Tabs (scrollable on mobile) */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'parts'
                ? 'bg-[#333333] text-white shadow-xs'
                : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2a2a2a]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts</span>
            <span className="text-[10px] font-mono text-[#8e8e8e]">
              ({build.parts?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('case')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'case'
                ? 'bg-[#333333] text-white shadow-xs'
                : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2a2a2a]'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Case</span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'wiring'
                ? 'bg-[#333333] text-white shadow-xs'
                : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2a2a2a]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wiring</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'simulate'
                ? 'bg-[#333333] text-white shadow-xs'
                : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2a2a2a]'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => setActiveTab('firmware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'firmware'
                ? 'bg-[#333333] text-white shadow-xs'
                : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2a2a2a]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Firmware</span>
          </button>
        </div>

        {/* Small Header Buttons: Order It, Ship It, AR */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="text-xs font-mono font-semibold text-emerald-400 mr-1">
            ₹{totalCost}
          </span>

          {onOpenOrder && (
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-zinc-100 text-black text-xs font-medium transition"
              title="Order hardware kit"
            >
              <ShoppingBag className="w-3 h-3 text-black" />
              <span>Order It</span>
            </button>
          )}

          {onOpenShip && (
            <button
              onClick={onOpenShip}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#333333] hover:bg-[#3d3d3d] text-[#ececec] text-xs font-medium transition"
              title="Ship finished unit"
            >
              <Truck className="w-3 h-3 text-[#8e8e8e]" />
              <span className="hidden sm:inline">Ship It</span>
            </button>
          )}

          {onOpenAr && (
            <button
              onClick={onOpenAr}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#333333] hover:bg-[#3d3d3d] text-[#ececec] text-xs font-medium transition"
              title="View in AR"
            >
              <Eye className="w-3 h-3 text-[#8e8e8e]" />
              <span className="hidden sm:inline">AR</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content: 3D Case */}
      {activeTab === 'case' && (
        <div className="relative">
          {/* Controls Sub-Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#212121]/50 border-b border-[#333333] text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExploded(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  !isExploded ? 'bg-[#333] text-white' : 'text-[#8e8e8e] hover:text-white'
                }`}
              >
                Assembled
              </button>
              <button
                onClick={() => setIsExploded(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  isExploded ? 'bg-[#333] text-white' : 'text-[#8e8e8e] hover:text-white'
                }`}
              >
                Exploded View
              </button>
            </div>

            <button
              onClick={() => setBurstCount((c) => c + 1)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-medium hover:bg-emerald-900/80 transition"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Burst Reveal</span>
            </button>
          </div>

          {/* 3D Viewer Container: 420px desktop, 300px mobile */}
          <div className="h-[300px] sm:h-[420px] w-full bg-[#1b1b1b]">
            <CaseViewer
              layout={build.layout}
              caseSpec={build.case}
              wiring={build.wiring}
              isExploded={isExploded}
              onExplodeToggle={setIsExploded}
              burstTrigger={burstCount}
              materialTheme="acrylic"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Tab Content: Parts */}
      {activeTab === 'parts' && (
        <div className="p-3 bg-[#212121] max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#8e8e8e] border-b border-[#333] text-[11px]">
              <tr>
                <th className="pb-2 font-medium">Part Name</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium text-center">Qty</th>
                <th className="pb-2 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {build.parts?.map((p) => (
                <tr key={p.id} className="text-[#d1d1d1] hover:bg-[#282828]">
                  <td className="py-2.5 font-medium text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span>{p.name}</span>
                    {p.owned && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded">
                        In Drawer
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-[#8e8e8e] text-[11px] max-w-xs">{p.why}</td>
                  <td className="py-2.5 text-center font-mono text-[#d1d1d1]">{p.qty}</td>
                  <td className="py-2.5 text-right font-mono text-white font-medium">
                    {p.owned ? (
                      <span className="line-through text-[#666]">₹{p.priceInr * p.qty}</span>
                    ) : (
                      `₹${p.priceInr * p.qty}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Wiring */}
      {activeTab === 'wiring' && (
        <div className="p-3 bg-[#212121] max-h-[420px] overflow-y-auto">
          <WiringDiagram build={build} />
        </div>
      )}

      {/* Tab Content: Simulate */}
      {activeTab === 'simulate' && (
        <div className="p-3 bg-[#212121]">
          <Simulator hex={build.hex} ino={build.code?.ino} className="w-full" />
        </div>
      )}

      {/* Tab Content: Firmware */}
      {activeTab === 'firmware' && (
        <div className="bg-[#212121] max-h-[380px] flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-[#333] text-xs">
            <span className="font-mono text-[#8e8e8e] text-[11px]">
              {build.code?.filename || `${build.id}.ino`}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2e2e2e] hover:bg-[#383838] text-white text-[11px] font-medium transition"
            >
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-[#8e8e8e]" />
              )}
              <span>{copiedCode ? 'Copied' : 'Copy code'}</span>
            </button>
          </div>
          <pre className="flex-1 p-3 text-xs font-mono text-[#d1d1d1] overflow-x-auto bg-[#1b1b1b] leading-relaxed select-text">
            <code>{build.code?.ino || '// No firmware sketch'}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
