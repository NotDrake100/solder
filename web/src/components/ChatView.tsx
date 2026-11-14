import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  Plus,
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Circle,
  Loader2,
  Zap,
  Sparkles,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { HarnessTrace, VerifierCheck } from './HarnessTrace';

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
  harnessChecks?: VerifierCheck[];
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  onOpenScrapMode: () => void;
  onOpenOrder: () => void;
  onOpenShip?: () => void;
  onOpenAr?: () => void;
  onSelectShowcase: (id: string) => void;
  onSelectTab?: (tab: 'case' | 'parts' | 'wiring' | 'simulate' | 'firmware' | 'harness') => void;
}

const SUGGESTIONS = [
  {
    title: 'Plant waterer',
    desc: 'Soil moisture sensor + pump relay',
    prompt:
      'Automatic plant waterer using Arduino, soil moisture sensor, and a 5V water pump relay with status LED',
  },
  {
    title: 'Motion night light',
    desc: 'PIR motion sensor + warm LED lamp',
    prompt:
      'Motion-activated bedside night light with PIR sensor, smooth PWM dimming LED, and light-dependent resistor (LDR)',
  },
  {
    title: 'Desk fan that turns on when hot',
    desc: 'Temp sensor + relay fan switch',
    prompt:
      'Smart desk fan that turns on automatically when ambient temperature exceeds 28°C with buzzer alert',
  },
  {
    title: 'Distance radar',
    desc: 'Ultrasonic sensor sweeping on SG90 servo',
    prompt:
      'Mini ultrasonic distance radar on SG90 micro servo with 0.96 inch I2C OLED display',
  },
];

const EXAMPLE_PLACEHOLDERS = [
  'Ask Solder: Plant waterer with soil sensor...',
  'Ask Solder: Motion-activated night light...',
  'Ask Solder: Desk fan that triggers when hot...',
  'Ask Solder: Distance radar with servo and OLED...',
  'Ask Solder: Smart deadbolt lock with RFID...',
  'Ask Solder: Rain-sensing balcony window closer...',
];

const PROGRESS_STEPS = [
  { key: 'reading', label: 'Reading your idea' },
  { key: 'parts', label: 'Picking parts' },
  { key: 'wiring', label: 'Wiring' },
  { key: 'firmware', label: 'Writing firmware' },
  { key: 'case', label: 'Designing the case' },
  { key: 'done', label: 'Done' },
];

