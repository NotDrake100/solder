import React, { useState, useEffect } from 'react';
import {
  Box,
  Cpu,
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
  Activity,
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
  className?: string;
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
  className = '',
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

  if (!build) return null;

  const outerMm = build.case?.outerMm || [82, 64, 28];

  return (
    <div
      className={`result rounded-xl border border-[#2a2a2a] bg-[#141414] overflow-hidden my-3 select-none ${className}`}
    >
      {/* Result Tabs Bar */}
      <div
        className="result-tabs flex items-center justify-between border-b border-[#262626] px-3 bg-[#171717] overflow-x-auto scrollbar-none gap-2"
        role="tablist"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleTabClick('case')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'case'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Case</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('parts')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'parts'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Parts</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('wiring')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'wiring'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Wiring</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('simulate')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'simulate'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('firmware')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === 'firmware'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware</span>
          </button>
        </div>

        {/* Right CTA: Order Kit */}
        {onOpenOrder && (
          <div className="shrink-0 py-1">
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Order Kit</span>
              <span className="mono text-[11px] opacity-80">Rs {totalCost}</span>
            </button>
          </div>
        )}
      </div>

      {/* Result Stage Body */}
      <div className="result-stage relative bg-[#141414] overflow-hidden">
        {/* TAB 1: 3D Case Viewer */}
        {activeTab === 'case' && (
          <div className="relative w-full h-[360px] sm:h-[400px]">
            <CaseViewer
              caseSpec={build.case}
              layout={build.layout}
              wiring={build.wiring}
              isExploded={isExploded}
              burstCount={burstCount}
              materialTheme={materialTheme}
              className="w-full h-full"
            />

            {/* Bottom-left: Caption & Monospace Dimensions */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#181818]/90 border border-[#262626] text-xs">
              <span className="iso-caption font-medium text-[#f5f5f5]">3D case</span>
              <span className="text-[#555]">·</span>
              <span className="iso-meta mono text-[#888]">
                {outerMm[0]} × {outerMm[1]} × {outerMm[2]} mm
              </span>
            </div>

            {/* Floating Controls Overlay */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 p-1 rounded-lg bg-[#181818]/95 border border-[#2a2a2a] text-xs text-[#a3a3a3]">
              {/* Assembled / Exploded Toggle */}
              <button
                onClick={() => setIsExploded((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                  isExploded
                    ? 'bg-[#2a2a2a] text-white font-medium'
                    : 'text-[#888] hover:text-white'
                }`}
              >
                {isExploded ? 'Assembled' : 'Exploded'}
              </button>

              {/* Material Toggle */}
              <button
                onClick={() =>
                  setMaterialTheme((prev) =>
                    prev === 'acrylic' ? 'pla' : prev === 'pla' ? 'dark' : 'acrylic'
                  )
                }
                className="px-2 py-0.5 rounded text-xs text-[#888] hover:text-white transition cursor-pointer"
                title="Cycle material theme"
              >
                {materialTheme === 'acrylic'
                  ? 'Frosted'
                  : materialTheme === 'pla'
                  ? 'PLA'
                  : 'Carbon'}
              </button>

              {/* Burst Reveal */}
              <button
                onClick={() => setBurstCount((prev) => prev + 1)}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#2a2a2a] text-[#888] hover:text-white transition cursor-pointer"
                title="Burst Reveal"
              >
                <Sparkles className="w-3 h-3" />
                <span>Burst</span>
              </button>

              {/* Download STL */}
              <button
                onClick={handleDownloadStl}
                className="p-1 rounded hover:bg-[#2a2a2a] text-[#888] hover:text-white transition cursor-pointer"
                title="Download STL"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Parts Table */}
        {activeTab === 'parts' && (
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-3 select-text">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-[#262626]">
              <span className="font-medium text-[#f5f5f5]">Parts BOM</span>
              <span className="mono text-[#f5f5f5]">Kit Total: Rs {totalCost}</span>
            </div>

            <div className="divide-y divide-[#262626] text-xs">
              {build.parts?.map((part) => (
                <div
                  key={part.id}
                  className="py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#f5f5f5] truncate">
                      {part.name}
                    </div>
                    <div className="mono text-[11px] text-[#777]">
                      Qty {part.qty || 1} · {part.package || 'Module'}
                    </div>
                  </div>
                  <div className="mono text-right text-xs text-[#d4d4d4] shrink-0">
                    {part.owned ? 'Owned' : `Rs ${part.priceInr || 60}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Wiring Netlist */}
        {activeTab === 'wiring' && (
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-3 select-text">
            <div className="text-xs font-medium text-[#f5f5f5] pb-1 border-b border-[#262626]">
              Pin Netlist Connections
            </div>

            <div className="divide-y divide-[#262626] text-xs">
              {build.wiring?.map((wire, idx) => (
                <div
                  key={idx}
                  className="py-1.5 flex items-center justify-between gap-2 font-mono text-[11.5px]"
                >
                  <div className="text-[#f5f5f5]">
                    <span className="text-[#888]">{wire.from?.part || 'MCU'}:</span>{' '}
                    <span className="text-white font-medium">{wire.from?.pin}</span>
                  </div>
                  <span className="text-[#555]">→</span>
                  <div className="text-[#f5f5f5]">
                    <span className="text-[#888]">{wire.to?.part}:</span>{' '}
                    <span className="text-white font-medium">{wire.to?.pin}</span>
                  </div>
                  <div className="text-[10px] text-[#666] shrink-0">
                    {wire.signal || wire.color || '5V/GND'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Simulator */}
        {activeTab === 'simulate' && (
          <div className="p-4 max-h-[380px] overflow-y-auto">
            <Simulator build={build} />
          </div>
        )}

        {/* TAB 5: Firmware Code */}
        {activeTab === 'firmware' && (
          <div className="p-3 max-h-[380px] flex flex-col select-text">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626] text-xs">
              <span className="mono text-[#888]">
                {build.code?.filename || 'sketch.ino'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202020] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white transition cursor-pointer text-xs"
                >
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202020] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-white transition cursor-pointer text-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-[#262626] overflow-x-auto text-zinc-200 font-mono text-[11px] leading-relaxed flex-1">
              <code>{build.code?.ino || '// No firmware sketch'}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
