import React, { useState } from 'react';
import {
  Box,
  Cpu,
  Zap,
  Play,
  Code2,
  Sparkles,
  ShoppingBag,
  Truck,
  Eye,
  ShieldCheck,
  Copy,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';
import { HarnessTrace, VerifierCheckItem, SelfHealEvent } from './HarnessTrace';

interface PreviewPanelProps {
  build: SolderBuild;
  onOpenOrder: () => void;
  onOpenShip: () => void;
  onOpenAr: () => void;
  checks?: VerifierCheckItem[];
  selfHeals?: SelfHealEvent[];
  harnessSummary?: string;
  isVerifying?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  build,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
  checks = [],
  selfHeals = [],
  harnessSummary,
  isVerifying = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    'case' | 'parts' | 'wiring' | 'simulate' | 'firmware' | 'harness'
  >('case');
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

  const handleDownloadIno = () => {
    if (!build.code?.ino) return;
    const blob = new Blob([build.code.ino], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = build.code.filename || `${build.id}.ino`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1c1a] text-[#ede8e1] overflow-hidden select-none font-sans">
      {/* Top Header & Segmented Tabs Bar (44px) */}
      <div className="h-12 shrink-0 px-3 sm:px-4 bg-[#191715] border-b border-[#2c2926] flex items-center justify-between gap-3 text-xs">
        {/* Left: Project Name */}
        <div className="flex items-center gap-2.5 truncate max-w-[200px] sm:max-w-xs">
          <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
          <span className="font-semibold text-[#f5f2ed] truncate text-sm">
            {build.name || 'Hardware Build'}
          </span>
          <span className="hidden md:inline text-[11px] font-mono text-[#8c857b] bg-[#25221f] px-1.5 py-0.5 rounded border border-[#332f2a]">
            {build.board?.toUpperCase() || 'UNO'}
          </span>
        </div>

        {/* Center: Segmented Tabs (3D Case, Parts, Wiring, Simulate, Firmware, Harness) */}
        <div className="flex items-center gap-1 bg-[#141312] p-0.5 rounded-xl border border-[#2c2926] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('case')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'case'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-orange-400" />
            <span>3D Case</span>
          </button>

          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'parts'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Parts</span>
            <span className="text-[10px] font-mono text-[#787166]">
              ({build.parts?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'wiring'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Wiring</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'simulate'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => setActiveTab('firmware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'firmware'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Firmware</span>
          </button>

          <button
            onClick={() => setActiveTab('harness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs shrink-0 ${
              activeTab === 'harness'
                ? 'bg-[#2c2824] text-white shadow-xs font-semibold'
                : 'text-[#9c9488] hover:text-white hover:bg-[#201e1b]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Harness</span>
          </button>
        </div>

        {/* Right: Actions (Order It, Ship It, AR) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-orange-400 mr-1">
            ₹{totalCost} INR
          </span>

          <button
            onClick={onOpenOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition shadow-md active:scale-[0.98]"
            title="Order hardware parts kit"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Kit</span>
          </button>

          <button
            onClick={onOpenShip}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#262320] hover:bg-[#302c28] border border-[#38342f] text-[#d6cec2] text-xs font-medium transition"
            title="Ship fully assembled build"
          >
            <Truck className="w-3.5 h-3.5 text-[#9c9488]" />
            <span>Ship</span>
          </button>

          <button
            onClick={onOpenAr}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#262320] hover:bg-[#302c28] border border-[#38342f] text-[#d6cec2] text-xs font-medium transition"
            title="Preview in Augmented Reality"
          >
            <Eye className="w-3.5 h-3.5 text-[#9c9488]" />
            <span>AR</span>
          </button>
        </div>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 min-h-0 relative bg-[#181715]">
        {/* Tab 1: 3D Case Viewer */}
        {activeTab === 'case' && (
          <div className="relative w-full h-full flex flex-col">
            {/* 3D Canvas */}
            <div className="flex-1 w-full h-full bg-[#141312]">
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

            {/* Thin Bottom Floating Overlay Toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full bg-[#1c1a18]/90 backdrop-blur-md border border-[#38332c] shadow-2xl">
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => setIsExploded(false)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    !isExploded
                      ? 'bg-[#332e29] text-white shadow-xs font-semibold'
                      : 'text-[#9c9488] hover:text-white'
                  }`}
                >
                  Assembled
                </button>
                <button
                  onClick={() => setIsExploded(true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    isExploded
                      ? 'bg-[#332e29] text-white shadow-xs font-semibold'
                      : 'text-[#9c9488] hover:text-white'
                  }`}
                >
                  Exploded
                </button>
              </div>

              <div className="w-px h-4 bg-[#38332c]" />

              <button
                onClick={() => setBurstCount((c) => c + 1)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-300 hover:bg-orange-600/30 text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Burst Reveal</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Parts Bill of Materials */}
        {activeTab === 'parts' && (
          <div className="p-4 sm:p-6 w-full h-full overflow-y-auto bg-[#181715]">
            <div className="max-w-4xl mx-auto rounded-2xl bg-[#201e1c] border border-[#2c2926] p-4 shadow-md">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[#8c857b] border-b border-[#2c2926] text-xs">
                  <tr>
                    <th className="pb-3 font-semibold">Component</th>
                    <th className="pb-3 font-semibold">Engineering Purpose</th>
                    <th className="pb-3 font-semibold text-center">Qty</th>
                    <th className="pb-3 font-semibold text-right">Maker Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282623]">
                  {build.parts?.map((p) => (
                    <tr key={p.id} className="text-[#d6cec2] hover:bg-[#25221f] transition-colors">
                      <td className="py-3 font-medium text-white flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                        <span>{p.name}</span>
                        {p.owned && (
                          <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded">
                            In Scrap Drawer
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[#9c9488] text-xs max-w-sm">{p.why}</td>
                      <td className="py-3 text-center font-mono text-[#d6cec2]">{p.qty}</td>
                      <td className="py-3 text-right font-mono font-semibold text-[#f5f2ed]">
                        {p.owned ? (
                          <span className="line-through text-[#666]">₹{p.priceInr * p.qty}</span>
                        ) : (
                          `₹${p.priceInr * p.qty} INR`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Wiring */}
        {activeTab === 'wiring' && (
          <div className="w-full h-full p-4 overflow-y-auto bg-[#181715]">
            <WiringDiagram build={build} />
          </div>
        )}

        {/* Tab 4: Virtual MCU Simulator */}
        {activeTab === 'simulate' && (
          <div className="w-full h-full p-4 overflow-y-auto bg-[#181715]">
            <Simulator hex={build.hex} ino={build.code?.ino} className="w-full h-full" />
          </div>
        )}

        {/* Tab 5: Arduino Firmware Sketch */}
        {activeTab === 'firmware' && (
          <div className="w-full h-full flex flex-col bg-[#141312]">
            <div className="h-10 px-4 bg-[#1a1816] border-b border-[#2c2926] flex items-center justify-between text-xs">
              <span className="font-mono text-[#8c857b] text-xs">
                {build.code?.filename || `${build.id}.ino`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262320] hover:bg-[#302c28] text-white text-xs font-medium transition"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#9c9488]" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadIno}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262320] hover:bg-[#302c28] text-white text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#9c9488]" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 font-mono text-xs sm:text-sm text-[#d6cec2] overflow-x-auto leading-relaxed select-text bg-[#121110]">
              <code>{build.code?.ino || '// No sketch code generated'}</code>
            </pre>
          </div>
        )}

        {/* Tab 6: Full Harness Inspector */}
        {activeTab === 'harness' && (
          <div className="w-full h-full p-4 sm:p-6 overflow-y-auto bg-[#181715]">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-[#201e1c] border border-[#2c2926] shadow-sm">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Deterministic Hardware Verifier Suite</span>
                </h3>
                <p className="text-xs text-[#9c9488] leading-relaxed">
                  Every Solder build runs through 6 real deterministic checks before release. No fake passes.
                  Pins, power budgets, logic voltages, compile, simulation, and enclosure clearances are mathematically proven.
                </p>
              </div>

              <HarnessTrace
                checks={checks}
                isVerifying={isVerifying}
                selfHeals={selfHeals}
                summary={harnessSummary}
                allPassed={checks.every((c) => c.pass)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