/**
 * Clean markdown parser for assistant text
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
          <strong key={match.index} className="font-semibold text-stone-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-[#191816] text-orange-300 font-mono text-[13px] border border-[#383430]"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-stone-300">
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
          <pre
            key={`code-${i}`}
            className="my-2 p-3 rounded-xl bg-[#141312] border border-[#383430] text-emerald-400 font-mono text-xs overflow-x-auto"
          >
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
        <li key={`li-${i}`} className="ml-4 list-disc text-[14.5px] text-stone-200">
          {parseInline(itemText)}
        </li>
      );
      continue;
    } else if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }

    // Header 3 or 2
    if (line.trim().startsWith('### ') || line.trim().startsWith('## ')) {
      const hText = line.trim().replace(/^#{2,3}\s+/, '');
      elements.push(
        <h3 key={`h-${i}`} className="text-base font-semibold text-stone-100 mt-3 mb-1">
          {parseInline(hText)}
        </h3>
      );
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-[14.5px] leading-relaxed text-stone-200">
          {parseInline(line)}
        </p>
      );
    }
  }

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-end" className="my-2 space-y-1">
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-1 select-text">{elements}</div>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenScrapMode,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
  onSelectTab,
}) => {
  const [input, setInput] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycling Typewriter Placeholder
  const [placeholderText, setPlaceholderText] = useState(EXAMPLE_PLACEHOLDERS[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % EXAMPLE_PLACEHOLDERS.length;
      setPlaceholderText(EXAMPLE_PLACEHOLDERS[index]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = `${Math.max(28, newHeight)}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustHeight();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleRate = (id: string, type: 'up' | 'down') => {
    setRatings((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined : type,
    }));
  };

  const isConversationEmpty = messages.length === 0;

  // Render the composer pill component (used in empty state & pinned at bottom)
  const renderComposer = (isCentered: boolean = false) => {
    const hasText = input.trim().length > 0;

    return (
      <div className={`w-full ${isCentered ? 'max-w-[680px]' : 'max-w-full'} mx-auto px-3 sm:px-4 ${isCentered ? '' : 'pt-2 pb-3'}`}>
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-[#262422] rounded-[24px] min-h-[52px] px-3 py-1.5 transition-all border border-[#383430] focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 shadow-lg"
        >
          {/* + Button for Scrap Mode attachment */}
          <button
            type="button"
            onClick={onOpenScrapMode}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-[#34302c] transition shrink-0 mr-1.5"
            title="Attach photo for Scrap Mode"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Auto-growing Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-[14.5px] text-stone-100 placeholder-stone-500 leading-relaxed max-h-[140px] py-1 selection:bg-orange-500/20"
          />

          {/* Round 34px Send button: warm copper bg with dark up-arrow; disabled = #423d38 */}
          <button
            type="submit"
            disabled={!hasText || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-1.5 transition-all ${
              hasText && !isLoading
                ? 'bg-orange-500 text-stone-950 hover:bg-orange-400 cursor-pointer shadow-md shadow-orange-500/20'
                : 'bg-[#383430] text-stone-600 cursor-not-allowed opacity-60'
            }`}
            title="Send message"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Grey disclaimer */}
        <div className="text-center text-[11px] text-stone-500 pt-2 select-none">
          Solder can make mistakes. Check wiring before powering on.
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto select-text relative w-full bg-[#1f1e1c]">
      {/* 1. EMPTY STATE (when no messages yet) */}
      {isConversationEmpty ? (
        <div className="m-auto flex flex-col items-center max-w-[680px] w-full px-4 py-12">
          {/* Large centered greeting */}
          <h1 className="text-[32px] font-semibold text-stone-100 tracking-[-1.2px] text-center mb-6">
            What do you want to build?
          </h1>

          {/* Composer directly under heading */}
          <div className="w-full mb-6">
            {renderComposer(true)}
          </div>

          {/* 4 suggestion chips in a 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(item.prompt)}
                className="p-3.5 rounded-2xl bg-[#262422] hover:bg-[#2e2a27] border border-[#383430] text-left transition group"
              >
                <div className="text-xs font-semibold text-stone-200 group-hover:text-orange-400 transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 2. CONVERSATION MESSAGES LIST (inside the chat column) */
        <div className="w-full px-3 sm:px-4 py-4 space-y-5 flex-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end w-full">
                  <div className="bg-[#262422] border border-[#383430] text-stone-100 rounded-[20px] px-3.5 py-2 max-w-[85%] text-[14.5px] leading-relaxed shadow-sm break-words select-text">
                    {msg.text}
                  </div>
                </div>
              );
            }

            // Assistant message: No bubble, full column width, warm Solder avatar on left
            return (
              <div key={msg.id} className="flex gap-2.5 sm:gap-3 items-start w-full">
                {/* Round Solder Copper Avatar */}
                <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5 text-orange-400">
                  <Zap className="w-3.5 h-3.5 fill-orange-400/20" />
                </div>

                {/* Assistant Content Column */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Typing Indicator (3 pulsing dots) */}
                  {msg.isTyping && (
                    <div className="flex items-center gap-1.5 py-1 text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse [animation-delay:150ms]"></span>
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse [animation-delay:300ms]"></span>
                    </div>
                  )}

                  {/* Markdown Formatted Text & Blinking Caret */}
                  {msg.text && (
                    <div className="text-[14.5px] leading-relaxed text-stone-200">
                      <FormattedMarkdown content={msg.text} />
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-orange-400 ml-1 translate-y-0.5 animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Live Progress Checklist while building */}
                  {msg.isStreaming && (
                    <div className="p-3 rounded-xl bg-[#262422] border border-[#383430] space-y-2 text-xs">
                      <div className="font-medium text-stone-200 flex items-center justify-between">
                        <span>Hardware Co-Design Pipeline</span>
                        <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {PROGRESS_STEPS.map((step) => {
                          const isDone = msg.completedSteps?.includes(step.key);
                          const isCurrent = msg.currentStep === step.key;

                          return (
                            <div
                              key={step.key}
                              className={`flex items-center gap-2 transition-colors ${
                                isDone
                                  ? 'text-emerald-400 font-medium'
                                  : isCurrent
                                  ? 'text-stone-100 font-medium'
                                  : 'text-stone-500'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                              )}
                              <span>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Solder Deterministic Harness Trace (Hero of the demo!) */}
                  {(msg.buildData || !msg.isStreaming) && (
                    <div className="my-2">
                      <HarnessTrace
                        build={msg.buildData}
                        isStreaming={msg.isStreaming}
                        checks={msg.harnessChecks}
                        onSelectTab={onSelectTab}
                      />
                    </div>
                  )}

                  {/* Row of ghost icon buttons under each reply: copy, regenerate, thumbs */}
                  <div className="flex items-center gap-1 text-stone-500 pt-0.5">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1.5 rounded-lg hover:bg-[#262422] hover:text-stone-200 transition"
                      title="Copy reply text"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onSendMessage(msg.text || 'Rebuild')}
                      className="p-1.5 rounded-lg hover:bg-[#262422] hover:text-stone-200 transition"
                      title="Regenerate build"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRate(msg.id, 'up')}
                      className={`p-1.5 rounded-lg hover:bg-[#262422] transition ${
                        ratings[msg.id] === 'up'
                          ? 'text-orange-400'
                          : 'hover:text-stone-200 text-stone-500'
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRate(msg.id, 'down')}
                      className={`p-1.5 rounded-lg hover:bg-[#262422] transition ${
                        ratings[msg.id] === 'down'
                          ? 'text-rose-400'
                          : 'hover:text-stone-200 text-stone-500'
                      }`}
                      title="Poor response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
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
        <div className="sticky bottom-0 z-20 shrink-0 w-full bg-gradient-to-t from-[#1f1e1c] via-[#1f1e1c]/95 to-transparent pt-2 pb-safe">
          {renderComposer(false)}
        </div>
      )}
    </div>
  );
};
