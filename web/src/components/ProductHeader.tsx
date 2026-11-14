import React, { useState } from 'react';
import { ProductBuild } from '../types';
import { Share2, Download, Check, Sparkles, Box } from 'lucide-react';

interface ProductHeaderProps {
  build: ProductBuild;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ build }) => {
  const [copied, setCopied] = useState(false);

  const calculateTotalInr = () => {
    if (!build.parts || !build.parts.length) return 0;
    return build.parts.reduce((sum, p) => sum + (p.priceInr || 0) * (p.qty || 1), 0);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(build, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${build.name.toLowerCase()}_build.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalInr = calculateTotalInr();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {build.name}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                build.board.toLowerCase().includes('esp32')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-sky-50 text-sky-700 border border-sky-200/70'
              }`}
            >
              {build.board.toUpperCase() === 'UNO' ? 'Arduino Uno' : build.board.toUpperCase()}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Verified Hardware
            </span>
          </div>

          <p className="text-sm font-medium text-zinc-700">
            {build.tagline}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-3xl leading-relaxed">
            {build.summary}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          <div className="text-right pr-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Estimated Total
            </span>
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              ₹{totalInr.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportJson}
              title="Download Full Build JSON"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Copy Share Link"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
