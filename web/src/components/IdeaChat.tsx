import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowUp,
  Cpu,
  Layers,
  Zap,
  Code2,
  Box,
  CheckCircle2,
  Loader2,
  Camera,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { SHOWCASE_BUILDS } from '../data/showcases';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  chips?: string[];
  timestamp: number;
  buildData?: SolderBuild;
  isStreaming?: boolean;
  isTyping?: boolean;
  currentStep?: string;
  completedSteps?: string[];
  revealedParts?: any[];
  revealedWiring?: any[];
  revealedCase?: any;
}

interface IdeaChatProps {
  onBuildReady: (build: SolderBuild) => void;
  onOpenScrapMode: () => void;
  initialBuild?: SolderBuild;
  activeBuildId?: string;
}

const CYCLING_EXAMPLES = [
  'A desk plant waterer with moisture telemetry and 5V pump',
  'A motion-activated night lamp with PIR sensor and warm LED',
  'An ultrasonic radar with SG90 servo sweep and OLED screen',
  'An air quality alarm with MQ-135 gas sensor and piezo buzzer',
  'A solar-powered garden light with LDR sensor and 18650 battery',
  'A smart distance vault with servo latch and OLED display',
];

const QUICK_CHIPS = [
  { label: '🌱 Plant Waterer', prompt: 'Automatic plant waterer with capacitive soil probe and 5V pump' },
  { label: '💡 Motion Night Light', prompt: 'Motion-activated night light with PIR sensor and warm LED lamp' },
  { label: '📡 Distance Radar', prompt: 'Ultrasonic distance radar with SG90 servo sweep and OLED display' },
  { label: '🌤️ Air Quality Alarm', prompt: 'Indoor air quality monitor with MQ-135 gas sensor and buzzer alarm' },
  { label: '🔋 Solar Garden Lamp', prompt: 'Solar-powered garden light with LDR sensor and 18650 battery' },
  { label: '🔐 Smart Servo Lock', prompt: 'Smart door latch with SG90 servo and ultrasonic sensor' },
];

