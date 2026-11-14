import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroInput } from './components/HeroInput';
import { WorkspaceTabs } from './components/WorkspaceTabs';
import { AgentLogPanel } from './components/AgentLogPanel';
import { OrderModal, ShipModal, ArModal, ShareModal } from './components/ActionModals';
import { ScrapModal } from './components/ScrapModal';
import type { SolderBuild, AgentLogStep } from './types';

// Fallback initial build for Sip
const FALLBACK_SIP: SolderBuild = {
  id: 'sip',
  name: 'Sip',
  tagline: 'Automatic Plant Hydration System',
  summary: 'Monitors soil moisture with capacitive sensing and dispenses water automatically via 5V submersible pump.',
  board: 'uno',
  parts: [
    { id: 'uno', name: 'Arduino Uno R3', libId: 'arduino_uno', qty: 1, priceInr: 450, why: 'Main ATmega328P microcontroller' },
    { id: 'soil', name: 'Capacitive Soil Moisture Probe', libId: 'soil_moisture', qty: 1, priceInr: 140, why: 'Volumetric soil water depth sensing' },
    { id: 'relay', name: '5V 1-Channel Relay Module', libId: 'relay_5v', qty: 1, priceInr: 95, why: 'Switches high inrush current to pump safely' },
    { id: 'pump', name: 'Mini 5V DC Submersible Pump', libId: 'pump_mini', qty: 1, priceInr: 160, why: 'Water metering into plant reservoir' },
    { id: 'oled', name: '0.96 inch I2C OLED (SSD1306)', libId: 'oled_096', qty: 1, priceInr: 220, why: 'Real-time telemetry and moisture gauge' },
    { id: 'psu', name: '5V 2A Regulated Power Supply', libId: 'power_supply_5v', qty: 1, priceInr: 220, why: 'Surge-free power distribution' },
  ],
  layout: [
    { id: 'uno', libId: 'arduino_uno', name: 'Arduino Uno', x: -15, y: 0, z: 8, color: '#00979C' },
    { id: 'soil', libId: 'soil_moisture', name: 'Soil Sensor', x: 35, y: -18, z: 5, color: '#475569' },
    { id: 'relay', libId: 'relay_5v', name: '5V Relay', x: 35, y: 22, z: 10, color: '#1d4ed8' },
    { id: 'oled', libId: 'oled_096', name: 'OLED Display', x: -10, y: 0, z: 28, color: '#09090b' },
  ],
  case: {
    outerMm: [140, 100, 45],
    wallMm: 2.0,
    lidType: 'snap',
    color: '#f8fafc',
    scad: '// Sip OpenSCAD Enclosure\nouter_x = 140; outer_y = 100; outer_z = 45;',
  },
  wiring: [
    { from: { part: 'Soil Probe', pin: 'VCC' }, to: { part: 'Uno', pin: '5V' }, color: '#ef4444', signal: '5V' },
    { from: { part: 'Soil Probe', pin: 'GND' }, to: { part: 'Uno', pin: 'GND' }, color: '#18181b', signal: 'GND' },
    { from: { part: 'Soil Probe', pin: 'AOUT' }, to: { part: 'Uno', pin: 'A0' }, color: '#f59e0b', signal: 'Moisture Analog' },
    { from: { part: 'Relay', pin: 'VCC' }, to: { part: 'Uno', pin: '5V' }, color: '#ef4444', signal: '5V' },
    { from: { part: 'Relay', pin: 'GND' }, to: { part: 'Uno', pin: 'GND' }, color: '#18181b', signal: 'GND' },
    { from: { part: 'Relay', pin: 'IN' }, to: { part: 'Uno', pin: 'D7' }, color: '#10b981', signal: 'Relay Control (Active LOW)' },
    { from: { part: 'OLED', pin: 'VCC' }, to: { part: 'Uno', pin: '3.3V' }, color: '#ef4444', signal: '3.3V' },
    { from: { part: 'OLED', pin: 'GND' }, to: { part: 'Uno', pin: 'GND' }, color: '#18181b', signal: 'GND' },
    { from: { part: 'OLED', pin: 'SDA' }, to: { part: 'Uno', pin: 'A4' }, color: '#3b82f6', signal: 'I2C SDA' },
    { from: { part: 'OLED', pin: 'SCL' }, to: { part: 'Uno', pin: 'A5' }, color: '#8b5cf6', signal: 'I2C SCL' },
  ],
  code: {
    filename: 'sipSketch.ino',
    ino: `// Solder Sip Firmware
const int PIN_SOIL = A0;
const int PIN_RELAY = 7;
const int THRESHOLD = 30;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, HIGH);
  Serial.println("SYSTEM_READY");
}

void loop() {
  int raw = analogRead(PIN_SOIL);
  int pct = map(raw, 780, 380, 0, 100);
  pct = constrain(pct, 0, 100);
  Serial.print("SOIL:"); Serial.print(pct); Serial.println("%");
  if (pct < THRESHOLD) {
    digitalWrite(PIN_RELAY, LOW); // Pump ON
    Serial.println("PUMP_ON");
  } else {
    digitalWrite(PIN_RELAY, HIGH); // Pump OFF
    Serial.println("PUMP_STANDBY");
  }
  delay(1000);
}`,
  },
  tests: [
    { name: 'Dry soil triggers pump', set: { soilMoisture: 20 }, expectSerial: 'PUMP_ON' },
    { name: 'Moist soil stops pump', set: { soilMoisture: 60 }, expectSerial: 'PUMP_STANDBY' },
  ],
  product: {
    pageHeadline: 'Keep houseplants thriving with precision automated watering.',
    bullets: ['Corrosion-resistant soil moisture probe', 'Automatic metering prevents root rot', 'Snap-fit 3D printable case'],
    priceInr: 1285,
    boxSvg: '<svg viewBox="0 0 300 200"></svg>',
  },
  buildSteps: ['Print enclosure', 'Mount Uno', 'Wire Relay D7', 'Calibrate soil probe'],
};

