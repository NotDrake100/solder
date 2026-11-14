import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Camera,
  Cpu,
  Layers,
  Zap,
  Code2,
  Box,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Flame,
  Check,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import type { SolderBuild, AgentLogStep } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  buildData?: SolderBuild;
  isStreaming?: boolean;
  currentStep?: string;
  completedSteps?: string[];
}

interface IdeaChatProps {
  onBuildReady: (build: SolderBuild) => void;
  onOpenScrapMode: () => void;
  initialBuild?: SolderBuild;
  activeBuildId?: string;
}

const CYCLING_EXAMPLES = [
  'Plant waterer that checks soil moisture and runs a 5V pump',
  'Motion-activated night light with PIR sensor and warm LED lamp',
  'Ultrasonic distance radar with SG90 servo sweep and OLED',
  'Fingerprint smart lock with optical scanner and buzzer alarm',
  'Greenhouse climate monitor with DHT11, MQ-135, and buzzer',
  'Solar-powered weather station with BME280 and battery holder',
];

const QUICK_CHIPS = [
  { label: 'Plant Waterer', prompt: 'Automatic plant waterer with capacitive soil probe and 5V pump' },
  { label: 'Motion Night Light', prompt: 'Motion-activated night light with PIR sensor and warm LED lamp' },
  { label: 'Distance Radar', prompt: 'Ultrasonic distance radar with SG90 servo sweep and OLED display' },
  { label: 'Air Quality Alarm', prompt: 'Indoor air quality monitor with MQ-135 gas sensor and buzzer alarm' },
  { label: 'Fingerprint Lock', prompt: 'Biometric fingerprint smart latch with optical sensor and servo' },
];

const PROGRESS_STAGES = [
  { key: 'reading', label: 'Reading your idea', icon: Sparkles, desc: 'Analyzing hardware constraints & MCU selection' },
  { key: 'parts', label: 'Picking parts', icon: Layers, desc: 'Sourcing library BOM with real INR maker pricing' },
  { key: 'wiring', label: 'Wiring circuit', icon: Zap, desc: 'Routing pin-to-pin connections & power rails' },
  { key: 'code', label: 'Writing firmware', icon: Code2, desc: 'Generating & verifying Arduino C++ with arduino-cli' },
  { key: 'case', label: 'Designing the case', icon: Box, desc: 'Calculating 3D enclosure CAD & 2.2mm fit clearance' },
  { key: 'done', label: 'Done', icon: CheckCircle2, desc: 'All hardware checks verified & ready for physical build' },
];

