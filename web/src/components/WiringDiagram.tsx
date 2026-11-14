import React, { useState } from 'react';
import { Play, Pause, Zap, Info, Sliders, Cpu, Activity } from 'lucide-react';
import type { WireConnection, SolderBuild } from '../types';
import { ArduinoSimulator } from '../sim';

interface WiringDiagramProps {
  build: SolderBuild;
}

export const WiringDiagram: React.FC<WiringDiagramProps> = ({ build }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<{ part: string; pin: string; signal?: string } | null>(null);

  const wires = build.wiring || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200/90 shadow-soft overflow-hidden">
      {/* Header bar with Simulate toggle */}
      <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-zinc-900">
            {isSimulating ? 'Interactive Hardware Simulation (avr8js)' : 'Circuit Schematic & Pinout Netlist'}
          </h3>
          <span className="text-[11px] font-mono text-zinc-400 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
            {wires.length} wires
          </span>
        </div>

        {/* Simulate Switch */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-zinc-600">Simulate Firmware</span>
          <button
            type="button"
            role="switch"
            aria-checked={isSimulating}
            onClick={() => setIsSimulating(!isSimulating)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isSimulating ? 'bg-emerald-600' : 'bg-zinc-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isSimulating ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main View: Either Simulator or Interactive SVG Schematic */}
      {isSimulating ? (
        <div className="p-4 flex-1 overflow-y-auto">
          <ArduinoSimulator
            hex={build.hex}
            inoCode={build.code.ino}
            board={build.board}
            tests={build.tests}
            parts={build.parts}
            className="w-full"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
          {/* Wire Legend */}
          <div className="flex items-center gap-3 text-xs mb-3 px-2 text-zinc-500 overflow-x-auto">
            <span className="font-semibold text-zinc-700">Wire Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>5V Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900"></span>
              <span>Ground (GND)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>I2C SDA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <span>I2C SCL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Analog / Digital</span>
            </div>
          </div>

          {/* SVG Schematic Canvas */}
          <div className="flex-1 bg-zinc-900 rounded-xl p-4 flex items-center justify-center relative overflow-hidden border border-zinc-800 shadow-inner">
            <svg
              className="w-full h-full min-h-[360px] max-h-[500px]"
              viewBox="0 0 800 480"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#27272a" strokeWidth="0.8" />
                </pattern>
                {/* Glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Central Microcontroller Block (Uno or ESP32) */}
              <g transform="translate(80, 80)">
                <rect
                  width="220"
                  height="300"
                  rx="12"
                  fill="#065f46"
                  stroke="#10b981"
                  strokeWidth="2"
                  filter="url(#glow)"
                />
                <rect x="15" y="15" width="40" height="30" rx="4" fill="#94a3b8" />
                <text x="35" y="34" fill="#1e293b" fontSize="9" fontWeight="bold" textAnchor="middle">
                  USB
                </text>
                <circle cx="35" cy="70" r="14" fill="#0f172a" stroke="#64748b" />
                <text x="35" y="73" fill="#cbd5e1" fontSize="8" textAnchor="middle">
                  PWR
                </text>

                <text x="110" y="40" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">
                  {build.board === 'esp32' ? 'ESP32 DEVKIT V1' : 'ARDUINO UNO R3'}
                </text>
                <text x="110" y="58" fill="#a7f3d0" fontSize="10" textAnchor="middle">
                  ATmega328P / 16MHz
                </text>

                {/* Left Header Pins */}
                <g transform="translate(10, 90)">
                  {['RESET', '3.3V', '5V', 'GND', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map(
                    (pin, i) => (
                      <g
                        key={pin}
                        transform={`translate(0, ${i * 18})`}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPin({ part: build.board, pin, signal: `Microcontroller ${pin}` })
                        }
                        onMouseLeave={() => setHoveredPin(null)}
                      >
                        <rect width="32" height="12" rx="3" fill="#047857" stroke="#34d399" />
                        <text x="16" y="9" fill="#ecfdf5" fontSize="8" textAnchor="middle">
                          {pin}
                        </text>
                        <circle cx="36" cy="6" r="3" fill="#fbbf24" />
                      </g>
                    )
                  )}
                </g>

                {/* Right Header Pins */}
                <g transform="translate(178, 90)">
                  {['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'].map(
                    (pin, i) => (
                      <g
                        key={pin}
                        transform={`translate(0, ${i * 18})`}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPin({ part: build.board, pin, signal: `Microcontroller ${pin}` })
                        }
                        onMouseLeave={() => setHoveredPin(null)}
                      >
                        <rect width="32" height="12" rx="3" fill="#047857" stroke="#34d399" />
                        <text x="16" y="9" fill="#ecfdf5" fontSize="8" textAnchor="middle">
                          {pin}
                        </text>
                        <circle cx="-4" cy="6" r="3" fill="#fbbf24" />
                      </g>
                    )
                  )}
                </g>
              </g>

              {/* Peripheral Module 1 (e.g. Sensor / Relay) */}
              <g transform="translate(500, 70)">
                <rect width="200" height="140" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="100" y="30" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {build.parts[1]?.name || 'Sensor Module'}
                </text>
                <text x="100" y="48" fill="#94a3b8" fontSize="10" textAnchor="middle">
                  {build.parts[1]?.libId || 'probe'}
                </text>

                {/* Sensor Pins */}
                <g transform="translate(15, 75)">
                  {['VCC', 'GND', 'AOUT / DATA'].map((pin, i) => (
                    <g key={pin} transform={`translate(0, ${i * 20})`}>
                      <circle cx="0" cy="6" r="4" fill="#fbbf24" />
                      <rect x="10" width="80" height="14" rx="3" fill="#334155" />
                      <text x="50" y="11" fill="#f8fafc" fontSize="9" textAnchor="middle">
                        {pin}
                      </text>
                    </g>
                  ))}
                </g>
              </g>

              {/* Peripheral Module 2 (e.g. Actuator / OLED) */}
              <g transform="translate(500, 260)">
                <rect width="200" height="150" rx="10" fill="#18181b" stroke="#a855f7" strokeWidth="2" />
                <text x="100" y="30" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">
                  {build.parts[2]?.name || 'Actuator Module'}
                </text>
                <text x="100" y="48" fill="#c084fc" fontSize="10" textAnchor="middle">
                  {build.parts[2]?.libId || 'output'}
                </text>

                {/* Actuator Pins */}
                <g transform="translate(15, 75)">
                  {['VCC', 'GND', 'IN / SCL', 'SDA'].map((pin, i) => (
                    <g key={pin} transform={`translate(0, ${i * 18})`}>
                      <circle cx="0" cy="6" r="4" fill="#fbbf24" />
                      <rect x="10" width="70" height="13" rx="3" fill="#27272a" />
                      <text x="45" y="10" fill="#e4e4e7" fontSize="8" textAnchor="middle">
                        {pin}
                      </text>
                    </g>
                  ))}
                </g>
              </g>

              {/* Curved Animated Connecting Wires */}
              {wires.map((wire, idx) => {
                const isPower = wire.color === '#e11d48' || wire.color === '#ef4444';
                const isGnd = wire.color === '#18181b' || wire.color === '#000000';
                const strokeColor = wire.color || (isPower ? '#ef4444' : isGnd ? '#52525b' : '#38bdf8');
                const startY = 170 + (idx % 8) * 18;
                const endY = idx < 4 ? 140 + idx * 20 : 330 + (idx - 4) * 18;

                const pathData = `M 290 ${startY} C 380 ${startY}, 420 ${endY}, 515 ${endY}`;

                return (
                  <g key={idx} className="group">
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="transition-all hover:stroke-white hover:stroke-[5px]"
                    />
                    {/* Animated current dots */}
                    <circle r="3" fill="#ffffff">
                      <animateMotion path={pathData} dur={`${2 + (idx % 3)}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPin && (
              <div className="absolute bottom-4 left-4 bg-zinc-950/95 text-white px-3 py-1.5 rounded-lg border border-zinc-700 text-xs shadow-lg backdrop-blur-xs flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  <strong>{hoveredPin.pin}</strong>: {hoveredPin.signal}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