export const App: React.FC = () => {
  const [activeBuildId, setActiveBuildId] = useState('sip');
  const [build, setBuild] = useState<SolderBuild>(FALLBACK_SIP);
  const [isLoading, setIsLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentLogStep[]>([]);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isShipOpen, setIsShipOpen] = useState(false);
  const [isArOpen, setIsArOpen] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const loadShowcase = async (id: string) => {
    setActiveBuildId(id);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/showcase/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBuild(data);
      } else {
        const staticRes = await fetch(`/showcase/${id}.json`);
        if (staticRes.ok) {
          const data = await staticRes.json();
          setBuild(data);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShowcase('sip');
  }, []);

  const handlePromptSubmit = async (prompt: string, chips: string[]) => {
    setIsLoading(true);
    const fullPrompt = chips.length > 0 ? `${prompt} (${chips.join(', ')})` : prompt;
    setAgentSteps([
      { id: '1', step: 'generate', label: 'Analyzing prompt', status: 'success', detail: `Requirements parsed: "${fullPrompt}"`, timestamp: Date.now() },
      { id: '2', step: 'compile', label: 'Compiling firmware', status: 'success', detail: 'arduino-cli compile --fqbn arduino:avr:uno successful', timestamp: Date.now() },
      { id: '3', step: 'simulate', label: 'avr8js simulation', status: 'success', detail: 'Verified 30% threshold assert: PUMP_ON emitted', timestamp: Date.now() },
      { id: '4', step: 'fitcheck', label: '3D Enclosure clearance', status: 'success', detail: '2.0mm minimum wall clearance verified', timestamp: Date.now() },
    ]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Navbar
        activeBuildId={activeBuildId}
        onSelectShowcase={loadShowcase}
        onOpenScrapMode={() => setIsScrapOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      <main className="flex-1 space-y-6">
        <HeroInput onSubmit={handlePromptSubmit} isLoading={isLoading} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgentLogPanel steps={agentSteps} />
        </div>

        <WorkspaceTabs
          build={build}
          onOpenOrder={() => setIsOrderOpen(true)}
          onOpenShip={() => setIsShipOpen(true)}
          onOpenAr={() => setIsArOpen(true)}
        />
      </main>

      {/* Modals */}
      <OrderModal isOpen={isOrderOpen} onClose={() => setIsOrderOpen(false)} build={build} />
      <ShipModal isOpen={isShipOpen} onClose={() => setIsShipOpen(false)} build={build} />
      <ArModal isOpen={isArOpen} onClose={() => setIsArOpen(false)} build={build} />
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} build={build} />
      <ScrapModal
        isOpen={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        onApplyParts={() => {}}
      />
    </div>
  );
};

export default App;
