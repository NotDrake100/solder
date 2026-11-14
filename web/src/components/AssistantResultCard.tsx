import React, { useState } from 'react';
import {
  Box,
  Cpu,
  Zap,
  Play,
  Code2,
  Sparkles,
  Layers,
  Copy,
  Check,
  Download,
  ShoppingBag,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';

interface AssistantResultCardProps {
  build: SolderBuild;
  onOpenOrder?: () => void;
}

export const AssistantResultCard: React.FC<AssistantResultCardProps> = ({
  build,
  onOpenOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'case' | 'parts' | 'wiring' | 'simulate' | 'code'>('case');
  const [isExploded, setIsExploded] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const totalCost = build.parts?.reduce(
    (sum, p) => sum + (p.owned ? 0 : p.priceInr * p.qty),
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
    <div className="w-full rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl overflow-hidden my-3 animate-in fade-in duration-200">
      {/* Result Tabs Navigation */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/80 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('case')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'case'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Case</span>
          </button>

          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'parts'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts</span>
            <span className="text-[10px] font-mono text-zinc-400">
              ({build.parts?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'wiring'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Wiring</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'simulate'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Firmware</span>
          </button>
        </div>

        {/* Total Price & Order Action */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-emerald-400">
            ₹{totalCost} INR
          </span>
          {onOpenOrder && (
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition shadow-xs"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Order Kit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: 3D Case Viewer */}
      {activeTab === 'case' && (
        <div className="relative">
          {/* Controls sub-bar */}
          <div className="flex items-center justify-between p-2 bg-zinc-900/60 border-b border-zinc-850 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExploded(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  !isExploded ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Assembled
              </button>
              <button
                onClick={() => setIsExploded(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  isExploded ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Exploded View
              </button>
            </div>

            <button
              onClick={() => setBurstCount((prev) => prev + 1)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-900/80 transition"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Burst Reveal</span>
            </button>
          </div>

          <div className="h-[360px] sm:h-[420px] w-full bg-zinc-950">
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

      {/* Tab 2: Parts List (BOM) */}
      {activeTab === 'parts' && (
        <div className="p-3 bg-zinc-950 max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500 border-b border-zinc-800 text-[11px]">
              <tr>
                <th className="pb-2 font-medium">Part Name</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium text-center">Qty</th>
                <th className="pb-2 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {build.parts?.map((p) => (
                <tr key={p.id} className="text-zinc-300 hover:bg-zinc-900/50">
                  <td className="py-2 font-medium text-zinc-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{p.name}</span>
                    {p.owned && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded-full">
                        In Drawer
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-zinc-400 text-[11px] max-w-xs">{p.why}</td>
                  <td className="py-2 text-center font-mono text-zinc-300">{p.qty}</td>
                  <td className="py-2 text-right font-mono text-zinc-100 font-semibold">
                    {p.owned ? (
                      <span className="line-through text-zinc-500">₹{p.priceInr * p.qty}</span>
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

      {/* Tab 3: Interactive Wiring */}
      {activeTab === 'wiring' && (
        <div className="p-3 bg-zinc-950 max-h-[420px] overflow-y-auto">
          <WiringDiagram build={build} />
        </div>
      )}

      {/* Tab 4: Virtual ATmega328P Simulator */}
      {activeTab === 'simulate' && (
        <div className="p-3 bg-zinc-950">
          <Simulator hex={build.hex} ino={build.code?.ino} className="w-full" />
        </div>
      )}

      {/* Tab 5: Arduino C++ Firmware */}
      {activeTab === 'code' && (
        <div className="bg-zinc-950 max-h-[380px] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs">
            <span className="font-mono text-zinc-300 text-[11px]">
              {build.code?.filename || `${build.id}.ino`}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold transition"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy code'}</span>
            </button>
          </div>
          <pre className="flex-1 p-3 text-xs font-mono text-zinc-300 overflow-x-auto bg-zinc-950 leading-relaxed selection:bg-zinc-800">
            <code>{build.code?.ino || '// No firmware available'}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
