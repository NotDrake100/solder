import React from 'react';
import { PartItem } from '../types';
import { ShoppingCart, Truck, MapPin, Store, CheckCircle2, ExternalLink } from 'lucide-react';

interface OrderTabProps {
  parts: PartItem[];
  productName: string;
}

export const OrderTab: React.FC<OrderTabProps> = ({ parts, productName }) => {
  const partsSubtotal = parts.reduce((sum, p) => sum + (p.priceInr || 0) * (p.qty || 1), 0);
  const printServiceInr = 280;
  const shippingInr = 80;
  const totalInr = partsSubtotal + printServiceInr + shippingInr;

  const suppliers = [
    { name: 'Robocraze India', location: 'Bengaluru / Pune', delivery: '2-3 Business Days', rating: '4.8★' },
    { name: 'Robu.in', location: 'Pune Hub', delivery: '1-2 Days', rating: '4.9★' },
    { name: 'ElectronicsComp', location: 'New Delhi', delivery: '3-4 Days', rating: '4.7★' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-zinc-800" />
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Order 1-Click Maker Kit for {productName}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Curated bill of materials bundled with local 3D print fabrication in India
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Kit Total with Print & Shipping
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              ₹{totalInr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts Basket */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-zinc-900">Components in Kit ({parts.length})</h4>
          <div className="divide-y divide-zinc-100 text-xs">
            {parts.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-800">{p.name}</span>
                  <span className="text-zinc-400 ml-2 text-[11px]">× {p.qty}</span>
                </div>
                <span className="font-medium text-zinc-900">
                  ₹{(p.priceInr * (p.qty || 1)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="py-2.5 flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-zinc-400" />
                3D Print Enclosure (PLA Matt White)
              </span>
              <span className="font-semibold text-zinc-900">₹{printServiceInr}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-zinc-400" />
                Standard India SpeedPost / Bluedart Delivery
              </span>
              <span className="font-semibold text-zinc-900">₹{shippingInr}</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Order Complete Maker Kit (₹{totalInr.toLocaleString('en-IN')})</span>
          </button>
        </div>

        {/* Local Suppliers */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-zinc-900">Recommended Indian Suppliers</h4>
          <div className="space-y-3">
            {suppliers.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900">{s.name}</span>
                  <span className="text-[11px] text-amber-600 font-semibold">{s.rating}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                  <span>{s.location}</span>
                  <span>{s.delivery}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-zinc-400 leading-relaxed">
            * Estimates based on current live stock across Pune & Bengaluru hubs.
          </div>
        </div>
      </div>
    </div>
  );
};
