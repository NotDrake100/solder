import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, XCircle, Terminal, Activity, Volume2, Cpu, Power, Zap, Gauge } from 'lucide-react';
import { VirtualSensors, VirtualActuators, ArduinoSimulatorProps, TestCase, TestResult } from './types';
import { evaluateHardwareState, runSimulatorTests } from './reactiveEngine';

export const ArduinoSimulator: React.FC<ArduinoSimulatorProps> = ({
  hex,
  inoCode = '',
  board = 'uno',
  tests = [],
  className = '',
  onActuatorChange,
  onSerialOutput
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [sensors, setSensors] = useState<VirtualSensors>({
    soilMoisture: 32, // Default dry for Sip demo
    temperature: 24,
    humidity: 55,
    gasLevel: 120,
    distanceCm: 45,
    buttonPressed: false,
    lightLevel: 65
  });

  const [actuators, setActuators] = useState<VirtualActuators>({
    relay: false,
    relayPin: 8,
    led13: false,
    buzzerTone: 0,
    buzzerPin: 9,
    servoAngle: 0,
    servoPin: 9,
    oledLines: ['Solder AVR Sim', 'Ready...'],
    pinStates: { 13: 0, 8: 0 },
    analogStates: { A0: 327 }
  });

  const [serialLogs, setSerialLogs] = useState<string[]>([
    `[00:00:00] Solder AVR Engine v1.0 initialized (ATmega328P 16MHz)`,
    `[00:00:00] Serial Monitor initialized at 9600 baud.`,
    `[00:00:01] sketch.ino loaded. Listening to ADC/GPIO...`
  ]);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState<'peripherals' | 'serial' | 'tests'>('peripherals');
  const [txBlink, setTxBlink] = useState(false);
  const serialEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll serial output
  useEffect(() => {
    serialEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [serialLogs]);

  // Reactive simulation loop whenever sensors, isRunning, or inoCode changes
  useEffect(() => {
    if (!isRunning) return;

    const { actuators: newActuators, logMessage } = evaluateHardwareState(sensors, inoCode, actuators);
    setActuators(newActuators);
    onActuatorChange?.(newActuators);

    if (logMessage) {
      setSerialLogs((prev) => [...prev.slice(-100), logMessage]);
      onSerialOutput?.(logMessage);
      setTxBlink(true);
      setTimeout(() => setTxBlink(false), 200);
    }
  }, [sensors, isRunning, inoCode]);

  // Periodic heartbeat / simulated loop execution
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Simulate periodic Serial print if sketch has loop delay
      if (inoCode.includes('Serial.print')) {
        const timeStr = new Date().toLocaleTimeString();
        let periodicMsg: string | undefined;

        if (inoCode.includes('soil') || inoCode.includes('moisture') || inoCode.includes('A0')) {
          periodicMsg = `[${timeStr}] Soil: ${sensors.soilMoisture}% | ADC: ${Math.round((sensors.soilMoisture / 100) * 1023)} | Relay: ${actuators.relay ? 'ON [ACTIVE]' : 'OFF [STANDBY]'}`;
        } else if (inoCode.includes('dht') || inoCode.includes('temp')) {
          periodicMsg = `[${timeStr}] Temp: ${sensors.temperature}°C | Humidity: ${sensors.humidity}%`;
        } else if (inoCode.includes('mq') || inoCode.includes('gas')) {
          periodicMsg = `[${timeStr}] Air Quality: ${sensors.gasLevel} ppm (${sensors.gasLevel > 350 ? 'ALERT' : 'NORMAL'})`;
        }

        if (periodicMsg) {
          setSerialLogs((prev) => [...prev.slice(-100), periodicMsg]);
          setTxBlink(true);
          setTimeout(() => setTxBlink(false), 150);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, sensors, actuators.relay, inoCode]);

  // Automated test runner
  const handleRunTests = () => {
    const results = runSimulatorTests(tests, inoCode, sensors);
    setTestResults(results);
    setActiveTab('tests');
  };

  const handleReset = () => {
    setSensors({
      soilMoisture: 32,
      temperature: 24,
      humidity: 55,
      gasLevel: 120,
      distanceCm: 45,
      buttonPressed: false,
      lightLevel: 65
    });
    setSerialLogs([
      `[${new Date().toLocaleTimeString()}] Reset simulator state. CPU restarted.`
    ]);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Simulation Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                AVR Hardware Simulator
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isRunning ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isRunning ? 'RUNNING (16 MHz)' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Target: {board === 'esp32' ? 'ESP32 DevKit' : 'Arduino Uno (ATmega328P)'} • Interactive Virtual Bus
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isRunning
                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors"
            title="Reset simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {tests.length > 0 && (
            <button
              onClick={handleRunTests}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Run Tests ({tests.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Controls + Peripherals + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Left Column: Virtual Sensors & Interactive Sliders (5 cols) */}
        <div className="lg:col-span-5 p-4 space-y-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Interactive Sensor Inputs
            </h3>
            <span className="text-[11px] text-gray-400">Drag to trigger logic</span>
          </div>

          {/* Slider 1: Soil Moisture */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Soil Moisture Probe (A0)
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                sensors.soilMoisture < 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {sensors.soilMoisture}% ({Math.round((sensors.soilMoisture / 100) * 1023)} ADC)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sensors.soilMoisture}
              onChange={(e) => setSensors({ ...sensors, soilMoisture: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
              <span className="text-amber-600">0% (Bone Dry - Pump ON)</span>
              <span>40% Threshold</span>
              <span className="text-blue-600">100% (Wet)</span>
            </div>
          </div>

          {/* Slider 2: Temperature & Humidity */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                DHT11 Temperature & Humidity
              </label>
              <span className="text-xs font-mono font-semibold text-gray-800">
                {sensors.temperature}°C • {sensors.humidity}% RH
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="w-8">Temp:</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={sensors.temperature}
                  onChange={(e) => setSensors({ ...sensors, temperature: parseInt(e.target.value, 10) })}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="w-8">Hum:</span>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={sensors.humidity}
                  onChange={(e) => setSensors({ ...sensors, humidity: parseInt(e.target.value, 10) })}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Slider 3: Gas / Air Quality (MQ-135) */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                MQ-135 Air Quality Sensor
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                sensors.gasLevel > 350 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
              }`}>
                {sensors.gasLevel} ppm
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="800"
              value={sensors.gasLevel}
              onChange={(e) => setSensors({ ...sensors, gasLevel: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Clean (&lt;200)</span>
              <span>Moderate</span>
              <span className="text-red-500 font-medium">Hazardous (&gt;350)</span>
            </div>
          </div>

          {/* Slider 4: Ultrasonic Distance & Push Button */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">HC-SR04</span>
                <span className="font-mono text-gray-800 font-semibold">{sensors.distanceCm}cm</span>
              </div>
              <input
                type="range"
                min="2"
                max="150"
                value={sensors.distanceCm}
                onChange={(e) => setSensors({ ...sensors, distanceCm: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-700">Push Button (D2)</span>
              <button
                onMouseDown={() => setSensors({ ...sensors, buttonPressed: true })}
                onMouseUp={() => setSensors({ ...sensors, buttonPressed: false })}
                className={`w-full py-1.5 text-xs font-medium rounded border transition-colors ${
                  sensors.buttonPressed
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                {sensors.buttonPressed ? 'PRESSED' : 'HOLD TO PRESS'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Actuators + Terminal / Tests (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Virtual Actuator Board Indicators */}
          <div className="p-4 bg-white border-b border-gray-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Hardware Outputs & Peripherals
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Relay Visual Box */}
              <div className={`p-3 rounded-lg border transition-all ${
                actuators.relay
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium">5V Relay (Pin {actuators.relayPin})</span>
                  <Power className={`w-3.5 h-3.5 ${actuators.relay ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
                </div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${actuators.relay ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-300'}`} />
                  {actuators.relay ? 'CLOSED (ON)' : 'OPEN (OFF)'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Water Pump Power</div>
              </div>

              {/* Pin 13 LED */}
              <div className={`p-3 rounded-lg border transition-all ${
                actuators.led13
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium">Built-in LED</span>
                  <Zap className={`w-3.5 h-3.5 ${actuators.led13 ? 'text-amber-500' : 'text-gray-400'}`} />
                </div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${actuators.led13 ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-gray-300'}`} />
                  {actuators.led13 ? 'HIGH' : 'LOW'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Digital Pin 13</div>
              </div>

              {/* SG90 Servo Dial */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-gray-700">SG90 Servo</span>
                  <Gauge className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {actuators.servoAngle}°
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Position Angle</div>
              </div>

              {/* Buzzer Tone */}
              <div className={`p-3 rounded-lg border transition-all ${
                actuators.buzzerTone > 0
                  ? 'bg-red-500/10 border-red-500/40 text-red-900 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium">Piezo Buzzer</span>
                  <Volume2 className={`w-3.5 h-3.5 ${actuators.buzzerTone > 0 ? 'text-red-500 animate-bounce' : 'text-gray-400'}`} />
                </div>
                <div className="text-sm font-bold">
                  {actuators.buzzerTone > 0 ? `${actuators.buzzerTone} Hz` : 'MUTE'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Tone Frequency</div>
              </div>
            </div>

            {/* Virtual OLED Preview Screen */}
            <div className="mt-3 bg-gray-950 p-2.5 rounded-lg border border-gray-800 text-sky-400 font-mono text-xs flex items-center justify-between shadow-inner">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">SSD1306 OLED (128x64) Preview</div>
                <div>{actuators.oledLines[0] || 'System Ready'}</div>
                <div className="text-sky-300/80">{actuators.oledLines[1] || ''}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-sans">
                <span>TX</span>
                <span className={`w-1.5 h-1.5 rounded-full ${txBlink ? 'bg-amber-400 ring-2 ring-amber-300' : 'bg-gray-700'}`} />
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Serial Monitor vs Automated Test Runner */}
          <div className="flex border-b border-gray-200 px-4 bg-gray-50">
            <button
              onClick={() => setActiveTab('serial')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'serial'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Serial Monitor (9600)
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'tests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Self-Test Assertions ({tests.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 flex-1 flex flex-col bg-slate-950 min-h-[180px] max-h-[240px] overflow-y-auto font-mono text-xs text-emerald-400">
            {activeTab === 'serial' ? (
              <div className="space-y-1">
                {serialLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
                <div ref={serialEndRef} />
              </div>
            ) : (
              <div className="space-y-2 font-sans">
                {testResults.length === 0 ? (
                  <div className="text-gray-400 text-center py-6">
                    Click "Run Tests" in toolbar to evaluate hardware logic against test assertions.
                  </div>
                ) : (
                  testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        t.passed ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-red-950/40 border-red-800 text-red-300'
                      }`}
                    >
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs">
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-[11px] opacity-80 mt-0.5">{t.details}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArduinoSimulator;
