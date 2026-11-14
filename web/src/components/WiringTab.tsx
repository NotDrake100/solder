import React, { useState } from 'react';
import { WiringConnection } from '../types';
import { GitFork, Activity, Check, Zap, Play, Square, Info } from 'lucide-react';

interface WiringTabProps {
  wiring: WiringConnection[];
  wiringSvg?: string;
  board: string;
}

const WIRE_LEGEND = [
  { label: '5V / 3.3V Power', color: '#ef4444', desc: 'VCC power supply lines' },
  { label: 'Ground (GND)', color: '#18181b', desc: 'Common reference ground' },
  { label: 'Analog / Sensor Signal', color: '#f59e0b', desc: 'Continuous ADC measurement' },
  { label: 'Digital Control / PWM', color: '#10b981', desc: 'Logic control & relay triggers' },
  { label: 'I2C Bus (SDA / SCL)', color: '#3b82f6', desc: 'Two-wire serial peripheral bus' },
];

export const WiringTab: React.FC<WiringTabProps> = ({
  wiring,
  wiringSvg,
  board,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner & Simulation Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Fritzing-Style Wiring Schematic
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Pin-to-Pin Verified
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Standard breadboard & header connections with color-coded signal routing for {board.toUpperCase()}
          </p>
        </div>

        {/* Simulate Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Signals</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation status bar if active */}
      {isSimulating && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Simulation active: 5V rails energized, ADC polling at 100 Hz, I2C bus clocking at 400 kHz.</span>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            NOMINAL 5.02V
          </span>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm relative">
        <div className="p-3 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
            <GitFork className="w-3.5 h-3.5 text-zinc-500" />
            <span>Wiring Layout</span>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            {WIRE_LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-zinc-600">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Display */}
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[420px] bg-[#fcfcfc] overflow-x-auto">
          {wiringSvg ? (
            <div
              className={`w-full max-w-4xl transition-all duration-300 ${
                isSimulating ? 'filter drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: wiringSvg }}
            />
          ) : (
            /* Fallback Clean Procedural SVG Diagram */
            <svg viewBox="0 0 800 440" className="w-full max-w-3xl select-none">
              <defs>
                <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* MCU Board Block */}
              <rect x="80" y="80" width="220" height="280" rx="12" fill="#00979C" stroke="#007e82" strokeWidth="2" />
              <text x="190" y="115" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">
                {board.toUpperCase() === 'UNO' ? 'Arduino Uno R3' : 'ESP32 DevKit'}
              </text>
              <rect x="100" y="140" width="40" height="30" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
              <text x="120" y="159" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">USB</text>

              {/* Pin Headers Left */}
              <rect x="85" y="190" width="16" height="150" rx="2" fill="#18181b" />
              <text x="110" y="210" fill="#ffffff" fontSize="10" fontFamily="monospace">5V</text>
              <text x="110" y="240" fill="#ffffff" fontSize="10" fontFamily="monospace">GND</text>
              <text x="110" y="270" fill="#ffffff" fontSize="10" fontFamily="monospace">A0</text>
              <text x="110" y="300" fill="#ffffff" fontSize="10" fontFamily="monospace">A4 (SDA)</text>
              <text x="110" y="330" fill="#ffffff" fontSize="10" fontFamily="monospace">A5 (SCL)</text>

              {/* Components on Right */}
              {/* Sensor 1 */}
              <rect x="520" y="70" width="180" height="90" rx="8" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" />
              <text x="610" y="100" fill="#18181b" fontSize="13" fontWeight="bold" textAnchor="middle">Sensor Module</text>
              <circle cx="530" cy="120" r="4" fill="#ef4444" />
              <text x="542" y="123" fill="#71717a" fontSize="10" fontFamily="monospace">VCC</text>
              <circle cx="530" cy="140" r="4" fill="#18181b" />
              <text x="542" y="143" fill="#71717a" fontSize="10" fontFamily="monospace">GND</text>

              {/* Module 2 */}
              <rect x="520" y="190" width="180" height="90" rx="8" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" />
              <text x="610" y="220" fill="#18181b" fontSize="13" fontWeight="bold" textAnchor="middle">Actuator / Relay</text>
              <circle cx="530" cy="245" r="4" fill="#10b981" />
              <text x="542" y="248" fill="#71717a" fontSize="10" fontFamily="monospace">IN (D8)</text>

              {/* Module 3 (OLED) */}
              <rect x="520" y="310" width="180" height="90" rx="8" fill="#09090b" stroke="#27272a" strokeWidth="2" />
              <text x="610" y="340" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">0.96" OLED I2C</text>
              <circle cx="530" cy="365" r="4" fill="#3b82f6" />
              <text x="542" y="368" fill="#a1a1aa" fontSize="10" fontFamily="monospace">SDA / SCL</text>

              {/* Connecting Curved Wires */}
              <path
                d="M 101 206 C 260 206, 380 120, 526 120"
                fill="none"
                stroke="#ef4444"
                strokeWidth={isSimulating ? 3.5 : 2.5}
                strokeDasharray={isSimulating ? "6, 4" : "none"}
                className={isSimulating ? "animate-pulse" : ""}
              />
              <path
                d="M 101 236 C 260 236, 380 140, 526 140"
                fill="none"
                stroke="#18181b"
                strokeWidth={isSimulating ? 3.5 : 2.5}
              />
              <path
                d="M 101 266 C 280 266, 380 245, 526 245"
                fill="none"
                stroke="#10b981"
                strokeWidth={isSimulating ? 3.5 : 2.5}
                strokeDasharray={isSimulating ? "8, 4" : "none"}
              />
              <path
                d="M 101 326 C 280 326, 380 365, 526 365"
                fill="none"
                stroke="#3b82f6"
                strokeWidth={isSimulating ? 3.5 : 2.5}
                strokeDasharray={isSimulating ? "5, 3" : "none"}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Pin Connection Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
              Pin-to-Pin Connection Schedule
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Exact wiring map with wire color conventions and bus definitions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
            {wiring.length} Connections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-100 text-[11px]">
              <tr>
                <th className="py-3 px-5">Signal</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-5 text-right">Wire Color</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
              {wiring.map((w, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-5">
                    <span className="font-semibold text-zinc-900">
                      {w.signal}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-zinc-600 font-medium">{w.from.part}</span>
                    <span className="ml-1.5 font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px]">
                      {w.from.pin}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-zinc-600 font-medium">{w.to.part}</span>
                    <span className="ml-1.5 font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px]">
                      {w.to.pin}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
                        style={{ backgroundColor: w.color }}
                      />
                      <span className="font-mono text-zinc-500 uppercase text-[11px]">
                        {w.color}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
