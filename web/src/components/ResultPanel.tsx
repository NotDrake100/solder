import React, { useState, useEffect } from 'react';
import {
  Box,
  Cpu,
  Zap,
  Play,
  Code2,
  Copy,
  Check,
  ShoppingBag,
  Truck,
  Eye,
  Download,
  Sparkles,
  Layers,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';

export type ResultTab = 'case' | 'parts' | 'wiring' | 'simulate' | 'firmware';

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

  const totalCost =
    build?.parts?.reduce(
      (sum, p) => sum + (p.owned ? 0 : (p.priceInr || 0) * (p.qty || 1)),
      0
    ) || build?.product?.priceInr || 890;

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

  // 1. Loading State
  if (!build && isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#181818] text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-[#212121] border border-[#2a2a2a] flex items-center justify-center text-[#a3a3a3] mb-4">
          <Box className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-sm font-medium text-[#f5f5f5] mb-1">
          Generating build...
        </h3>
        <p className="text-xs text-[#777] max-w-xs">
          Synthesizing 3D case, circuit netlist, and firmware sketch.
        </p>
      </div>
    );
  }

  // 2. Empty State
  if (!build) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#181818] text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-[#212121] border border-[#2a2a2a] flex items-center justify-center text-[#777] mb-4">
          <Box className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-[#a3a3a3] mb-1">
          Your 3D Case & Build Will Show Here
        </h3>
        <p className="text-xs text-[#666] max-w-xs">
          Prompt Solder on the left or click a showcase to load an interactive build.
        </p>
      </div>
    );
  }

  // 3. Active Workspace Result Panel
  return (
    <div className="flex-1 flex flex-col h-full bg-[#181818] overflow-hidden select-none">
      {/* Top Bar (48px, ultra-clean neutral) */}
      <div className="h-12 shrink-0 bg-[#181818] border-b border-[#2a2a2a] px-4 flex items-center justify-between gap-3">
        {/* Left: Project Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-[#f5f5f5] text-sm tracking-tight truncate">
            {build.name}
          </span>
          <span className="text-[11px] font-mono text-[#777]">
            {build.board?.toUpperCase() || 'UNO'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Verified
          </span>
        </div>

        {/* Center: Segmented Tabs (3D Case, Parts, Wiring, Simulate, Firmware) */}
        <div className="flex items-center gap-1 p-0.5 bg-[#212121] rounded-lg border border-[#2a2a2a] overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabClick('case')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'case'
                ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Case</span>
          </button>

          <button
            onClick={() => handleTabClick('parts')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'parts'
                ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Parts</span>
          </button>

          <button
            onClick={() => handleTabClick('wiring')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'wiring'
                ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Wiring</span>
          </button>

          <button
            onClick={() => handleTabClick('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'simulate'
                ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => handleTabClick('firmware')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'firmware'
                ? 'bg-[#2a2a2a] text-[#f5f5f5]'
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware</span>
          </button>
        </div>

        {/* Right: Actions (Clean White Order Kit button + neutral secondary) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenOrder && (
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Kit</span>
              <span className="font-mono text-[11px] opacity-75">₹{totalCost}</span>
            </button>
          )}

          {onOpenShip && (
            <button
              onClick={onOpenShip}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#212121] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white border border-[#2a2a2a] transition cursor-pointer"
              title="Ship 48-Hour Kit"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Ship</span>
            </button>
          )}

          {onOpenAr && (
            <button
              onClick={onOpenAr}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#212121] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white border border-[#2a2a2a] transition cursor-pointer"
              title="View in Augmented Reality"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>AR</span>
            </button>
          )}

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#212121] transition"
              title="Share Build"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body: Full-height Tab Contents */}
      <div className="flex-1 relative overflow-hidden bg-[#181818]">
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

            {/* Floating Neutral Controls Overlay Docked at Bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#212121]/95 backdrop-blur-md border border-[#2a2a2a] shadow-xl text-xs text-[#a3a3a3]">
              {/* Assembled / Exploded Toggle */}
              <button
                onClick={() => setIsExploded((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition ${
                  isExploded
                    ? 'bg-[#2a2a2a] text-white font-medium'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#2a2a2a]/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isExploded ? 'Assembled' : 'Exploded'}</span>
              </button>

              {/* Material Selector */}
              <div className="flex items-center p-0.5 bg-[#181818] rounded-lg border border-[#2a2a2a]">
                <button
                  onClick={() => setMaterialTheme('acrylic')}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    materialTheme === 'acrylic'
                      ? 'bg-[#2a2a2a] text-white font-medium'
                      : 'text-[#777] hover:text-[#a3a3a3]'
                  }`}
                >
                  Frosted
                </button>
                <button
                  onClick={() => setMaterialTheme('pla')}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    materialTheme === 'pla'
                      ? 'bg-[#2a2a2a] text-white font-medium'
                      : 'text-[#777] hover:text-[#a3a3a3]'
                  }`}
                >
                  Matte PLA
                </button>
                <button
                  onClick={() => setMaterialTheme('dark')}
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    materialTheme === 'dark'
                      ? 'bg-[#2a2a2a] text-white font-medium'
                      : 'text-[#777] hover:text-[#a3a3a3]'
                  }`}
                >
                  Carbon
                </button>
              </div>

              {/* Replay Burst Reveal */}
              <button
                onClick={() => setBurstCount((prev) => prev + 1)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white transition"
                title="Replay Burst Reveal"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Burst</span>
              </button>

              {/* Download STL Button */}
              <button
                onClick={handleDownloadStl}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white transition"
                title="Download STL file"
              >
                <Download className="w-3.5 h-3.5" />
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
                <h4 className="text-sm font-medium text-[#f5f5f5]">
                  Bill of Materials (BOM)
                </h4>
                <p className="text-xs text-[#777]">
                  Maker parts list with INR maker pricing.
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-[#f5f5f5]">
                  Total: ₹{totalCost}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#2a2a2a] bg-[#212121] overflow-hidden divide-y divide-[#2a2a2a]">
              {build.parts?.map((part) => (
                <div
                  key={part.id}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#262626] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f5f5f5] text-sm">
                        {part.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181818] text-[#777] border border-[#2a2a2a]">
                        {part.libId}
                      </span>
                      {part.owned && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Owned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#777] mt-0.5 line-clamp-1">
                      {part.why}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-[#f5f5f5]">
                      ₹{part.priceInr * (part.qty || 1)}
                    </div>
                    <div className="text-[10px] text-[#777] font-mono">
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
          <div className="h-full w-full overflow-y-auto p-4 sm:p-6 bg-[#181818]">
            <Simulator
              hex={build.hex}
              ino={build.code?.ino}
              className="w-full max-w-4xl mx-auto shadow-xl"
            />
          </div>
        )}

        {/* TAB 5: Arduino C++ Firmware Code */}
        {activeTab === 'firmware' && (
          <div className="h-full flex flex-col p-4 sm:p-6 select-text overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a] mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#a3a3a3]" />
                <span className="font-mono text-sm text-[#f5f5f5]">
                  {build.code?.filename || `${build.id}.ino`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#a3a3a3] hover:text-white bg-[#212121] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#a3a3a3] hover:text-white bg-[#212121] hover:bg-[#2a2a2a] border border-[#2a2a2a] transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto rounded-xl bg-[#141414] border border-[#2a2a2a] p-4 text-[#a3a3a3] font-mono text-xs leading-relaxed">
              <code>{build.code?.ino || '// No firmware sketch found'}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
