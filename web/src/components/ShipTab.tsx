import React from 'react';
import { ProductMarketing } from '../types';
import { Package, CheckCircle2, Sparkles, Tag } from 'lucide-react';

interface ShipTabProps {
  product?: ProductMarketing;
  productName: string;
}

export const ShipTab: React.FC<ShipTabProps> = ({ product, productName }) => {
  const headline = product?.pageHeadline || `The elegant open-source hardware kit for ${productName}.`;
  const bullets = product?.bullets || [
    'Fully custom 3D-printable enclosure with snap-fit lid and cable grommets',
    'Pre-tested Arduino firmware with serial diagnostics and test assertions',
    'Standard maker parts with accessible Indian supplier sourcing',
    'Beginner-friendly step-by-step assembly instructions included',
  ];
  const boxSvg = product?.boxSvg;

  return (
    <div className="space-y-6">
      {/* Packaging & Marketing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Art Preview */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Package className="w-4 h-4 text-zinc-700" />
            <h4 className="text-sm font-bold text-zinc-900 tracking-tight">Retail Packaging Preview</h4>
          </div>

          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-200/80 shadow-md bg-[#09090b] p-4 flex items-center justify-center min-h-[260px]">
            {boxSvg ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: boxSvg }}
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Package className="w-12 h-12 text-zinc-600 mx-auto" />
                <h5 className="text-xl font-bold text-white tracking-wider uppercase font-mono">{productName}</h5>
                <p className="text-xs text-zinc-400">Maker Edition Hardware Kit</p>
                <div className="inline-block px-3 py-1 rounded bg-zinc-800 text-emerald-400 font-mono text-xs font-semibold">
                  SOLDER CERTIFIED BUILD
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-4">
            Custom printable cardboard sleeve template with silkscreen layout
          </p>
        </div>

        {/* Product Copy & Bullets */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full w-fit mb-4">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Product Studio</span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-3">
              {headline}
            </h3>

            <div className="space-y-3 mt-4">
              {bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 mt-6 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 uppercase font-semibold block">Suggested Retail</span>
              <span className="text-xl font-bold text-zinc-900">
                ₹{(product?.priceInr || 1250).toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Export Store Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
