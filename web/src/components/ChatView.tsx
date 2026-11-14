import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowUp,
  Camera,
  Copy,
  RotateCcw,
  Check,
  Share2,
  Loader2,
  CheckCircle2,
  Cpu,
  Box,
  Zap,
  Code2,
  Layers,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { AssistantResultCard } from './AssistantResultCard';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  buildData?: SolderBuild;
  isStreaming?: boolean;
  isTyping?: boolean;
  currentStep?: string;
  completedSteps?: string[];
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onOpenScrapMode: () => void;
  onOpenOrder?: () => void;
  onSelectShowcase: (id: string) => void;
}

const CYCLING_EXAMPLES = [
  'A desk plant waterer with moisture telemetry and 5V pump',
  'A motion-activated night lamp with PIR sensor and warm LED',
  'An ultrasonic radar with SG90 servo sweep and OLED screen',
  'An air quality alarm with MQ-135 gas sensor and buzzer',
  'A solar-powered garden light with LDR and 18650 battery',
  'A smart distance vault with servo latch and OLED display',
];

const SUGGESTION_CARDS = [
  {
    title: 'Plant Hydration System',
    desc: 'Automatic water pump with soil moisture sensor & OLED telemetry',
    prompt: 'Automatic plant waterer with capacitive soil probe, 5V relay and submersible pump',
    icon: '🌱',
  },
  {
    title: 'Motion Night Light',
    desc: 'PIR motion sensor turns on warm LED lamp in the dark',
    prompt: 'Motion-activated night light with PIR motion sensor and warm LED lamp',
    icon: '💡',
  },
  {
    title: 'Ultrasonic Radar',
    desc: 'SG90 servo sweeps distance with 0.96" OLED radar display',
    prompt: 'Ultrasonic distance radar with SG90 servo sweep and 0.96 inch OLED display',
    icon: '📡',
  },
  {
    title: 'Air Quality Alarm',
    desc: 'MQ-135 gas and temperature monitor with piezo buzzer warning',
    prompt: 'Indoor air quality alarm with MQ-135 gas sensor and piezo buzzer',
    icon: '🌤️',
  },
];

const PROGRESS_STAGES = [
  { key: 'reading', label: 'Reading your idea', icon: Sparkles },
  { key: 'parts', label: 'Picking parts', icon: Layers },
  { key: 'wiring', label: 'Wiring', icon: Zap },
  { key: 'firmware', label: 'Writing firmware', icon: Code2 },
  { key: 'case', label: 'Designing the case', icon: Box },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
];

/**
 * Clean markdown parser that replaces raw markdown (**bold**, `code`, *italic*, bullet lists) with styled JSX
 */