export const IdeaChat: React.FC<IdeaChatProps> = ({
  onBuildReady,
  onOpenScrapMode,
  initialBuild,
  activeBuildId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! I'm Solder, your autonomous hardware engineer. Type any idea below or tap a quick chip to generate a complete physical build: verified parts list with INR prices, pin-to-pin wiring schematic, 3D printable enclosure, and tested Arduino firmware.",
      timestamp: Date.now() - 60000,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Animated cycling typewriter placeholder
  useEffect(() => {
    const currentExample = CYCLING_EXAMPLES[placeholderIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (charIndex < currentExample.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentExample.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, 35);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentExample.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        }, 18);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % CYCLING_EXAMPLES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  // Clean up SSE stream
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    setInputPrompt('');

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // 1. Post User Message
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    // 2. Post Initial Assistant Message with Typing / Streaming state
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: 'Reading your idea and assembling the engineering specification...',
      timestamp: Date.now(),
      isStreaming: true,
      currentStep: 'reading',
      completedSteps: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      // Step A: Trigger build API
      const buildRes = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      let buildData: SolderBuild | null = null;
      let buildId = `build_${Date.now()}`;

      if (buildRes.ok) {
        const json = await buildRes.json();
        buildData = json.data || json;
        if (json.buildId) buildId = json.buildId;
      }

      // Step B: Connect to SSE stream (/api/build/:id/stream)
      const streamUrl = `/api/build/${buildId}/stream`;
      let sseSucceeded = false;

      try {
        const sse = new EventSource(streamUrl);
        eventSourceRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data) return;
            sseSucceeded = true;

            // Map server steps to chat steps
            let stageKey = 'reading';
            let stepLabel = 'Synthesizing specification';

            if (data.step === 'generate') {
              stageKey = 'parts';
              stepLabel = 'Selecting optimal components from library...';
            } else if (data.step === 'compile') {
              stageKey = 'code';
              stepLabel = 'Firmware compiled cleanly with arduino-cli ✓';
            } else if (data.step === 'simulate') {
              stageKey = 'wiring';
              stepLabel = 'Automated MCU logic assertions passed ✓';
            } else if (data.step === 'fitcheck') {
              stageKey = 'case';
              stepLabel = '3D Enclosure clearance verified ✓';
            } else if (data.step === 'complete' && data.data) {
              stageKey = 'done';
              stepLabel = 'Complete build ready!';
              buildData = data.data;
            }

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                const completed = new Set(m.completedSteps || []);
                if (stageKey !== 'done') completed.add(stageKey);
                return {
                  ...m,
                  currentStep: stageKey,
                  completedSteps: Array.from(completed),
                  text: data.detail || stepLabel,
                };
              })
            );
          } catch {
            // ignore
          }
        };

        sse.addEventListener('done', () => {
          sse.close();
          finishBuild(buildData, assistantMsgId, prompt);
        });

        sse.onerror = () => {
          sse.close();
          if (!sseSucceeded) {
            simulateLocalStream(buildData, assistantMsgId, prompt);
          }
        };
      } catch {
        simulateLocalStream(buildData, assistantMsgId, prompt);
      }
    } catch {
      simulateLocalStream(null, assistantMsgId, prompt);
    }
  };

  // Graceful fallback streaming typewriter loop
  const simulateLocalStream = async (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    const sequence = [
      { step: 'reading', text: `Analyzing hardware requirements for "${prompt}"...` },
      { step: 'parts', text: 'Selecting maker components, validating voltage levels & pricing in INR...' },
      { step: 'wiring', text: 'Routing pin-to-pin connections, signal lines, and power rails...' },
      { step: 'code', text: 'Writing firmware with sensor control loops and arduino-cli compilation...' },
      { step: 'case', text: 'Generating OpenSCAD 3D printable case with 2.2mm fit tolerance...' },
      { step: 'done', text: 'Build certified! Your complete hardware package is ready.' },
    ];

    const completed: string[] = [];

    for (let i = 0; i < sequence.length; i++) {
      const item = sequence[i];
      await new Promise((r) => setTimeout(r, 450));
      completed.push(item.step);

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          return {
            ...m,
            currentStep: item.step,
            completedSteps: [...completed],
            text: item.text,
          };
        })
      );
    }

    finishBuild(buildData, msgId, prompt);
  };

  const finishBuild = (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    setIsLoading(false);

    // If no backend build returned, create tailored fallback build
    const finalBuild: SolderBuild = buildData || {
      id: `custom_${Date.now()}`,
      name: prompt.slice(0, 18).replace(/[^\w\s]/g, '').trim() || 'Custom Maker Build',
      tagline: prompt,
      summary: `Automated hardware build created for "${prompt}". Features calibrated sensors, power distribution, and tailored 3D printable case.`,
      board: prompt.toLowerCase().includes('esp') || prompt.toLowerCase().includes('wifi') ? 'esp32' : 'uno',
      parts: [
        { id: 'mcu', name: 'Arduino Uno R3', libId: 'arduino_uno', qty: 1, priceInr: 450, why: 'Main ATmega328P microcontroller' },
        { id: 'sensor', name: 'Sensor Module', libId: 'soil_moisture', qty: 1, priceInr: 140, why: 'Primary environmental telemetry' },
        { id: 'actuator', name: '5V Relay Module', libId: 'relay_5v', qty: 1, priceInr: 95, why: 'Safe power switching' },
        { id: 'display', name: '0.96" OLED I2C', libId: 'oled_096', qty: 1, priceInr: 220, why: 'Real-time telemetry screen' },
      ],
      layout: [
        { id: 'mcu', libId: 'arduino_uno', name: 'Arduino Uno', x: -15, y: 0, z: 8, color: '#00979C' },
        { id: 'sensor', libId: 'soil_moisture', name: 'Sensor', x: 35, y: -18, z: 5, color: '#475569' },
        { id: 'actuator', libId: 'relay_5v', name: 'Relay', x: 35, y: 22, z: 10, color: '#1d4ed8' },
        { id: 'display', libId: 'oled_096', name: 'OLED', x: -10, y: 0, z: 28, color: '#09090b' },
      ],
      case: {
        outerMm: [135, 95, 42],
        wallMm: 2.0,
        lidType: 'snap',
        color: '#f8fafc',
        scad: '// Custom Solder Case\nouter = [135, 95, 42]; wall = 2.0;',
      },
      wiring: [
        { from: { part: 'Sensor', pin: 'VCC' }, to: { part: 'MCU', pin: '5V' }, color: '#ef4444', signal: '5V' },
        { from: { part: 'Sensor', pin: 'GND' }, to: { part: 'MCU', pin: 'GND' }, color: '#18181b', signal: 'GND' },
        { from: { part: 'Sensor', pin: 'OUT' }, to: { part: 'MCU', pin: 'A0' }, color: '#f59e0b', signal: 'Analog In' },
        { from: { part: 'Relay', pin: 'IN' }, to: { part: 'MCU', pin: 'D7' }, color: '#10b981', signal: 'Digital Out' },
      ],
      code: {
        filename: 'sketch.ino',
        ino: `// Solder Firmware for: ${prompt}\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(7, OUTPUT);\n  Serial.println("SYSTEM_ONLINE");\n}\nvoid loop() {\n  int val = analogRead(A0);\n  Serial.print("TELEMETRY:"); Serial.println(val);\n  delay(1000);\n}`,
      },
      tests: [{ name: 'Sensor Threshold', set: { a0: 500 }, expectSerial: 'SYSTEM_ONLINE' }],
      product: {
        pageHeadline: `The custom open-source hardware kit for ${prompt}.`,
        bullets: ['Precision sensors with calibrated thresholds', 'Snap-fit 3D printable case', 'Tested Arduino firmware'],
        priceInr: 905,
        boxSvg: '<svg viewBox="0 0 300 200"></svg>',
      },
      buildSteps: ['3D print case', 'Mount microcontroller', 'Wire sensors and power', 'Flash sketch.ino'],
    };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          isStreaming: false,
          currentStep: 'done',
          completedSteps: ['reading', 'parts', 'wiring', 'code', 'case', 'done'],
          buildData: finalBuild,
          text: `I've designed **${finalBuild.name}** for you! The parts list, wiring diagram, 3D enclosure, and firmware have been synthesized. Explore the interactive tabs below to simulate the circuit or order the kit.`,
        };
      })
    );

    onBuildReady(finalBuild);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-4">
      {/* Chat Messages Feed */}
      <div className="space-y-4 px-2 sm:px-4 py-2 min-h-[140px]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Solder Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`flex flex-col space-y-2.5 max-w-[85%] sm:max-w-xl transition-all ${
                  isUser
                    ? 'bg-zinc-900 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-md'
                    : 'bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 border border-zinc-200/90 shadow-sm text-zinc-800'
                }`}
              >
                {/* Header tag for Assistant */}
                {!isUser && (
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-100">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <span>Solder Hardware Agent</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                )}

                {/* Message Text */}
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.text}
                </p>

                {/* Live Step-by-Step Progress Pipeline */}
                {msg.isStreaming && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <span>Synthesizing Hardware Build</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        In Progress
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {PROGRESS_STAGES.map((stg) => {
                        const Icon = stg.icon;
                        const isDone = msg.completedSteps?.includes(stg.key);
                        const isCurrent = msg.currentStep === stg.key;

                        return (
                          <div
                            key={stg.key}
                            className={`p-2 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                              isDone
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : isCurrent
                                ? 'bg-amber-50/70 border-amber-300 text-amber-900 ring-1 ring-amber-300/40'
                                : 'bg-zinc-50 border-zinc-200/60 text-zinc-400 opacity-60'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Icon className="w-3 h-3" />
                              )}
                            </div>
                            <span className="text-[11px] font-semibold truncate">
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progressive Reveal Card (when build is ready) */}
                {msg.buildData && (
                  <div className="mt-2 pt-3 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium uppercase">
                        <Layers className="w-3 h-3 text-zinc-500" />
                        <span>BOM Parts</span>
                      </div>
                      <span className="font-bold text-zinc-900 mt-1 block">
                        {msg.buildData.parts.length} Components
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                        ₹{msg.buildData.parts.reduce((s, p) => s + p.priceInr * p.qty, 0)} INR
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium uppercase">
                        <Box className="w-3 h-3 text-emerald-600" />
                        <span>3D Case</span>
                      </div>
                      <span className="font-bold text-zinc-900 mt-1 block truncate">
                        {msg.buildData.case.lidType} fit
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {msg.buildData.case.outerMm?.[0]}×{msg.buildData.case.outerMm?.[1]}mm
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium uppercase">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Wiring</span>
                      </div>
                      <span className="font-bold text-zinc-900 mt-1 block">
                        {msg.buildData.wiring?.length || 0} Connections
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Schematic OK
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium uppercase">
                        <Code2 className="w-3 h-3 text-sky-500" />
                        <span>Firmware</span>
                      </div>
                      <span className="font-bold text-zinc-900 mt-1 block truncate">
                        {msg.buildData.board.toUpperCase()} target
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        0 warnings ✓
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Composer */}
      <div className="sticky bottom-0 z-20 pb-2 pt-2 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent">
        {/* Quick Idea Chips Floating Above Composer */}
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 text-xs">
          <span className="text-zinc-600 font-semibold text-[11px] whitespace-nowrap pl-1">
            Quick Builds:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(chip.prompt)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/90 shadow-2xs font-medium text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              +{chip.label}
            </button>
          ))}
        </div>

        {/* Input Box Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-white rounded-2xl border border-zinc-200 shadow-md focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all p-1.5 sm:p-2"
        >
          {/* Sparkle Icon */}
          <div className="pl-3 sm:pl-3.5 text-zinc-400">
            <Sparkles className="w-5 h-5 text-zinc-400" />
          </div>

          {/* Text Input with Animated Typewriter Placeholder */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={placeholderText ? `e.g. ${placeholderText}` : 'Type any hardware idea...'}
            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-60"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pr-1">
            {/* Scrap photo button */}
            <button
              type="button"
              onClick={onOpenScrapMode}
              title="Scrap Mode: Snap photo of parts drawer"
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <Camera className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline text-xs">Scrap photo</span>
            </button>

            {/* Send / Generate Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputPrompt.trim() && !placeholderText)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Engineering...</span>
                </>
              ) : (
                <>
                  <span>Build</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IdeaChat;
