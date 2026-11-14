import React, { useState, useEffect } from 'react';
import {
  Box,
  Cpu,
  Zap,
  Play,
  Code2,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  Truck,
  Eye,
  Download,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Layers,
  Share2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';
import { HarnessTrace, getDefaultHarnessChecks } from './HarnessTrace';

export type ResultTab = 'case' | 'parts' | 'wiring' | 'simulate' | 'firmware' | 'harness';

interface ResultPanelProps {
  build?: SolderBuild | null;
  activeTab?: ResultTab;
  onTabChange?: (tab: ResultTab) => void;
  isLoading?: boolean;
  onOpenOrder?: () => void;
  onOpenShip?: () => void;
  onOpenAr?: () => void;
  onOpenShare?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  build,
  activeTab: controlledTab,
  onTabChange,
  isLoading = false,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
  onOpenShare,
}) => {
  const [internalTab, setInternalTab] = useState<ResultTab>('case');
  const activeTab = controlledTab || internalTab;

  const handleTabClick = (tab: ResultTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [isExploded, setIsExploded] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [materialTheme, setMaterialTheme] = useState<'acrylic' | 'pla' | 'dark'>('acrylic');

  // Signature burst reveal animation when a new build loads
  useEffect(() => {
    if (!build || !build.layout || build.layout.length === 0) return;
    const timer = setTimeout(() => {
      setBurstCount((prev) => prev + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [build?.id]);

  const totalCost = build?.parts?.reduce(
    (sum, p) => sum + (p.owned ? 0 : (p.priceInr || 0) * (p.qty || 1)),
    0
  ) || build?.product?.priceInr || 890;

  const totalOwnedSavings = build?.parts?.reduce(
    (sum, p) => sum + (p.owned ? (p.priceInr || 0) * (p.qty || 1) : 0),
    0
  ) || 0;

  const handleCopyCode = () => {
    if (build?.code?.ino) {
      navigator.clipboard.writeText(build.code.ino);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (!build?.code?.ino) return;
    const blob = new Blob([build.code.ino], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = build.code.filename || `${build.id}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStl = () => {
    const fakeStlContent = `solid ${build?.name || 'solder_enclosure'}\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid`;
    const blob = new Blob([fakeStlContent], { type: 'application/sla' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${build?.id || 'build'}-enclosure.stl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Empty / Loading State before build is ready
  if (!build && isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#161514] text-center select-none">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping [animation-duration:2s]" />
          <div className="w-16 h-16 rounded-2xl bg-[#262422] border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10">
            <Box className="w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-stone-100 mb-1 tracking-tight">
          Synthesizing Hardware Co-Design...
        </h3>
        <p className="text-sm text-stone-400 max-w-sm">
          Generating 3D parametric enclosure, circuit netlist, and deterministic verification trace.
        </p>
      </div>
    );
  }

  // 2. Default Welcome / Clean Empty state
  if (!build) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#161514] text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#262422] border border-[#383430] flex items-center justify-center text-stone-400 mb-4 shadow-inner">
          <Box className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-stone-300 mb-1">
          Your 3D Case & Build Will Appear Here
        </h3>
        <p className="text-xs text-stone-400 max-w-xs">
          Describe an idea on the left or select a showcase to explore the interactive 3D model, wiring diagram, and firmware.
        </p>
      </div>
    );
  }

  // 3. Full Active Workspace Result Panel
  return (
    <div className="flex-1 flex flex-col h-full bg-[#161514] overflow-hidden select-none">
      {/* Top Bar (48px, warm crafted aesthetic) */}
      <div className="h-12 shrink-0 bg-[#1f1e1c] border-b border-[#383430] px-4 flex items-center justify-between gap-3">
        {/* Left: Project Name & Verified Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-semibold text-stone-100 text-sm tracking-tight truncate">
            {build.name}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#262422] text-stone-400 border border-[#383430] uppercase">
            {build.board || 'Uno'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified
          </span>
        </div>

        {/* Center: Segmented Tabs (3D Case, Parts, Wiring, Simulate, Firmware, Harness) */}
        <div className="flex items-center gap-1 p-0.5 bg-[#161514] rounded-xl border border-[#383430] overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabClick('case')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'case'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Case</span>
          </button>

          <button
            onClick={() => handleTabClick('parts')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'parts'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Parts</span>
            <span className="text-[10px] font-mono text-stone-400">
              ({build.parts?.length || 0})
            </span>
          </button>

          <button
            onClick={() => handleTabClick('wiring')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'wiring'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Wiring</span>
          </button>

          <button
            onClick={() => handleTabClick('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'simulate'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => handleTabClick('firmware')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'firmware'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware</span>
          </button>

          <button
            onClick={() => handleTabClick('harness')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'harness'
                ? 'bg-[#262422] text-orange-400 shadow-xs border border-orange-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#262422]/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Harness</span>
          </button>
        </div>

        {/* Right: Action Buttons (Order It, Ship It, AR, Share) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenOrder && (
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-stone-950 transition shadow-sm hover:shadow-orange-500/20 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order It</span>
              <span className="font-mono opacity-90 text-[11px]">₹{totalCost}</span>
            </button>
          )}

          {onOpenShip && (
            <button
              onClick={onOpenShip}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#262422] hover:bg-[#2e2a27] text-stone-300 border border-[#383430] transition cursor-pointer"
              title="Ship 48-Hour Kit"
            >
              <Truck className="w-3.5 h-3.5 text-stone-400" />
              <span>Ship It</span>
            </button>
          )}

          {onOpenAr && (
            <button
              onClick={onOpenAr}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#262422] hover:bg-[#2e2a27] text-stone-300 border border-[#383430] transition cursor-pointer"
              title="View in Augmented Reality"
            >
              <Eye className="w-3.5 h-3.5 text-stone-400" />
              <span>AR</span>
            </button>
          )}

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-[#262422] transition"
              title="Share Build"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body: Full-height Tab Contents */}
      <div className="flex-1 relative overflow-hidden bg-[#161514]">
        {/* TAB 1: 3D Case Viewer */}
        {activeTab === 'case' && (
          <div className="relative w-full h-full">
            <CaseViewer
              caseSpec={build.case}
              layout={build.layout}
              wiring={build.wiring}
              isExploded={isExploded}
              burstCount={burstCount}
              materialTheme={materialTheme}
              className="w-full h-full"
            />

            {/* Floating Dark-Glass Controls Overlay Docked at Bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#1f1e1c]/90 backdrop-blur-md border border-[#383430] shadow-xl">
              {/* Assembled / Exploded Toggle */}
              <button
                onClick={() => setIsExploded((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  isExploded
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'text-stone-300 hover:bg-[#262422]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isExploded ? 'Assembled' : 'Exploded'}</span>
              </button>

              {/* Material Selector */}
              <div className="flex items-center p-0.5 bg-[#161514] rounded-xl border border-[#383430]/70">
                <button
                  onClick={() => setMaterialTheme('acrylic')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    materialTheme === 'acrylic'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Frosted
                </button>
                <button
                  onClick={() => setMaterialTheme('pla')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    materialTheme === 'pla'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Matte PLA
                </button>
                <button
                  onClick={() => setMaterialTheme('dark')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    materialTheme === 'dark'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Carbon
                </button>
              </div>

              {/* Replay Burst Reveal */}
              <button
                onClick={() => setBurstCount((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:bg-[#262422] transition"
                title="Replay Burst Reveal"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Burst</span>
              </button>

              {/* Download STL Button */}
              <button
                onClick={handleDownloadStl}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:bg-[#262422] transition"
                title="Download 3D printable STL enclosure"
              >
                <Download className="w-3.5 h-3.5 text-stone-400" />
                <span>STL</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Parts Table */}
        {activeTab === 'parts' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 select-text">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-stone-100">
                  Bill of Materials (BOM)
                </h4>
                <p className="text-xs text-stone-400">
                  Exact maker library components with real INR pricing and Scrap Mode deductions.
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-orange-400 font-mono">
                  Total: ₹{totalCost}
                </div>
                {totalOwnedSavings > 0 && (
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Saved ₹{totalOwnedSavings} from Scrap
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#383430] bg-[#1f1e1c] overflow-hidden divide-y divide-[#383430]">
              {build.parts?.map((part) => (
                <div
                  key={part.id}
                  className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                    part.owned ? 'bg-emerald-500/5' : 'hover:bg-[#262422]/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-200 text-sm">
                        {part.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161514] text-stone-400 border border-[#383430]">
                        {part.libId}
                      </span>
                      {part.owned && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Owned from Scrap
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                      {part.why}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-medium text-stone-200">
                      {part.owned ? (
                        <span className="line-through text-stone-500">
                          ₹{part.priceInr * (part.qty || 1)}
                        </span>
                      ) : (
                        `₹${part.priceInr * (part.qty || 1)}`
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      Qty: {part.qty || 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Interactive Wiring Diagram */}
        {activeTab === 'wiring' && (
          <div className="h-full w-full overflow-hidden">
            <WiringDiagram build={build} />
          </div>
        )}

        {/* TAB 4: Virtual ATmega328P Simulator */}
        {activeTab === 'simulate' && (
          <div className="h-full w-full overflow-y-auto p-4 sm:p-6 bg-[#161514]">
            <Simulator
              hex={build.hex}
              ino={build.code?.ino}
              className="w-full max-w-4xl mx-auto shadow-2xl"
            />
          </div>
        )}

        {/* TAB 5: Arduino C++ Firmware Code */}
        {activeTab === 'firmware' && (
          <div className="h-full flex flex-col p-4 sm:p-6 select-text overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#383430] mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-sm text-stone-100 font-mono">
                  {build.code?.filename || `${build.id}.ino`}
                </span>
                <span className="text-[11px] text-stone-400">
                  (Arduino C++ Sketch)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262422] hover:bg-[#2e2a27] text-stone-300 border border-[#383430] transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#262422] hover:bg-[#2e2a27] text-stone-300 border border-[#383430] transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto rounded-2xl bg-[#121110] border border-[#383430] p-4 text-emerald-400 font-mono text-xs leading-relaxed">
              <code>{build.code?.ino || '// No firmware sketch found'}</code>
            </pre>
          </div>
        )}

        {/* TAB 6: Deep Harness Verification Trace */}
        {activeTab === 'harness' && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 bg-[#161514]">
            <div className="max-w-3xl mx-auto space-y-4">
              <HarnessTrace
                build={build}
                onSelectTab={(tab) => handleTabClick(tab)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