function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-zinc-950 dark:text-zinc-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-zinc-800 dark:text-zinc-200">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }
    return parts.length > 0 ? parts : [text];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-xs overflow-x-auto">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const itemText = line.trim().slice(2);
      currentList.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          {parseInline(itemText)}
        </li>
      );
      continue;
    } else if (currentList.length > 0) {
      elements.push(<ul key={`ul-${i}`} className="space-y-1 my-1.5">{currentList}</ul>);
      currentList = [];
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h-${i}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1">
          {parseInline(line.slice(4))}
        </h4>
      );
      continue;
    }

    // Regular line / paragraphs
    if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {parseInline(line)}
        </p>
      );
    }
  }

  if (currentList.length > 0) {
    elements.push(<ul key="ul-end" className="space-y-1 my-1.5">{currentList}</ul>);
  }

  return <div className="space-y-1">{elements}</div>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenScrapMode,
  onOpenOrder,
  onSelectShowcase,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Typewriter cycling placeholder state
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isConversationEmpty = messages.length === 0;

  // Auto-scroll to bottom as messages/tokens arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Real typing cycling placeholder
  useEffect(() => {
    const currentExample = CYCLING_EXAMPLES[placeholderIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (charIndex < currentExample.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentExample.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, 30);
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
        }, 15);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % CYCLING_EXAMPLES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText('');
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto select-text relative w-full">
      {/* 1. EMPTY STATE (Centered greeting + composer + 4 suggestion cards) */}
      {isConversationEmpty && (
        <div className="m-auto flex flex-col items-center max-w-[768px] w-full px-4 py-6 sm:py-10 shrink-0">
          {/* Big Centered Greeting */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              What do you want to build?
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
              Hardware schematics, 3D printable enclosures, verified Arduino firmware, and bill of materials.
            </p>
          </div>

          {/* Centered Composer */}
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-3xl shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/80 p-2 sm:p-3 transition-all"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={placeholderText ? `e.g. ${placeholderText}` : 'Type any physical hardware idea...'}
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none px-3 py-1 focus:outline-hidden"
            />

            <div className="flex items-center justify-between pt-1 px-1">
              {/* Attach / Scrap photo button */}
              <button
                type="button"
                onClick={onOpenScrapMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
                title="Scan spare parts drawer with camera"
              >
                <Camera className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Attach drawer photo</span>
              </button>

              {/* Round send arrow button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center transition shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
                title="Send idea"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* 4 Suggestion Cards in 2x2 Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 sm:mt-6">
            {SUGGESTION_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => onSendMessage(card.prompt)}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-zinc-200/90 dark:border-zinc-800 text-left transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    {card.title}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 leading-snug line-clamp-2">
                  {card.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. ACTIVE CONVERSATION (Max ~768px centered column) */}
      {!isConversationEmpty && (
        <div className="max-w-[768px] mx-auto w-full px-3 sm:px-4 pt-4 pb-6 space-y-6 flex-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              // User Message: Right-aligned soft grey bubble
              return (
                <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-3xl rounded-tr-md px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[70%] text-sm leading-relaxed shadow-xs">
                    {msg.text}
                  </div>
                </div>
              );
            }

            // Assistant Message: No bubble, avatar + formatted markdown text
            return (
              <div key={msg.id} className="flex items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* Solder Avatar */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </div>

                {/* Message Column */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Assistant Markdown Text */}
                  {msg.text && (
                    <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-normal">
                      <FormattedMarkdown content={msg.text} />
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle"></span>
                      )}
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {msg.isTyping && (
                    <div className="flex items-center gap-1.5 py-1 text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                      <span className="text-xs font-mono text-zinc-400 ml-2">Analyzing hardware requirements...</span>
                    </div>
                  )}

                  {/* Step-by-Step Progress Pipeline */}
                  {msg.isStreaming && (
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 space-y-2 font-mono text-xs">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Live Hardware Synthesis</span>
                        <span className="text-emerald-500 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Streaming
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {PROGRESS_STAGES.map((stg) => {
                          const isDone = msg.completedSteps?.includes(stg.key);
                          const isCurrent = msg.currentStep === stg.key;

                          return (
                            <div
                              key={stg.key}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                                isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                  : isCurrent
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20'
                                  : 'bg-zinc-100/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-3 h-3 text-emerald-500 shrink-0 stroke-[2.5]" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3 h-3 text-amber-500 shrink-0 animate-spin" />
                              ) : (
                                <span className="w-3 h-3 rounded-full border border-zinc-400 shrink-0 opacity-40"></span>
                              )}
                              <span className="text-[11px] font-semibold truncate">
                                {stg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rich Embedded Result Card (3D Case, Parts, Wiring, Simulate, Firmware) */}
                  {msg.buildData && (
                    <AssistantResultCard
                      build={msg.buildData}
                      onOpenOrder={onOpenOrder}
                    />
                  )}

                  {/* Row of small icon buttons under each reply: Copy, Regenerate, Share */}
                  <div className="flex items-center gap-1 pt-1 text-zinc-400">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      title="Copy reply text"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onSendMessage(msg.text || 'Rebuild')}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      title="Regenerate build"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: 'Solder Build', text: msg.text });
                        } else {
                          handleCopyMessage(msg.id, window.location.href);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      title="Share build"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. DOCKED BOTTOM COMPOSER (when conversation is active) */}
      {!isConversationEmpty && (
        <div className="sticky bottom-0 z-20 shrink-0 w-full bg-gradient-to-t from-white via-white/95 dark:from-zinc-950 dark:via-zinc-950/95 to-transparent pt-3 pb-safe pb-4">
          <div className="max-w-[768px] mx-auto w-full px-3 sm:px-4">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-full shadow-xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 px-3 py-1.5 sm:py-2 transition-all"
            >
              {/* Attach / Scrap photo button */}
              <button
                type="button"
                onClick={onOpenScrapMode}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Scan spare parts drawer"
              >
                <Camera className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Text input with cycling placeholder */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder={placeholderText ? `e.g. ${placeholderText}` : 'Type any hardware idea...'}
                className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-2 py-1 focus:outline-hidden disabled:opacity-50"
              />

              {/* Circular send arrow button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center transition shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
                title="Send idea"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-zinc-900" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
