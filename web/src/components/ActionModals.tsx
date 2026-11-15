import React, { useState } from 'react';
import { X, ShoppingBag, Box, Check, Copy, ExternalLink, QrCode, Sparkles, Download } from 'lucide-react';
import type { SolderBuild } from '../types';
import { downloadBuildKit } from '../utils/kitDownloader';
import { getOffersForPart, getCheapestInStockPrice } from '../data/partPrices';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: SolderBuild;
  savingsInr?: number;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  build,
  savingsInr = 0,
}) => {
  if (!isOpen) return null;

  const grandTotal = Math.round(
    build.parts.reduce((sum, p) => {
      if (p.owned) return sum;
      const offers = getOffersForPart(p);
      const cheapest = offers ? getCheapestInStockPrice(offers) : null;
      const price = cheapest !== null ? cheapest : (p.priceInr || 0);
      return sum + price * (p.qty || 1);
    }, 0)
  );

  const handleDownload = () => {
    downloadBuildKit(build);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#141414] text-[#f5f5f5] rounded-2xl max-w-lg w-full border border-[#2a2a2a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Maker Kit</h2>
              <p className="text-xs text-[#888]">Bill of materials & component kit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#888] hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Parts Breakdown */}
          <div className="border border-[#262626] rounded-xl divide-y divide-[#262626] text-xs">
            <div className="p-3 bg-[#1a1a1a] font-semibold text-[#ccc] flex justify-between">
              <span>Component Bill of Materials</span>
              <span>Price</span>
            </div>
            {build.parts.map((p) => {
              const offers = getOffersForPart(p);
              const cheapest = offers ? getCheapestInStockPrice(offers) : null;
              const price = cheapest !== null ? cheapest : (p.priceInr || 0);
              return (
                <div key={p.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-[#888] ml-1">× {p.qty || 1}</span>
                    {p.owned && (
                      <span className="ml-2 text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-mono font-medium">
                        Owned
                      </span>
                    )}
                  </div>
                  <span className={`font-mono ${p.owned ? 'line-through text-[#666]' : 'text-white'}`}>
                    ₹{Math.round(price * (p.qty || 1))}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Kit Total Summary */}
          <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#888]">Kit Total (INR)</div>
              {savingsInr > 0 && (
                <div className="text-[11px] font-mono text-[#aaa]">
                  Saved ₹{savingsInr} with Scrap Mode
                </div>
              )}
            </div>
            <div className="text-2xl font-bold font-mono text-white">₹{grandTotal}</div>
          </div>

          {/* Download kit + Buy note */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleDownload}
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download kit</span>
            </button>
            <p className="text-center text-xs text-[#888]">
              Buy each part from the links in the Parts tab
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShipModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: SolderBuild;
}

export const ShipModal: React.FC<ShipModalProps> = ({
  isOpen,
  onClose,
  build,
}) => {
  if (!isOpen) return null;

  const handleDownloadSvg = () => {
    const blob = new Blob([build.product?.boxSvg || '<svg></svg>'], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${build.id}-packaging-box.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Product Page & Retail Box</h2>
              <p className="text-xs text-zinc-500">Production-ready packaging & marketing assets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Packaging Box SVG Artwork */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                Retail Box Die-Cut Art Preview
              </span>
              <button
                onClick={handleDownloadSvg}
                className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </button>
            </div>
            <div className="bg-zinc-100 rounded-xl p-4 flex items-center justify-center border border-zinc-200 overflow-hidden max-h-56">
              {build.product?.boxSvg ? (
                <div
                  className="w-full flex items-center justify-center scale-90"
                  dangerouslySetInnerHTML={{ __html: build.product.boxSvg }}
                />
              ) : (
                <div className="text-xs text-zinc-400 py-8">Box SVG Generating...</div>
              )}
            </div>
          </div>

          {/* Product Headline & Marketing Copy */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Commercial Headline
            </span>
            <h3 className="text-base font-bold text-zinc-900">
              {build.product?.pageHeadline || build.name}
            </h3>
            <p className="text-xs text-zinc-600">{build.summary}</p>
            <ul className="mt-3 space-y-1.5 text-xs text-zinc-700">
              {build.product?.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ArModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: SolderBuild;
}

export const ArModal: React.FC<ArModalProps> = ({ isOpen, onClose, build }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">AR Desk Fit Check</h2>
              <p className="text-xs text-zinc-500">View real 1:1 scale enclosure on your desk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="w-48 h-48 bg-zinc-50 border-2 border-zinc-200 rounded-2xl flex flex-col items-center justify-center mx-auto p-4 shadow-inner">
            <QrCode className="w-24 h-24 text-zinc-800" />
            <span className="text-[11px] font-mono text-zinc-500 mt-2">solder.local/ar/{build.id}</span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-900">Scan with your smartphone camera</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Supports Google Scene Viewer (Android) & Apple AR Quick Look (iOS) via WebXR &amp; &lt;model-viewer&gt;.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-1">
            <div className="font-semibold text-zinc-800">Physical Dimensions (1:1):</div>
            <div className="text-zinc-600 font-mono">
              {build.case.outerMm ? `${build.case.outerMm[0]} × ${build.case.outerMm[1]} × ${build.case.outerMm[2]} mm` : '120 × 85 × 35 mm'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, buildId }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/b/${buildId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">Share &amp; Remix Build</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Anyone with this permalink can load the full 3D case, wiring diagram, simulator, and Arduino code.
        </p>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent text-xs text-zinc-800 font-mono focus:outline-hidden"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition shrink-0"
          >
            {copied ? (
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
        </div>
      </div>
    </div>
  );
};
