import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import type { SolderBuild } from '../types';
import { HarnessTrace, VerifierCheck } from './HarnessTrace';
import { ResultPanel } from './ResultPanel';
import { SolderLogo } from './SolderLogo';

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
  onOpenShare?: () => void;
  onSelectShowcase: (id: string) => void;
  onSelectTab?: (tab: 'case' | 'parts' | 'wiring' | 'simulate' | 'firmware') => void;
}

const CHIPS = [
  'Desk fan that starts when it gets hot',
  'Plant that waters itself when dry',
  'Night light that fades on at dusk',
  'Doorbell that flashes a lamp',
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

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="mono px-1 py-0.5 rounded bg-[#202020] text-[#e0e0e0] text-[12px] border border-[#333]"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }
    return parts;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      return;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-[#d4d4d4]">
          {parseInline(trimmed.slice(2))}
        </li>
      );
      return;
    }
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-[#d4d4d4]">
        {parseInline(line)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenScrapMode,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
  onOpenShare,
  onSelectShowcase,
  onSelectTab,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConversationEmpty = messages.length === 0;

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleRate = (id: string, direction: 'up' | 'down') => {
    setRatings((prev) => ({
      ...prev,
      [id]: prev[id] === direction ? (undefined as any) : direction,
    }));
  };

  // Square tray composer matching chatgpt-inline.html
  const renderComposerTray = (autoFocus = false) => {
    const hasText = inputText.trim().length > 0;

    return (
      <form
        onSubmit={handleSubmit}
        className="composer-tray w-full bg-[#161616] border border-[#333333] focus-within:border-[#555] rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition"
      >
        <span
          className="composer-dot w-2 h-2 rounded-full bg-[#555] shrink-0"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe a device"
          aria-label="Describe a device"
          autoFocus={autoFocus}
          disabled={isLoading}
          className="bg-transparent text-sm text-[#f5f5f5] placeholder:text-[#666] outline-none flex-1 min-w-0"
        />

        <button
          type="submit"
          disabled={!hasText || isLoading}
          className={`send w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            hasText && !isLoading
              ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
              : 'bg-[#262626] text-[#555] cursor-not-allowed opacity-50'
          }`}
          aria-label="Send"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 11.25V2.75M7 2.75L3.25 6.5M7 2.75L10.75 6.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto select-text relative w-full bg-[#0f0f0f]">
      {/* 1. EMPTY STATE (when no messages yet) */}
      {isConversationEmpty ? (
        <div className="empty flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="empty-stack col max-w-[768px] w-full flex flex-col items-center">
            {/* Heading */}
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#f5f5f5] tracking-tight text-center mb-6">
              What are we making?
            </h1>

            {/* Composer Tray directly under heading */}
            <div className="w-full mb-5">{renderComposerTray(true)}</div>

            {/* Chips matching chatgpt-inline-empty.html */}
            <div className="chips flex flex-wrap justify-center gap-2 w-full">
              {CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(chip)}
                  className="chip px-3 py-1.5 rounded-lg border border-[#333333] hover:border-[#444] bg-[#161616] hover:bg-[#202020] text-xs text-[#a3a3a3] hover:text-white transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 2. CONVERSATION THREAD (centered 768px column) */
        <div className="thread flex-1 overflow-y-auto min-h-0 py-6 px-4">
          <div className="col max-w-[768px] mx-auto w-full space-y-6">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end w-full">
                    <div className="msg-user bg-[#262626] border border-[#333] text-[#f5f5f5] rounded-2xl px-4 py-2.5 max-w-[85%] text-[14.5px] leading-relaxed shadow-xs break-words select-text">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Assistant message: Lead text + Harness + Tabbed Result Card
              return (
                <div key={msg.id} className="msg-assistant w-full space-y-3">
                  {/* Lead text */}
                  {msg.text && (
                    <div className="lead text-[14.5px] leading-relaxed text-[#d4d4d4]">
                      <FormattedMarkdown content={msg.text} />
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-[#f5f5f5] ml-1 translate-y-0.5 animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Typing / streaming progress indicator */}
                  {msg.isTyping && (
                    <div className="flex items-center gap-1.5 py-1 text-[#a3a3a3]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse [animation-delay:150ms]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse [animation-delay:300ms]"></span>
                    </div>
                  )}

                  {/* Live Progress Checklist while synthesizing build */}
                  {msg.isStreaming && (
                    <div className="p-3 rounded-lg bg-[#161616] border border-[#2a2a2a] space-y-2 text-xs">
                      <div className="font-medium text-[#f5f5f5] flex items-center justify-between">
                        <span>Hardware Co-Design Pipeline</span>
                        <Loader2 className="w-3.5 h-3.5 text-[#a3a3a3] animate-spin" />
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
                                  ? 'text-emerald-500 font-medium'
                                  : isCurrent
                                  ? 'text-white font-medium'
                                  : 'text-[#666]'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 text-[#a3a3a3] animate-spin shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-[#444] shrink-0" />
                              )}
                              <span>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Solder Deterministic Harness Trace (vertical signal line, nodes, red pin-conflict line, summary) */}
                  {(msg.buildData || !msg.isStreaming) && (
                    <HarnessTrace
                      build={msg.buildData}
                      isStreaming={msg.isStreaming}
                      checks={msg.harnessChecks}
                      onSelectTab={onSelectTab}
                    />
                  )}

                  {/* Tabbed Result Card (3D Case, Parts, Wiring, Simulate, Firmware) */}
                  {msg.buildData && (
                    <ResultPanel
                      build={msg.buildData}
                      onOpenOrder={onOpenOrder}
                      onOpenShip={onOpenShip}
                      onOpenAr={onOpenAr}
                      onOpenShare={onOpenShare}
                    />
                  )}

                  {/* Message Actions Row (Copy, Regenerate, Thumbs) */}
                  <div className="flex items-center gap-1 text-[#666] pt-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1.5 rounded-md hover:bg-[#1f1f1f] hover:text-[#f5f5f5] transition cursor-pointer"
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
                      className="p-1.5 rounded-md hover:bg-[#1f1f1f] hover:text-[#f5f5f5] transition cursor-pointer"
                      title="Regenerate build"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRate(msg.id, 'up')}
                      className={`p-1.5 rounded-md hover:bg-[#1f1f1f] transition cursor-pointer ${
                        ratings[msg.id] === 'up'
                          ? 'text-[#f5f5f5]'
                          : 'hover:text-[#f5f5f5] text-[#666]'
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRate(msg.id, 'down')}
                      className={`p-1.5 rounded-md hover:bg-[#1f1f1f] transition cursor-pointer ${
                        ratings[msg.id] === 'down'
                          ? 'text-rose-500'
                          : 'hover:text-[#f5f5f5] text-[#666]'
                      }`}
                      title="Poor response"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* 3. DOCKED BOTTOM COMPOSER (when conversation is active) */}
      {!isConversationEmpty && (
        <div className="composer-wrap sticky bottom-0 z-20 shrink-0 w-full bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/95 to-transparent pt-3 pb-4">
          <div className="col max-w-[768px] mx-auto w-full px-4">
            {renderComposerTray(false)}
          </div>
        </div>
      )}
    </div>
  );
};
