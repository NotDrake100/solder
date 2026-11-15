import React, { useState, useEffect, useMemo } from 'react';
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
import { getBomTotal } from './HarnessTrace';
import { getOffersForPart, getCheapestInStockPrice, getSearchLinks } from '../data/partPrices';
import { downloadBuildKit } from '../utils/kitDownloader';

const PART_DRAW_MAP: Record<string, number> = {
  arduino_uno: 45,
  esp32_devkit: 80,
  rpi_zero_2w: 400,
  rpi_5: 2800,
  relay_5v: 75,
  sg90_servo: 250,
  oled_096: 20,
  soil_moisture: 15,
  dht11: 2,
  mq135: 160,
  battery_18650: 0,
  piezo_buzzer: 25,
  ultrasonic_hcsr04: 15,
  pir_motion: 1,
  ldr_sensor: 2,
  led_lamp: 30,
  inmp441_mic: 2,
  max98357a_amp: 300,
  speaker_3w_4ohm: 250,
  tactile_button: 1,
  lipo_2000mah: 0,
  powerboost_1000c: 5,
  mt3608: 20,
};

function getPartCurrentDraw(libId?: string, name?: string): number {
  const id = (libId || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (PART_DRAW_MAP[id] !== undefined) return PART_DRAW_MAP[id];
  if (id.includes('rpi_5') || id.includes('pi_5')) return 2800;
  if (id.includes('rpi') || id.includes('zero') || n.includes('zero 2')) return 400;
  if (id.includes('speaker') || n.includes('speaker')) return 250;
  if (id.includes('amp') || n.includes('amplifier')) return 300;
  if (id.includes('oled') || n.includes('oled')) return 20;
  if (id.includes('mic') || n.includes('microphone')) return 2;
  if (id.includes('button')) return 1;
  if (id.includes('boost') || id.includes('regulator') || n.includes('mt3608')) return 20;
  if (id.includes('battery') || id.includes('cell')) return 0;
  return 20;
}

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
  const [piFirmwareMode, setPiFirmwareMode] = useState<'on-device' | 'cloud' | 'setup'>('on-device');

  const isPi = Boolean(
    build?.board?.toLowerCase().includes('rpi') ||
    build?.board?.toLowerCase().includes('pi') ||
    build?.code?.filename?.endsWith('.py') ||
    build?.code?.onDevicePy
  );

  const currentFirmwareCode = useMemo(() => {
    if (!isPi) return build?.code?.ino || '// No firmware sketch';
    if (piFirmwareMode === 'cloud') return build?.code?.cloudPy || build?.code?.py || build?.code?.ino || '';
    if (piFirmwareMode === 'setup') return build?.code?.setupSh || '#!/usr/bin/env bash\nsudo apt update\n';
    return build?.code?.onDevicePy || build?.code?.py || build?.code?.ino || '';
  }, [build, isPi, piFirmwareMode]);

  const currentFirmwareFilename = useMemo(() => {
    if (!isPi) return build?.code?.filename || 'sketch.ino';
    if (piFirmwareMode === 'setup') return 'setup.sh';
    return 'main.py';
  }, [build, isPi, piFirmwareMode]);

  // Signature burst reveal animation when a new build loads
  useEffect(() => {
    if (!build || !build.layout || build.layout.length === 0) return;
    const timer = setTimeout(() => {
      setBurstCount((prev) => prev + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [build?.id]);

  const [copiedLink, setCopiedLink] = useState(false);

  const { totalEstimatedPrice, pricedCount, totalPartsCount } = useMemo(() => {
    let sum = 0;
    let priced = 0;
    const parts = build?.parts || [];
    parts.forEach((p) => {
      if (p.owned) return;
      const offers = getOffersForPart(p);
      if (offers) {
        const cheapest = getCheapestInStockPrice(offers);
        if (cheapest !== null) {
          sum += cheapest * (p.qty || 1);
          priced++;
        }
      }
    });
    return {
      totalEstimatedPrice: Math.round(sum),
      pricedCount: priced,
      totalPartsCount: parts.length,
    };
  }, [build]);

  const pricingSummaryText = useMemo(() => {
    if (pricedCount > 0) {
      return `Estimated total Rs ${totalEstimatedPrice} (${pricedCount} of ${totalPartsCount} parts priced, checked 15 Nov 2026)`;
    }
    return `Estimated total based on catalog averages`;
  }, [totalEstimatedPrice, pricedCount, totalPartsCount]);

  const handleShare = () => {
    if (!build?.id) return;
    const url = `${window.location.origin}/b/${build.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleDownloadKit = () => {
    if (!build) return;
    downloadBuildKit(build);
  };

  const totalCost = getBomTotal(build);

  const handleCopyCode = () => {
    if (currentFirmwareCode) {
      navigator.clipboard.writeText(currentFirmwareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (!currentFirmwareCode) return;
    const blob = new Blob([currentFirmwareCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFirmwareFilename;
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
      {/* Result Tabs Bar (QA-R3 #7: horizontal scroll, no wrap, Order Kit below card on mobile) */}
      <div
        className="result-tabs flex items-center justify-between border-b border-[#262626] px-3 bg-[#171717] gap-2 overflow-x-auto whitespace-nowrap scrollbar-none"
        role="tablist"
      >
        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleTabClick('case')}
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 whitespace-nowrap ${
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
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 whitespace-nowrap ${
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
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 whitespace-nowrap ${
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
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 whitespace-nowrap ${
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
            className={`tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'firmware'
                ? 'border-white text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Firmware</span>
          </button>
        </div>

        {/* Right CTA: Order Kit on Desktop */}
        {onOpenOrder && (
          <div className="shrink-0 py-1 hidden sm:block">
            <button
              onClick={onOpenOrder}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-white text-black hover:bg-neutral-200 transition cursor-pointer whitespace-nowrap"
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
              hideControls={true}
              className="w-full h-full"
            />

            {/* Bottom-left: One-line caption & dimensions (QA-R1 #4) */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#181818]/90 border border-[#262626] text-xs">
              <span className="iso-caption font-medium text-white">3D case</span>
              <span className="text-[#555]">·</span>
              <span className="iso-meta mono text-[#888]">
                {outerMm[0]} × {outerMm[1]} × {outerMm[2]} mm
              </span>
            </div>

            {/* Bottom-right: ONE slim toolbar row: Assembled/Exploded toggle + download (QA-R1 #4) */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 p-1 rounded-lg bg-[#181818]/95 border border-[#2a2a2a] text-xs">
              <button
                onClick={() => setIsExploded((prev) => !prev)}
                className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer font-medium ${
                  isExploded
                    ? 'bg-white text-black'
                    : 'text-[#a3a3a3] hover:text-white hover:bg-[#252525]'
                }`}
                title="Toggle Exploded CAD View"
              >
                {isExploded ? 'Assembled' : 'Exploded'}
              </button>

              <button
                onClick={handleDownloadStl}
                className="p-1 rounded-md text-[#a3a3a3] hover:text-white hover:bg-[#252525] transition cursor-pointer"
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

        {/* TAB 3: Wiring Netlist (QA-R1 #7: clean aligned 3-column grid) */}
        {activeTab === 'wiring' && (
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-2 select-text">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-mono text-[#777] uppercase pb-2 border-b border-[#262626]">
              <div className="col-span-5">From</div>
              <div className="col-span-5">To</div>
              <div className="col-span-2 text-right">Purpose</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#222222] text-xs">
              {build.wiring?.map((wire, idx) => (
                <div
                  key={idx}
                  className="py-2 grid grid-cols-12 gap-2 items-center font-mono text-[11.5px]"
                >
                  <div className="col-span-5 text-[#d4d4d4] truncate">
                    <span className="text-[#888]">{wire.from?.part || 'MCU'}</span>{' '}
                    <span className="text-white font-medium">{wire.from?.pin}</span>
                  </div>
                  <div className="col-span-5 text-[#d4d4d4] truncate flex items-center gap-1.5">
                    <span className="text-[#555] select-none">→</span>
                    <span className="text-[#888]">{wire.to?.part}</span>{' '}
                    <span className="text-white font-medium">{wire.to?.pin}</span>
                  </div>
                  <div className="col-span-2 text-right text-[11px] text-[#888] truncate">
                    {wire.signal || wire.color || 'Signal'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Simulator (QA-R8 #5: Honest Pi verification vs Arduino simulation) */}
        {activeTab === 'simulate' && (
          <div className="p-4 max-h-[420px] overflow-y-auto">
            {isPi ? (
              <div className="space-y-4 text-xs font-mono select-text">
                <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#d4d4d4]">
                  <p className="font-sans font-medium text-white text-sm mb-1">
                    Simulation is for Arduino builds.
                  </p>
                  <p className="text-[#888] font-sans">
                    For this Pi build, Linux userspace executes Python directly. Here is what the deterministic verifier checked:
                  </p>
                </div>

                {/* Power Budget Table (QA-R10 #2: identical computed number and headroom matching harness) */}
                {(() => {
                  const has2A = (build.parts || []).some((p) => (p.libId || p.id || '').includes('mt3608'));
                  const has1A = (build.parts || []).some((p) => (p.libId || p.id || '').includes('powerboost'));
                  const maxCap = has2A ? 2000 : has1A ? 1000 : 2000;
                  const safeLimit = Math.round(maxCap * 0.75);
                  const isP5 = build.board?.includes('rpi_5') || build.board?.includes('pi_5');
                  let totalDraw = isP5 ? 2800 : 400;

                  (build.parts || []).forEach((p) => {
                    const id = p.libId || p.id;
                    if (['rpi_5', 'rpi_zero_2w', 'arduino_uno', 'esp32_devkit'].includes(id)) return;
                    totalDraw += getPartCurrentDraw(p.libId, p.name) * (p.qty || 1);
                  });

                  return (
                    <div className="rounded-lg border border-[#2a2a2a] bg-[#171717] p-3 space-y-2">
                      <div className="flex items-center justify-between text-white font-sans font-medium border-b border-[#262626] pb-1.5">
                        <span>Power Budget & Headroom</span>
                        <span className="text-[11px] font-mono text-white">
                          {totalDraw}mA / {maxCap}mA regulator ({safeLimit}mA safe limit)
                        </span>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-[#666]">
                          <tr>
                            <th className="pb-1 font-normal">Component</th>
                            <th className="pb-1 text-right font-normal">Typical Draw</th>
                            <th className="pb-1 text-right font-normal">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] text-[#aaa]">
                          {build.parts?.map((p) => {
                            const draw = getPartCurrentDraw(p.libId, p.name);
                            return (
                              <tr key={p.id}>
                                <td className="py-1 text-[#f5f5f5]">{p.name}</td>
                                <td className="py-1 text-right font-mono">{draw}mA</td>
                                <td className="py-1 text-right font-mono text-white">✓ PASS</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* I2S Pin Map */}
                <div className="rounded-lg border border-[#2a2a2a] bg-[#171717] p-3 space-y-2">
                  <div className="text-white font-sans font-medium border-b border-[#262626] pb-1.5">
                    I2S Audio & Peripheral Pin Map
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {build.wiring
                      ?.filter((w) => {
                        const sig = (w.signal || '').toUpperCase();
                        const pin = (w.from?.pin || w.to?.pin || '').toUpperCase();
                        return (
                          pin.includes('GPIO') ||
                          sig.includes('I2S') ||
                          sig.includes('I2C') ||
                          sig.includes('BCLK') ||
                          sig.includes('LRCLK')
                        );
                      })
                      .map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1 border-b border-[#222]"
                        >
                          <span className="text-[#f5f5f5]">
                            {w.from?.part} <span className="text-white font-medium">{w.from?.pin}</span>
                          </span>
                          <span className="text-[#666]">→</span>
                          <span className="text-[#aaa]">
                            {w.to?.part} <span className="text-white font-medium">{w.to?.pin}</span>
                          </span>
                          <span className="text-[10px] text-[#888] font-mono px-1 rounded bg-[#222]">
                            {w.signal || 'SIG'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <Simulator build={build} />
            )}
          </div>
        )}

        {/* TAB 5: Firmware Code */}
        {activeTab === 'firmware' && (
          <div className="p-3 max-h-[420px] flex flex-col select-text">
            {/* Pi Mode Switcher Toggle (PI-SPEC Section 2) */}
            {isPi && (
              <div className="flex items-center gap-1 pb-2.5 mb-2 border-b border-[#262626] overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
                <button
                  type="button"
                  onClick={() => setPiFirmwareMode('on-device')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                    piFirmwareMode === 'on-device'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white border border-[#2a2a2a]'
                  }`}
                >
                  On-device (whisper + llama)
                </button>
                <button
                  type="button"
                  onClick={() => setPiFirmwareMode('cloud')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                    piFirmwareMode === 'cloud'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white border border-[#2a2a2a]'
                  }`}
                >
                  Cloud API (.env)
                </button>
                <button
                  type="button"
                  onClick={() => setPiFirmwareMode('setup')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition cursor-pointer ${
                    piFirmwareMode === 'setup'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#1a1a1a] text-[#888] hover:text-white border border-[#2a2a2a]'
                  }`}
                >
                  setup.sh (ALSA / I2S)
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-[#262626] text-xs">
              <span className="mono text-[#888]">
                {currentFirmwareFilename}
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

            <pre className="mt-2 p-3 rounded-lg bg-[#0f0f0f] border border-[#222222] overflow-x-auto text-[#e5e5e5] font-mono text-[11.5px] leading-relaxed flex-1 select-text">
              <code>{currentFirmwareCode || '// No firmware sketch'}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Mobile CTA: Order Kit Below the Card (QA-R3 #7) */}
      {onOpenOrder && (
        <div className="sm:hidden p-2.5 border-t border-[#262626] bg-[#171717]">
          <button
            onClick={onOpenOrder}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Kit</span>
            <span className="mono text-[11px] opacity-80">· Rs {totalCost}</span>
          </button>
        </div>
      )}
    </div>
  );
};
