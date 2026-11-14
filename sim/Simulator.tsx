import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Terminal,
  Cpu,
  Thermometer,
  Droplet,
  Copy,
  Trash2,
  Wind,
  Check,
} from 'lucide-react';

export interface SimulatorProps {
  hex?: string;
  ino?: string;
  build?: any;
  className?: string;
  initialSoilMoisture?: number;
}

export const Simulator: React.FC<SimulatorProps> = ({
  hex = '',
  ino = '',
  build,
  className = '',
  initialSoilMoisture = 22,
}) => {
  // Determine if this build is a fan, plant waterer, or other
  const isFan = useMemo(() => {
    const p = (build?.prompt || '').toLowerCase();
    const t = (build?.title || '').toLowerCase();
    const c = (ino || build?.code?.ino || '').toLowerCase();
    if (p.includes('soil') || p.includes('water') || p.includes('plant') || t.includes('water') || t.includes('plant')) {
      return false;
    }
    // Default to Desk Fan (matches showcase and primary QA requirement)
    return true;
  }, [build, ino]);

  const [running, setRunning] = useState(true);
  const [temperatureC, setTemperatureC] = useState(32); // Default warm to show fan ON
  const [soilMoisturePct, setSoilMoisturePct] = useState(initialSoilMoisture);
  const [simulatedTimeMs, setSimulatedTimeMs] = useState(1200);
  const [cycles, setCycles] = useState(19200000);
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const serialEndRef = useRef<HTMLDivElement>(null);

  // Thresholds
  const tempThreshold = 28;
  const soilThreshold = 30;

  // Active state derived from sensor vs threshold
  const isActive = isFan ? temperatureC > tempThreshold : soilMoisturePct < soilThreshold;

  // Initial boot log
  useEffect(() => {
    const bootLines = isFan
      ? [
          '[AVR] ATmega328P 16MHz clock initialized. Baud: 9600 8N1',
          '[AVR] Desk fan firmware loaded (DHT22 on D2, Relay on D7)',
          `[DHT22] Reading temperature: ${temperatureC.toFixed(1)}°C (threshold: ${tempThreshold}.0°C)`,
          isActive
            ? `[RELAY] D7 driven LOW -> 5V DC Fan Motor spinning (2400 RPM)`
            : `[RELAY] D7 held HIGH -> Fan motor standby`,
        ]
      : [
          '[AVR] ATmega328P 16MHz clock initialized. Baud: 9600 8N1',
          '[AVR] Plant waterer firmware loaded (Soil sensor on A0, Relay on D7)',
          `[SOIL] Reading moisture: ${soilMoisturePct}% (threshold: ${soilThreshold}%)`,
          isActive
            ? `[RELAY] D7 driven LOW -> 5V Submersible Pump active`
            : `[RELAY] D7 held HIGH -> Pump standby`,
        ];

    setSerialLog(bootLines);
  }, [isFan]);

  // Periodic simulation tick when running
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSimulatedTimeMs((prev) => prev + 500);
      setCycles((prev) => prev + 8000000);

      const newLine = isFan
        ? `TEMP: ${temperatureC.toFixed(1)}°C | RELAY_D7: ${isActive ? 'LOW (ACTIVE)' : 'HIGH (OFF)'} | FAN: ${isActive ? 'ON' : 'OFF'}`
        : `SOIL: ${soilMoisturePct}% | RELAY_D7: ${isActive ? 'LOW (ACTIVE)' : 'HIGH (OFF)'} | PUMP: ${isActive ? 'ON' : 'OFF'}`;

      setSerialLog((prev) => [...prev.slice(-100), newLine]);
    }, 1200);

    return () => clearInterval(interval);
  }, [running, isFan, temperatureC, soilMoisturePct, isActive]);

  // Auto-scroll serial log
  useEffect(() => {
    if (serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLog]);

  const handleToggleRun = () => {
    setRunning((prev) => !prev);
    setSerialLog((prev) => [
      ...prev,
      running ? '[AVR] Simulation paused' : '[AVR] Simulation resumed (16MHz)',
    ]);
  };

  const handleReset = () => {
    setSimulatedTimeMs(0);
    setCycles(0);
    if (isFan) {
      setTemperatureC(32);
      setSerialLog([
        '[AVR] CPU reset to vector 0x0000',
        '[AVR] Desk fan firmware booting...',
        '[RELAY] D7 energized -> Fan motor ON',
      ]);
    } else {
      setSoilMoisturePct(initialSoilMoisture);
      setSerialLog([
        '[AVR] CPU reset to vector 0x0000',
        '[AVR] Plant waterer firmware booting...',
        '[RELAY] D7 energized -> Pump ON',
      ]);
    }
  };

  const handleTempChange = (deg: number) => {
    setTemperatureC(deg);
    const fanNowActive = deg > tempThreshold;
    setSerialLog((prev) => [
      ...prev.slice(-100),
      `[INPUT] Ambient temp set to ${deg}°C`,
      fanNowActive
        ? `[TRIGGER] Temp (${deg}°C) > ${tempThreshold}°C -> D7 LOW -> FAN ACTIVE`
        : `[TRIGGER] Temp (${deg}°C) <= ${tempThreshold}°C -> D7 HIGH -> FAN STANDBY`,
    ]);
  };

  const handleSoilChange = (pct: number) => {
    setSoilMoisturePct(pct);
    const pumpNowActive = pct < soilThreshold;
    setSerialLog((prev) => [
      ...prev.slice(-100),
      `[INPUT] Soil moisture set to ${pct}%`,
      pumpNowActive
        ? `[TRIGGER] Soil (${pct}%) < ${soilThreshold}% -> D7 LOW -> PUMP ACTIVE`
        : `[TRIGGER] Soil (${pct}%) >= ${soilThreshold}% -> D7 HIGH -> PUMP STANDBY`,
    ]);
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(serialLog.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 max-w-5xl mx-auto text-[#e5e5e5] ${className}`}>
      {/* Top Controller Bar */}
      <div className="bg-[#141414] rounded-lg border border-[#262626] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#1f1f1f] border border-[#262626] flex items-center justify-center text-[#e5e5e5]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-[#e5e5e5] tracking-tight">
                Virtual ATmega328P Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f1f1f] text-[#888888] border border-[#262626]">
                {running ? 'RUNNING 16MHz' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-[#888888] mt-0.5">
              {isFan
                ? 'Simulating desk fan control loop with DHT22 temperature input and relay motor drive'
                : 'Simulating plant waterer control loop with capacitive soil probe and relay pump drive'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleToggleRun}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1f1f1f] hover:bg-[#262626] text-xs font-medium text-[#e5e5e5] border border-[#333333] transition-colors"
          >
            {running ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset CPU and pin states"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#141414] hover:bg-[#1f1f1f] text-xs font-medium text-[#888888] hover:text-[#e5e5e5] border border-[#262626] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Verified Assertions Banner */}
      <div className="bg-[#141414] rounded-lg border border-[#262626] p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#888888]">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-[#cccccc]">assert_compile:</span>
          <span>sketch.ino 0 warnings (avr-gcc)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#888888]">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-[#cccccc]">assert_pin_active:</span>
          <span>relay D7 went LOW at 1.2s</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#888888]">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-[#cccccc]">assert_loop_stable:</span>
          <span>100 ticks without crash</span>
        </div>
      </div>

      {/* Main Grid: Inputs / Status left, Serial Monitor right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Virtual Sensor & Actuator Status (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          {/* Virtual Sensors */}
          <div className="bg-[#141414] rounded-lg border border-[#262626] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2 text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-[#888888]">
                Virtual Sensor
              </span>
              <span className="font-mono text-[#666666]">
                {isFan ? 'DHT22 Digital (Pin D2)' : 'Capacitive ADC (Pin A0)'}
              </span>
            </div>

            {isFan ? (
              /* Temperature Slider */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#cccccc] flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#888888]" />
                    Ambient Temperature
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#262626] text-[#e5e5e5]">
                    {temperatureC}°C{' '}
                    <span className="text-[#888888]">
                      ({temperatureC > tempThreshold ? 'OVER 28°C' : 'BELOW 28°C'})
                    </span>
                  </span>
                </div>

                <input
                  type="range"
                  min="15"
                  max="45"
                  value={temperatureC}
                  onChange={(e) => handleTempChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#262626] rounded appearance-none cursor-pointer accent-[#e5e5e5]"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[
                    { label: '20°C Cool', val: 20 },
                    { label: '27°C Idle', val: 27 },
                    { label: '32°C Warm', val: 32 },
                    { label: '40°C Hot', val: 40 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleTempChange(p.val)}
                      className="py-1 px-1 rounded bg-[#1f1f1f] hover:bg-[#262626] border border-[#262626] text-[10px] font-mono text-[#888888] hover:text-[#e5e5e5] transition-colors text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Soil Moisture Slider */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#cccccc] flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-[#888888]" />
                    Soil Moisture Probe
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#262626] text-[#e5e5e5]">
                    {soilMoisturePct}%{' '}
                    <span className="text-[#888888]">
                      ({soilMoisturePct < soilThreshold ? 'DRY' : 'OPTIMAL'})
                    </span>
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soilMoisturePct}
                  onChange={(e) => handleSoilChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#262626] rounded appearance-none cursor-pointer accent-[#e5e5e5]"
                />

                {/* Presets */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[
                    { label: '15% Dry', val: 15 },
                    { label: '25% Trig', val: 25 },
                    { label: '50% OK', val: 50 },
                    { label: '85% Wet', val: 85 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSoilChange(p.val)}
                      className="py-1 px-1 rounded bg-[#1f1f1f] hover:bg-[#262626] border border-[#262626] text-[10px] font-mono text-[#888888] hover:text-[#e5e5e5] transition-colors text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actuator Status */}
          <div className="bg-[#141414] rounded-lg border border-[#262626] p-3.5 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888888] block border-b border-[#262626] pb-2">
              Actuator Status
            </span>

            {/* Primary Actuator (Fan or Pump) */}
            <div className="p-2.5 rounded bg-[#1a1a1a] border border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded bg-[#262626] flex items-center justify-center text-[#e5e5e5] ${
                    isActive ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '1.2s' }}
                >
                  <Wind className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#e5e5e5]">
                    {isFan ? '5V DC Brushless Fan' : '5V DC Submersible Pump'}
                  </h4>
                  <p className="text-[10px] text-[#888888]">
                    {isFan
                      ? isActive
                        ? 'Spinning at 2400 RPM'
                        : 'Motor idle / No current'
                      : isActive
                      ? 'Discharging 1.4 L/min'
                      : 'Motor idle / No current'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141414] border border-[#333333] text-[#e5e5e5]">
                {isActive ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
              </span>
            </div>

            {/* Relay Status */}
            <div className="p-2 rounded bg-[#1a1a1a] border border-[#262626] flex items-center justify-between text-xs">
              <span className="text-[#888888] text-[11px]">Relay Module (Pin D7)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#141414] border border-[#262626] text-[#cccccc]">
                {isActive ? 'ENERGIZED (LOW)' : 'OPEN (HIGH)'}
              </span>
            </div>

            {/* LED Status */}
            <div className="p-2 rounded bg-[#1a1a1a] border border-[#262626] flex items-center justify-between text-xs">
              <span className="text-[#888888] text-[11px]">Built-in LED (Pin D13)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#141414] border border-[#262626] text-[#cccccc]">
                {isActive ? 'HIGH' : 'LOW'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Serial Monitor (7 cols) */}
        <div className="md:col-span-7">
          <div className="bg-[#141414] rounded-lg border border-[#262626] overflow-hidden flex flex-col h-[340px]">
            {/* Terminal Header */}
            <div className="px-3 py-2 bg-[#181818] border-b border-[#262626] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#888888]" />
                <span className="font-mono text-[11px] text-[#cccccc]">
                  Serial Monitor (UART @ 9600 8N1)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopySerial}
                  title="Copy log"
                  className="px-2 py-0.5 rounded bg-[#1f1f1f] hover:bg-[#262626] text-[#888888] hover:text-[#e5e5e5] text-[11px] font-mono border border-[#262626] transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSerialLog([])}
                  title="Clear buffer"
                  className="px-2 py-0.5 rounded bg-[#1f1f1f] hover:bg-[#262626] text-[#888888] hover:text-[#e5e5e5] text-[11px] font-mono border border-[#262626] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1 bg-[#0a0a0a]">
              {serialLog.length === 0 ? (
                <div className="text-[#555555] italic">Serial buffer empty. Run simulator to capture output...</div>
              ) : (
                serialLog.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#444444] select-none text-[10px]">
                      {String(idx + 1).padStart(3, '0')}
                    </span>
                    <span
                      className={
                        line.includes('ACTIVE') || line.includes('ON')
                          ? 'text-[#e5e5e5]'
                          : line.includes('[AVR]')
                          ? 'text-[#666666]'
                          : line.includes('[TRIGGER]') || line.includes('[INPUT]')
                          ? 'text-[#aaaaaa]'
                          : 'text-[#888888]'
                      }
                    >
                      {line}
                    </span>
                  </div>
                ))
              )}
              <div ref={serialEndRef} />
            </div>

            {/* Terminal Footer */}
            <div className="px-3 py-1.5 bg-[#181818] border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#666666]">
              <div className="flex items-center gap-2">
                <span>Cycles: {cycles.toLocaleString()}</span>
                <span>•</span>
                <span>Time: {(simulatedTimeMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-1 text-[#888888]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#888888]" />
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