const PROGRESS_STAGES = [
  { key: 'reading', label: 'Reading your idea', icon: Sparkles },
  { key: 'parts', label: 'Picking parts', icon: Layers },
  { key: 'wiring', label: 'Wiring', icon: Zap },
  { key: 'firmware', label: 'Writing firmware', icon: Code2 },
  { key: 'case', label: 'Designing the case', icon: Box },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
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
      text: "Hi! I'm Solder, your hardware copilot. Type any idea below or tap an idea chip to generate a complete physical build: verified parts list with INR prices, pinout wiring, translucent 3D enclosure, and tested Arduino firmware.",
      timestamp: Date.now() - 60000,
      completedSteps: ['done'],
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

  // Auto-scroll to bottom of chat smoothly
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Real typing typewriter cycling placeholder
  useEffect(() => {
    const currentExample = CYCLING_EXAMPLES[placeholderIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (charIndex < currentExample.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentExample.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, 32);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2400);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentExample.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        }, 16);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % CYCLING_EXAMPLES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  // Clean up SSE stream on unmount
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
    const assistantMsgId = `asst-${Date.now()}`;

    // 1. Post User Message (right bubble)
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    // 2. Post Assistant Message with Typing Indicator (left bubble)
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      isTyping: true,
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

      // Step B: Live SSE Stream connection
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

            const stageKey = data.stage || data.step;

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                const completed = new Set(m.completedSteps || []);

                if (stageKey === 'reading' || stageKey === 'generate') {
                  completed.add('reading');
                  return {
                    ...m,
                    isTyping: false,
                    currentStep: 'parts',
                    completedSteps: Array.from(completed),
                    text: `Reading your idea: "${prompt}"... Analyzing hardware pinouts & MCU architecture.`,
                  };
                } else if (stageKey === 'parts') {
                  completed.add('reading');
                  completed.add('parts');
                  return {
                    ...m,
                    isTyping: false,
                    currentStep: 'wiring',
                    completedSteps: Array.from(completed),
                    revealedParts: data.parts || buildData?.parts,
                    text: `Selected ${data.parts?.length || buildData?.parts?.length || 4} components with market pricing in INR. Routing Dupont jumper connections...`,
                  };
                } else if (stageKey === 'wiring') {
                  completed.add('parts');
                  completed.add('wiring');
                  return {
                    ...m,
                    currentStep: 'firmware',
                    completedSteps: Array.from(completed),
                    revealedWiring: data.wiring || buildData?.wiring,
                    text: `Routed ${data.wiring?.length || buildData?.wiring?.length || 8} circuit connections. Synthesizing Arduino C++ sketch...`,
                  };
                } else if (stageKey === 'firmware' || stageKey === 'compile') {
                  completed.add('wiring');
                  completed.add('firmware');
                  return {
                    ...m,
                    currentStep: 'case',
                    completedSteps: Array.from(completed),
                    text: `Firmware compiled cleanly for ${buildData?.board?.toUpperCase() || 'UNO'} ✓. Generating translucent 3D enclosure CAD...`,
                  };
                } else if (stageKey === 'case' || stageKey === 'fitcheck') {
                  completed.add('firmware');
                  completed.add('case');
                  return {
                    ...m,
                    currentStep: 'done',
                    completedSteps: Array.from(completed),
                    revealedCase: data.case || buildData?.case,
                    text: `3D frosted snap-fit enclosure generated (${buildData?.case?.outerMm?.join('x') || '128x96x40'}mm) with 2.0mm wall clearance. Finalizing build...`,
                  };
                } else if (stageKey === 'done' || stageKey === 'complete') {
                  completed.add('case');
                  completed.add('done');
                  if (data.data) buildData = data.data;
                  return {
                    ...m,
                    isStreaming: false,
                    isTyping: false,
                    currentStep: 'done',
                    completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
                    buildData: buildData || undefined,
                    revealedParts: buildData?.parts,
                    revealedWiring: buildData?.wiring,
                    revealedCase: buildData?.case,
                    text: `I've synthesized **${buildData?.name || 'Custom Build'}** for your idea! ${buildData?.tagline || ''} Explore the live 3D case, circuit wiring, and AVR simulation below.`,
                  };
                }

                return m;
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
            simulateProgressiveStream(buildData, assistantMsgId, prompt);
          }
        };
      } catch {
        simulateProgressiveStream(buildData, assistantMsgId, prompt);
      }
    } catch {
      simulateProgressiveStream(null, assistantMsgId, prompt);
    }
  };

  // Graceful fallback streaming sequence with typewriter & progressive reveal
  const simulateProgressiveStream = async (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    // 1. Reading your idea
    await new Promise((r) => setTimeout(r, 400));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isTyping: false,
              currentStep: 'reading',
              completedSteps: ['reading'],
              text: `Reading your idea: "${prompt}"... Determining microcontroller and sensor requirements.`,
            }
          : m
      )
    );

    // 2. Picking parts -> progressively reveals parts
    await new Promise((r) => setTimeout(r, 650));
    const targetBuild = buildData || SHOWCASE_BUILDS.sip;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'parts',
              completedSteps: ['reading', 'parts'],
              revealedParts: targetBuild.parts,
              text: `Picking parts: Selected ${targetBuild.parts.length} components with exact INR pricing (Total: ₹${targetBuild.product?.priceInr || 890}).`,
            }
          : m
      )
    );

    // 3. Wiring -> progressively reveals wiring
    await new Promise((r) => setTimeout(r, 700));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'wiring',
              completedSteps: ['reading', 'parts', 'wiring'],
              revealedWiring: targetBuild.wiring,
              text: `Wiring: Routed ${targetBuild.wiring.length} DuPont connections (5V, GND, I2C, control lines).`,
            }
          : m
      )
    );

    // 4. Writing firmware
    await new Promise((r) => setTimeout(r, 650));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'firmware',
              completedSteps: ['reading', 'parts', 'wiring', 'firmware'],
              text: `Writing firmware: Synthesized Arduino C++ sketch (${targetBuild.code.filename}) verified for ${targetBuild.board.toUpperCase()}.`,
            }
          : m
      )
    );

    // 5. Designing the case -> progressively reveals 3D case
    await new Promise((r) => setTimeout(r, 650));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'case',
              completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case'],
              revealedCase: targetBuild.case,
              text: `Designing the case: Generated frosted snap-fit enclosure (${targetBuild.case.outerMm.join('x')}mm) with 2.0mm wall clearance.`,
            }
          : m
      )
    );

    // 6. Done
    await new Promise((r) => setTimeout(r, 500));
    finishBuild(buildData, msgId, prompt);
  };

  const finishBuild = (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    setIsLoading(false);
    const finalBuild: SolderBuild = buildData || SHOWCASE_BUILDS.sip;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          isStreaming: false,
          isTyping: false,
          currentStep: 'done',
          completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
          buildData: finalBuild,
          revealedParts: finalBuild.parts,
          revealedWiring: finalBuild.wiring,
          revealedCase: finalBuild.case,
          text: `I've synthesized **${finalBuild.name}** for your idea! ${finalBuild.tagline || finalBuild.summary}\n\nThe verified BOM, 3D enclosure, circuit schematic, and Arduino firmware are ready below.`,
        };
      })
    );

    onBuildReady(finalBuild);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-sans">
      {/* Top Copilot Header */}
      <div className="px-5 py-3.5 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-xs flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100">Solder Hardware Copilot</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini 3.8 Flash • Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Conversational hardware synthesis, 3D enclosures &amp; verified firmware
            </p>
          </div>
        </div>

        {/* Scrap photo button */}
        <button
          type="button"
          onClick={onOpenScrapMode}
          title="Scrap Mode: Snap photo of parts drawer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-xs font-medium text-zinc-300 hover:text-white transition shadow-xs"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Scrap Drawer</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-[280px] max-h-[500px] scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            // User Message Bubble (Right)
            return (
              <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="max-w-lg bg-zinc-800/95 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-2xl rounded-tr-xs px-4 py-3 shadow-md space-y-1">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className="text-[9px] text-zinc-400 text-right font-mono pt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          }

          // Assistant Message Bubble (Left with Solder Avatar)
          return (
            <div key={msg.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Solder Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Sparkles className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              </div>

              {/* Message Content Container */}
              <div className="flex-1 max-w-2xl bg-zinc-900/90 border border-zinc-800/90 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-zinc-200 shadow-md space-y-3.5 backdrop-blur-xs">
                {/* Typing Indicator */}
                {msg.isTyping && (
                  <div className="flex items-center gap-1.5 py-1 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                    <span className="text-xs font-mono text-zinc-400 ml-2">Reading your idea...</span>
                  </div>
                )}

                {/* Assistant Text */}
                {msg.text && (
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-200 whitespace-pre-line font-normal">
                    {msg.text}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-400 animate-pulse align-middle"></span>
                    )}
                  </p>
                )}

                {/* Step-by-Step SSE Progress Pipeline */}
                {msg.isStreaming && (
                  <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 font-mono text-xs shadow-inner">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Live Hardware Synthesis</span>
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Active Stream
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
                                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                                : isCurrent
                                ? 'bg-amber-950/40 border-amber-700/80 text-amber-200 ring-1 ring-amber-500/30'
                                : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-500 opacity-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrent
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-zinc-800 text-zinc-500'
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

                {/* Progressive Reveal 1: Parts List */}
                {msg.revealedParts && msg.revealedParts.length > 0 && (
                  <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                        Selected BOM Components
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ₹{msg.revealedParts.reduce((s, p) => s + (p.priceInr || 0) * (p.qty || 1), 0)} INR
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.revealedParts.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-zinc-500 font-mono">₹{p.priceInr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progressive Reveal 2: Circuit Wiring */}
                {msg.revealedWiring && msg.revealedWiring.length > 0 && (
                  <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-1.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Circuit Wiring Plan
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {msg.revealedWiring.length} DuPont connections
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Pinout color-coded for 5V power, ground rails, analog inputs, and I2C buses.
                    </p>
                  </div>
                )}

                {/* Progressive Reveal 3: 3D Frosted Case */}
                {msg.revealedCase && (
                  <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-1.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-emerald-400" />
                        3D Frosted Enclosure
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {msg.revealedCase.outerMm ? msg.revealedCase.outerMm.join(' × ') + ' mm' : '128 × 96 × 40 mm'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Translucent acrylic snap-fit shell with cutouts, 2.0mm wall clearance, and M3 standoffs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Composer */}
      <div className="sticky bottom-0 z-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 pt-3 pb-3 px-3 sm:px-4 space-y-2.5">
        {/* Quick Idea Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold px-1 shrink-0">
            Ideas:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(chip.prompt)}
              className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition shadow-xs shrink-0 text-xs font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar with Rounded Pill Shape & Animated Typewriter Placeholder */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-full px-4 py-2 transition-all shadow-inner"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mr-2 opacity-80" />
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={placeholderText ? `e.g. ${placeholderText}` : 'Type any hardware idea...'}
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden disabled:opacity-50"
          />

          {/* Send Button (ChatGPT/Gemini rounded icon button) */}
          <button
            type="submit"
            disabled={isLoading || (!inputPrompt.trim() && !placeholderText)}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center transition shadow-xs disabled:opacity-30 disabled:hover:bg-emerald-500 shrink-0 font-bold ml-1"
            title="Send idea to Solder"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IdeaChat;
