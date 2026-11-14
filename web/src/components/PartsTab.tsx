import React from 'react';
import { PartItem } from '../types';
import { Cpu, Info, CheckCircle, ShoppingBag } from 'lucide-react';

interface PartsTabProps {
  parts: PartItem[];
}

export const PartsTab: React.FC<PartsTabProps> = ({ parts }) => {
  const partsSubtotal = parts.reduce(
    (sum, p) => sum + (p.priceInr || 0) * (p.qty || 1),
    0
  );
  const estimatedPrintingInr = 250;
  const grandTotal = partsSubtotal + estimatedPrintingInr;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Bill of Materials (BOM)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Maker-accessible standard components verified in library with real footprints
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
            {parts.length} Items
          </span>
        </div>

        {/* Table for md+ screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-100 text-[11px]">
              <tr>
                <th className="py-3 px-5">Component</th>
                <th className="py-3 px-4">Library ID</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4">Why it was chosen</th>
                <th className="py-3 px-5 text-right">Price (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
              {parts.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-zinc-900 text-sm">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/60">
                      {p.libId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-zinc-900">
                    {p.qty}
                  </td>
                  <td className="py-3.5 px-4 max-w-md text-zinc-600 leading-relaxed">
                    {p.why}
                  </td>
                  <td className="py-3.5 px-5 text-right font-semibold text-zinc-900 text-sm">
                    ₹{(p.priceInr * (p.qty || 1)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards for mobile */}
        <div className="md:hidden divide-y divide-zinc-100">
          {parts.map((p, idx) => (
            <div key={p.id || idx} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {p.name}
                  </h4>
                  <span className="inline-block font-mono text-[10px] text-zinc-500 mt-0.5 px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/60">
                    {p.libId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900">
                    ₹{(p.priceInr * (p.qty || 1)).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[11px] text-zinc-400">
                    Qty: {p.qty}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {p.why}
              </p>
            </div>
          ))}
        </div>

        {/* Cost summary footer */}
        <div className="bg-zinc-50/70 p-4 sm:p-5 border-t border-zinc-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Prices sourced from Indian maker distributors (Robocraze, Robu, ElectronicsComp).</span>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 text-sm">
            <div>
              <span className="text-zinc-500 text-xs block">Parts Subtotal:</span>
              <span className="font-semibold text-zinc-800">
                ₹{partsSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-xs block">3D Print Shell:</span>
              <span className="font-semibold text-zinc-800">
                ₹{estimatedPrintingInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pl-4 border-l border-zinc-200">
              <span className="text-zinc-500 text-xs block uppercase font-medium tracking-wider">
                Total Build:
              </span>
              <span className="text-lg font-bold text-zinc-900">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
