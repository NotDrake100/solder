import React, { useState, useEffect, useRef } from 'react';
import { AVRRunner, SimulatorState } from './avrRunner';
import {
  Play,
  Square,
  RotateCcw,
  Activity,
  Terminal,
  Cpu,
  Droplet,
  Thermometer,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Power,
} from 'lucide-react';

export interface SimulatorProps {
  hex?: string;
  ino?: string;
  className?: string;
  initialSoilMoisture?: number;
}

export const Simulator: React.FC<SimulatorProps> = ({
  hex = '',
  ino = '',
  className = '',
  initialSoilMoisture = 22, // Start dry to show pump active
}) => {
  const runnerRef = useRef<AVRRunner | null>(null);

  const [state, setState] = useState<SimulatorState>({
    running: false,
    cycles: 0,
    simulatedTimeMs: 0,
    pins: { a0: 690, d7: false, d8: true, d13: true, d2: true },
    sensors: { soilMoisturePct: initialSoilMoisture, temperatureC: 25, buttonPressed: false },
    pumpActive: true,
    ledActive: true,
  });

  const [serialLog, setSerialLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const serialEndRef = useRef<HTMLDivElement>(null);

  // Initialize runner
  useEffect(() => {
    const runner = new AVRRunner(hex);
    runnerRef.current = runner;

    runner.setSoilMoisture(initialSoilMoisture);

    const unsubSerial = runner.onSerial((msg) => {
      setSerialLog((prev) => [...prev.slice(-150), msg.trimEnd()]);
    });

    const unsubState = runner.onStateChange((newState) => {
      setState(newState);
    });

    // Auto-start simulation
    runner.start();

    return () => {
      runner.stop();
      unsubSerial();
      unsubState();
    };
  }, [hex]);

  // Update hex if changed
  useEffect(() => {
    if (hex && runnerRef.current) {
      runnerRef.current.loadHex(hex);
      runnerRef.current.start();
    }
  }, [hex]);

  // Auto-scroll serial log
  useEffect(() => {
    if (serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLog]);

  const handleToggleRun = () => {
    if (!runnerRef.current) return;
    if (state.running) {
      runnerRef.current.stop();
    } else {
      runnerRef.current.start();
    }
  };

  const handleReset = () => {
    if (!runnerRef.current) return;
    runnerRef.current.reset();
    setSerialLog([]);
  };

  const handleSoilChange = (pct: number) => {
    if (runnerRef.current) {
      runnerRef.current.setSoilMoisture(pct);
    }
  };

  const handleTempChange = (deg: number) => {
    if (runnerRef.current) {
      runnerRef.current.setTemperature(deg);
    }
  };

  const handleButtonToggle = (pressed: boolean) => {
    if (runnerRef.current) {
      runnerRef.current.setButton(pressed);
    }
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(serialLog.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${className}`}>
      {/* Top Controller Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              state.running ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                Virtual ATmega328P Simulator (avr8js engine)
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  state.running
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                }`}
              >
                {state.running ? 'RUNNING (16 MHz)' : 'HALTED'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Simulating Uno execution loop with real sensor ADC thresholds and relay signals
            </p>
          </div>
        </div>

        {/* Play / Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleRun}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              state.running
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {state.running ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset CPU and pin states"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Virtual Sensors & Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Virtual Sensors
              </span>
              <span className="text-xs text-zinc-500 font-mono">Analog / Digital Inputs</span>
            </div>

            {/* Soil Moisture Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-sky-500" />
                  Soil Moisture Probe (A0)
                </span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    state.sensors.soilMoisturePct < 30
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {state.sensors.soilMoisturePct}% ({state.sensors.soilMoisturePct < 30 ? 'DRY' : 'OPTIMAL'})
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={state.sensors.soilMoisturePct}
                onChange={(e) => handleSoilChange(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />

              {/* Moisture Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: '15% Dry', val: 15 },
                  { label: '25% Trig', val: 25 },
                  { label: '50% OK', val: 50 },
                  { label: '85% Wet', val: 85 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleSoilChange(preset.val)}
                    className="py-1 px-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-[10px] font-medium text-zinc-600 transition-colors text-center"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Temperature Slider */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  Ambient Temperature (DHT22)
                </span>
                <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-xs">
                  {state.sensors.temperatureC}°C
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="50"
                value={state.sensors.temperatureC}
                onChange={(e) => handleTempChange(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
            </div>

            {/* Push Button Trigger */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 block">Manual Override Button (D2)</span>
                <span className="text-[11px] text-zinc-400">Momentary push-to-test</span>
              </div>
              <button
                type="button"
                onMouseDown={() => handleButtonToggle(true)}
                onMouseUp={() => handleButtonToggle(false)}
                onTouchStart={() => handleButtonToggle(true)}
                onTouchEnd={() => handleButtonToggle(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  state.sensors.buttonPressed
                    ? 'bg-zinc-900 text-white border-zinc-900 scale-95'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
              >
                {state.sensors.buttonPressed ? 'PRESSED' : 'PRESS'}
              </button>
            </div>
          </div>

          {/* Physical Hardware Outputs */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-100 pb-2">
              Actuator & Hardware Status
            </span>

            {/* 5V Water Pump */}
            <div
              className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                state.pumpActive
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
                  : 'bg-zinc-50 border-zinc-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    state.pumpActive
                      ? 'bg-emerald-600 text-white animate-spin'
                      : 'bg-zinc-200 text-zinc-500'
                  }`}
                  style={{ animationDuration: '1.2s' }}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">5V DC Submersible Pump</h4>
                  <p className="text-[11px] text-zinc-500">
                    {state.pumpActive ? 'Discharging 1.4 L/min water' : 'Motor idle / No current'}
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  state.pumpActive
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {state.pumpActive ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
              </span>
            </div>

            {/* Relay Status */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${state.pumpActive ? 'text-amber-500' : 'text-zinc-400'}`} />
                <span className="font-medium text-zinc-700">Relay Module (Pin D7)</span>
              </div>
              <span
                className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                  state.pumpActive ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {state.pumpActive ? 'ENERGIZED (LOW)' : 'OPEN (HIGH)'}
              </span>
            </div>

            {/* Onboard LED D13 */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full inline-block transition-colors ${
                    state.ledActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-zinc-300'
                  }`}
                />
                <span className="font-medium text-zinc-700">Built-in LED (Pin D13)</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                {state.ledActive ? 'HIGH' : 'LOW'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Serial Monitor & Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#121214] rounded-2xl border border-zinc-800 overflow-hidden shadow-md flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="px-4 py-2.5 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="font-mono text-xs text-zinc-300 font-semibold">
                  Serial Monitor (UART @ 9600 8N1)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySerial}
                  title="Copy serial log to clipboard"
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSerialLog([])}
                  title="Clear serial buffer"
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 bg-[#09090b]">
              {serialLog.length === 0 ? (
                <div className="text-zinc-600 italic">Serial buffer empty. Run simulator to capture output...</div>
              ) : (
                serialLog.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-zinc-600 select-none text-[11px]">
                      {String(idx + 1).padStart(3, '0')}
                    </span>
                    <span
                      className={
                        line.includes('PUMP:ON')
                          ? 'text-emerald-400 font-semibold'
                          : line.includes('PUMP:OFF')
                          ? 'text-amber-400'
                          : line.includes('SOIL')
                          ? 'text-sky-300'
                          : line.includes('[AVR]')
                          ? 'text-zinc-500'
                          : 'text-zinc-200'
                      }
                    >
                      {line}
                    </span>
                  </div>
                ))
              )}
              <div ref={serialEndRef} />
            </div>

            {/* Terminal Footer Telemetry */}
            <div className="px-4 py-2 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span>Cycles: {state.cycles.toLocaleString()}</span>
                <span>•</span>
                <span>Time: {(state.simulatedTimeMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AVR CORE ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
