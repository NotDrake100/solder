import React, { useState } from 'react';
import { CaseInfo, LayoutItem } from '../types';
import {
  RotateCcw,
  Sparkles,
  Download,
  Box,
  Eye,
  Maximize2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { CaseViewer } from '../viewer/CaseViewer';

interface CaseTabProps {
  layout: LayoutItem[];
  caseData: CaseInfo;
  productName: string;
}

export const CaseTab: React.FC<CaseTabProps> = ({
  layout,
  caseData,
  productName,
}) => {
  const [isExploded, setIsExploded] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [showCase, setShowCase] = useState(true);

  const handleDownloadScad = () => {
    const content = caseData.scad || `// Solder Enclosure for ${productName}\nouter = [${caseData.outerMm.join(', ')}];\nwall = ${caseData.wallMm};\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.toLowerCase()}_enclosure.scad`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadStlPlaceholder = () => {
    // Downloads OpenSCAD script for slice/export
    handleDownloadScad();
  };

  return (
    <div className="space-y-4">
      {/* 3D Canvas Box */}
      <div className="relative w-full h-[520px] sm:h-[580px] bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm flex flex-col">
        {/* Top Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Dimension specs badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs text-xs font-medium text-zinc-800">
            <Box className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              {caseData.outerMm[0]} × {caseData.outerMm[1]} × {caseData.outerMm[2]} mm
            </span>
            <span className="text-zinc-300">•</span>
            <span>{caseData.wallMm}mm wall</span>
            <span className="text-zinc-300">•</span>
            <span className="capitalize">{caseData.lidType} lid</span>
            {caseData.clearanceMm && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Fits ✓ {caseData.clearanceMm}mm clearance
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Assembled / Exploded Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-xs">
              <button
                type="button"
                onClick={() => setIsExploded(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !isExploded
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Assembled
              </button>
              <button
                type="button"
                onClick={() => setIsExploded(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isExploded
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Exploded
              </button>
            </div>

            {/* Replay Burst */}
            <button
              type="button"
              onClick={() => setBurstKey((k) => k + 1)}
              title="Replay slow-motion burst reveal animation"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-zinc-50 active:scale-95 backdrop-blur-md border border-zinc-200/90 text-xs font-medium text-zinc-700 hover:text-zinc-900 shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Burst Reveal</span>
            </button>

            {/* Download STL / OpenSCAD */}
            <button
              type="button"
              onClick={handleDownloadStlPlaceholder}
              title="Download 3D printable Enclosure file (.scad / STL)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white text-xs font-medium shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>Download STL / SCAD</span>
            </button>
          </div>
        </div>

        {/* 3D Canvas Mount */}
        <div className="w-full flex-1 relative bg-gradient-to-b from-[#fafafa] to-[#f4f4f5]">
          <CaseViewer
            layout={layout}
            caseData={caseData}
            isExploded={isExploded}
            onToggleExploded={() => setIsExploded(!isExploded)}
            burstKey={burstKey}
            className="w-full h-full"
          />
        </div>

        {/* Bottom Orbit / Controls Hint */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-zinc-400 pointer-events-none">
          <div className="flex items-center gap-3">
            <span>• Left click to rotate</span>
            <span>• Right click to pan</span>
            <span>• Scroll to zoom</span>
          </div>
          <div className="pointer-events-auto bg-white/80 backdrop-blur px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 font-mono text-[10px]">
            {layout.length} parts mapped to 3D meshes
          </div>
        </div>
      </div>
    </div>
  );
};
