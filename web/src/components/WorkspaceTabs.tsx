import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Box,
  Share2,
  Code2,
  Copy,
  Download,
  Check,
  Zap,
  Sliders,
  Sparkles,
  ShoppingBag,
  Package,
  QrCode,
  RotateCcw,
  Layers,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { CaseViewer } from '../viewer';
import { WiringDiagram } from './WiringDiagram';
import { Simulator } from '../../../sim/Simulator';

interface WorkspaceTabsProps {
  build: SolderBuild;
  onOpenOrder: () => void;
  onOpenShip: () => void;
  onOpenAr: () => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  build,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
}) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'case' | 'wiring' | 'simulate' | 'code'>('case');
  const [isExploded, setIsExploded] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [materialTheme, setMaterialTheme] = useState<'pla' | 'acrylic' | 'dark'>('acrylic');

  // Auto-trigger signature burst reveal on mount / build change
  useEffect(() => {
    const timer = setTimeout(() => {
      setBurstCount((prev) => prev + 1);
    }, 450);
    return () => clearTimeout(timer);
  }, [build.id]);

  const totalPartsCost = build.parts.reduce(
    (sum, p) => sum + (p.owned ? 0 : p.priceInr * p.qty),
    0
  );
  const totalOwnedSavings = build.parts.reduce(
    (sum, p) => sum + (p.owned ? p.priceInr * p.qty : 0),
    0
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(build.code.ino);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([build.code.ino], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = build.code.filename || `${build.id}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBurstReveal = () => {
    setBurstCount((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Tab Navigation Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3 mb-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/60 shadow-inner">
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'parts'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-zinc-500" />
            <span>Parts</span>
            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full font-mono">
              ₹{totalPartsCost}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('case')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'case'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
            }`}
          >
            <Box className="w-4 h-4 text-emerald-600" />
            <span>3D Case</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'wiring'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Wiring</span>
            <span className="text-[10px] font-mono text-zinc-400">SVG</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'simulate'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>Simulate</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              avr8js
            </span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
            }`}
          >
            <Code2 className="w-4 h-4 text-sky-600" />
            <span>Firmware</span>
            <span className="text-[10px] font-mono text-zinc-400">.ino</span>
          </button>
        </div>

        {/* Action Buttons: Order, Ship, AR */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={onOpenOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition shadow-sm shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order It</span>
            <span className="text-[10px] font-mono opacity-80">(₹{totalPartsCost + 280})</span>
          </button>

          <button
            onClick={onOpenShip}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition shadow-xs shrink-0"
          >
            <Package className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ship It</span>
          </button>

          <button
            onClick={onOpenAr}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition shadow-xs shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-500" />
            <span>AR</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Parts List */}
      {activeTab === 'parts' && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-soft overflow-hidden animate-in fade-in duration-150">
          <div className="px-6 py-4 bg-zinc-50/70 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Bill of Materials (BOM)</h3>
              <p className="text-xs text-zinc-500">
                Verified against real physical parts library with exact INR market pricing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {totalOwnedSavings > 0 && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Scrap Savings: ₹{totalOwnedSavings}
                </div>
              )}
              <div className="text-xs font-bold text-zinc-900 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-xs">
                Total Kit: ₹{totalPartsCost}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/50 text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Component</th>
                  <th className="px-6 py-3 font-semibold">Library ID</th>
                  <th className="px-6 py-3 font-semibold">Role / Function</th>
                  <th className="px-6 py-3 font-semibold text-center">Qty</th>
                  <th className="px-6 py-3 font-semibold text-right">Price (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {build.parts.map((part) => (
                  <tr key={part.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-zinc-900 flex items-center gap-2">
                      <span>{part.name}</span>
                      {part.owned && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full">
                          In Drawer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-zinc-500">{part.libId}</td>
                    <td className="px-6 py-3.5 text-zinc-600 max-w-sm">{part.why}</td>
                    <td className="px-6 py-3.5 text-center font-semibold text-zinc-800">{part.qty}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-zinc-900">
                      {part.owned ? (
                        <span className="line-through text-zinc-400">₹{part.priceInr * part.qty}</span>
                      ) : (
                        `₹${part.priceInr * part.qty}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 3D Case Viewer */}
      {activeTab === 'case' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200">
            {/* Exploded / Assembled Toggle */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-zinc-200 shadow-xs">
              <button
                onClick={() => setIsExploded(false)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  !isExploded
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Assembled
              </button>
              <button
                onClick={() => setIsExploded(true)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  isExploded
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Exploded View
              </button>
            </div>

            {/* Signature Burst Reveal */}
            <button
              onClick={handleBurstReveal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs"
              title="Play signature slow-motion burst reveal animation"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Burst Reveal</span>
            </button>

            {/* Material Theme */}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="text-[11px] font-medium mr-1">Material:</span>
              <button
                onClick={() => setMaterialTheme('pla')}
                className={`px-2 py-1 rounded border text-[11px] ${
                  materialTheme === 'pla' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                Matte PLA
              </button>
              <button
                onClick={() => setMaterialTheme('acrylic')}
                className={`px-2 py-1 rounded border text-[11px] ${
                  materialTheme === 'acrylic' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                Frosted
              </button>
              <button
                onClick={() => setMaterialTheme('dark')}
                className={`px-2 py-1 rounded border text-[11px] ${
                  materialTheme === 'dark' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600'
                }`}
              >
                Carbon
              </button>
            </div>
          </div>

          {/* 3D Viewer Container */}
          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-zinc-200 shadow-soft bg-zinc-950 relative">
            <CaseViewer
              layout={build.layout}
              caseSpec={build.case}
              wiring={build.wiring}
              isExploded={isExploded}
              onExplodeToggle={setIsExploded}
              materialTheme={materialTheme}
              burstTrigger={burstCount}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Wiring & Simulator */}
      {activeTab === 'wiring' && (
        <div className="animate-in fade-in duration-150">
          <WiringDiagram build={build} />
        </div>
      )}

      {/* Tab 3.5: Virtual ATmega328P Hardware Simulator */}
      {activeTab === 'simulate' && (
        <div className="animate-in fade-in duration-150">
          <Simulator hex={build.hex} ino={build.code?.ino} className="w-full" />
        </div>
      )}

      {/* Tab 4: Arduino C++ Code */}
      {activeTab === 'code' && (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-soft overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-5 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-mono font-medium text-zinc-300">
                {build.code.filename || `${build.id}.ino`}
              </span>
              <span className="text-[10px] uppercase font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                {build.board === 'esp32' ? 'ESP32 C++' : 'Arduino AVR'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ino</span>
              </button>
            </div>
          </div>

          {/* Syntax Code Editor Box */}
          <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-zinc-300">
            <pre className="selection:bg-zinc-700">
              <code>{build.code.ino}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
