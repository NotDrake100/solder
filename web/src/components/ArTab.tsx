import React from 'react';
import { QrCode, Smartphone, View, Sparkles } from 'lucide-react';

interface ArTabProps {
  productName: string;
}

export const ArTab: React.FC<ArTabProps> = ({ productName }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-8 shadow-sm flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4 text-zinc-900 shadow-2xs">
          <View className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">
          View {productName} in Augmented Reality
        </h3>
        <p className="text-xs text-zinc-500 mt-1.5 max-w-md leading-relaxed">
          Scan this QR code with your iPhone (USDZ / Quick Look) or Android phone (Scene Viewer) to preview the assembled enclosure on your real desk.
        </p>

        {/* QR Code Graphic */}
        <div className="my-6 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col items-center">
          <svg
            className="w-48 h-48"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Clean QR Code Vector */}
            <rect width="100" height="100" fill="#ffffff" />
            {/* Top-left marker */}
            <rect x="10" y="10" width="28" height="28" fill="#18181b" rx="4" />
            <rect x="16" y="16" width="16" height="16" fill="#ffffff" />
            <rect x="20" y="20" width="8" height="8" fill="#18181b" />

            {/* Top-right marker */}
            <rect x="62" y="10" width="28" height="28" fill="#18181b" rx="4" />
            <rect x="68" y="16" width="16" height="16" fill="#ffffff" />
            <rect x="72" y="20" width="8" height="8" fill="#18181b" />

            {/* Bottom-left marker */}
            <rect x="10" y="62" width="28" height="28" fill="#18181b" rx="4" />
            <rect x="16" y="68" width="16" height="16" fill="#ffffff" />
            <rect x="20" y="72" width="8" height="8" fill="#18181b" />

            {/* Matrix dots */}
            <rect x="44" y="12" width="6" height="6" fill="#18181b" />
            <rect x="52" y="20" width="6" height="6" fill="#18181b" />
            <rect x="44" y="28" width="6" height="6" fill="#18181b" />
            <rect x="12" y="44" width="6" height="6" fill="#18181b" />
            <rect x="24" y="48" width="6" height="6" fill="#18181b" />
            <rect x="44" y="44" width="12" height="12" fill="#18181b" rx="2" />
            <rect x="64" y="44" width="6" height="6" fill="#18181b" />
            <rect x="80" y="48" width="8" height="6" fill="#18181b" />
            <rect x="44" y="64" width="8" height="6" fill="#18181b" />
            <rect x="56" y="72" width="6" height="8" fill="#18181b" />
            <rect x="72" y="64" width="12" height="6" fill="#18181b" />
            <rect x="68" y="78" width="8" height="10" fill="#18181b" />
            <rect x="84" y="80" width="6" height="8" fill="#18181b" />
          </svg>

          <span className="text-[11px] font-mono text-zinc-500 mt-2">
            solder.io/ar/{productName.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <span>iOS Quick Look (USDZ)</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            <span>Android SceneViewer (GLB)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
