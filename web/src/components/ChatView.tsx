import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Circle,
  Loader2,
  Plus,
  Camera,
  Image as ImageIcon,
  X,
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
  photoBase64?: string;
  detectedParts?: Array<{ name: string; libId?: string; confidence?: number }>;
  suggestedPrompt?: string;
  inventory?: string[];
  buildData?: SolderBuild;
  isStreaming?: boolean;
  isTyping?: boolean;
  currentStep?: string;
  completedSteps?: string[];
  harnessChecks?: VerifierCheck[];
}

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, photoBase64?: string, inventory?: string[]) => void;
  isLoading: boolean;
  onOpenScrapMode: () => void;
  onOpenLiveCamera: () => void;
  onOpenOrder: () => void;
  onOpenShip?: () => void;
  onOpenAr?: () => void;
  onOpenShare?: () => void;
  onSelectShowcase: (id: string) => void;
  onSelectTab?: (tab: 'case' | 'parts' | 'wiring' | 'simulate' | 'firmware') => void;
  activeInventory?: string[];
  onClearInventory?: () => void;
}

const CHIPS = [
  {
    label: 'AI pocket assistant',
    prompt: 'An AI pocket assistant I can talk to, on a Raspberry Pi',
  },
  {
    label: 'Pi security camera',
    prompt: 'A Raspberry Pi camera that sends me a photo when it sees motion',
  },
  {
    label: 'Voice-controlled lamp',
    prompt: 'A lamp I can turn on and off with my voice',
  },
  {
    label: 'Desk fan that starts when it gets hot',
    prompt: 'Desk fan that starts when it gets hot',
  },
];

/**
 * Clean markdown parser for assistant text with comfortable reading typography
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
            className="mono px-1.5 py-0.5 rounded bg-[#202020] text-[#e0e0e0] text-[13px] border border-[#333]"
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
      <p key={`p-${i}`} className="leading-[1.7] text-[#d4d4d4]">
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
  onOpenLiveCamera,
  onOpenOrder,
  onOpenShip,
  onOpenAr,
  onOpenShare,
  onSelectShowcase,
  onSelectTab,
  activeInventory = [],
  onClearInventory,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const fileCaptureInputRef = useRef<HTMLInputElement>(null);

  const isConversationEmpty = messages.length === 0;

  // Auto scroll to bottom with smooth behavior
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when active inventory is populated from live camera
  useEffect(() => {
    if (activeInventory.length > 0) {
      inputRef.current?.focus();
    }
  }, [activeInventory]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    const hasInventory = activeInventory.length > 0;
    if ((!trimmed && !selectedPhotoBase64 && !hasInventory) || isLoading) return;

    onSendMessage(
      trimmed || (hasInventory ? `Build with ${activeInventory.join(', ')}` : 'Build with this photo'),
      selectedPhotoBase64 || undefined,
      hasInventory ? activeInventory : undefined
    );
    setInputText('');
    setSelectedPhotoBase64(null);
    setShowAttachMenu(false);
    if (onClearInventory) onClearInventory();
  };

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (b64) {
        setSelectedPhotoBase64(b64);
        setShowAttachMenu(false);
        inputRef.current?.focus();
      }
    };
    reader.readAsDataURL(file);
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

  // Square tray composer matching chatgpt-inline.html + photo sharing & live camera
  const renderComposerTray = (autoFocus = false) => {
    const hasText = inputText.trim().length > 0 || Boolean(selectedPhotoBase64);

    return (
      <div className="relative w-full">
        {/* Pending photo thumbnail preview */}
        {selectedPhotoBase64 && (
          <div className="mb-2 inline-flex items-center gap-2 p-1.5 rounded-xl bg-[#161616] border border-[#333] shadow-md animate-fadeIn">
            <img
              src={selectedPhotoBase64}
              alt="Upload preview"
              className="w-12 h-12 object-cover rounded-lg border border-[#444]"
            />
            <span className="text-xs text-[#a3a3a3] font-medium pr-1">Photo attached</span>
            <button
              type="button"
              onClick={() => setSelectedPhotoBase64(null)}
              className="p-1 rounded-full text-[#888] hover:text-white hover:bg-[#262626] transition cursor-pointer"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attach Menu Popover */}
        {showAttachMenu && (
          <div className="absolute bottom-14 left-0 z-30 p-1.5 rounded-xl bg-[#1a1a1a] border border-[#333] shadow-2xl flex flex-col gap-1 w-48 text-xs select-none animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                onOpenLiveCamera();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-[#262626] transition text-left cursor-pointer font-medium"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Scan my parts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                fileUploadInputRef.current?.click();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#d4d4d4] hover:text-white hover:bg-[#262626] transition text-left cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#a3a3a3]" />
              <span>Upload photo</span>
            </button>

            {/* Camera photo: only on mobile devices (QA-R5 #3) */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                fileCaptureInputRef.current?.click();
              }}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-[#d4d4d4] hover:text-white hover:bg-[#262626] transition text-left cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#a3a3a3]" />
              <span>Camera photo</span>
            </button>
          </div>
        )}

        {/* Hidden file pickers */}
        <input
          ref={fileUploadInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhotoFile(f);
          }}
          className="hidden"
        />
        <input
          ref={fileCaptureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhotoFile(f);
          }}
          className="hidden"
        />

        {/* Tracked parts chip above input (QA-R2 #4) */}
        {activeInventory && activeInventory.length > 0 && (
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#333] text-xs text-[#d4d4d4] animate-fadeIn max-w-full">
            <span className="text-[#888] font-medium shrink-0">Using:</span>
            <span className="text-white font-medium truncate">
              {activeInventory.join(', ')}
            </span>
            {onClearInventory && (
              <button
                type="button"
                onClick={onClearInventory}
                className="p-0.5 rounded text-[#888] hover:text-white hover:bg-[#262626] transition cursor-pointer shrink-0 ml-1"
                title="Remove tracked parts"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="composer-tray w-full bg-[#161616] border border-[#333333] focus-within:border-[#555] rounded-xl px-2.5 py-2 flex items-center gap-2 transition shadow-xs"
        >
          {/* ONE Plus button for Photo & Camera (QA-R2 #6) */}
          <button
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#242424] transition cursor-pointer shrink-0"
            title="Attach photo or open camera"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeInventory.length > 0
                ? "What should these parts do?"
                : "Describe a device or ask Solder..."
            }
            aria-label="Describe a device"
            autoFocus={autoFocus}
            disabled={isLoading}
            className="bg-transparent text-[15px] text-[#f5f5f5] placeholder:text-[#666] outline-none flex-1 min-w-0"
          />

          <button
            type="submit"
            disabled={!hasText || isLoading}
            className={`send w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              hasText && !isLoading
                ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer shadow'
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
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto select-text relative w-full bg-[#0f0f0f] scroll-smooth">
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

            {/* Chips matching PI-SPEC Section 4 */}
            <div className="chips flex flex-wrap justify-center gap-2 w-full">
              {CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(chip.prompt)}
                  className="chip px-3 py-1.5 rounded-lg border border-[#333333] hover:border-[#444] bg-[#161616] hover:bg-[#202020] text-xs text-[#a3a3a3] hover:text-white transition cursor-pointer"
                >
                  {chip.label}
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
                  <div key={msg.id} className="flex justify-end w-full animate-fadeIn">
                    <div className="msg-user bg-[#242424] border border-[#2e2e2e] text-[#f5f5f5] rounded-[22px] px-4.5 py-3 max-w-[85%] text-[16px] leading-[1.7] shadow-xs break-words select-text">
                      {/* Thumbnail if user shared a photo */}
                      {msg.photoBase64 && (
                        <img
                          src={msg.photoBase64}
                          alt="User shared parts"
                          className="rounded-xl max-h-56 w-auto object-cover border border-[#383838] mb-2.5 shadow"
                        />
                      )}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                );
              }

              // Assistant message: Avatar + Lead text + Harness + Tabbed Result Card
              const hasLeadContent = Boolean(msg.text || (msg.detectedParts && msg.detectedParts.length > 0));
              const showTypingDots = msg.isTyping && !msg.text && (!msg.harnessChecks || msg.harnessChecks.length === 0);

              return (
                <div key={msg.id} className="msg-assistant w-full space-y-3.5 animate-fadeIn">
                  {/* Assistant Avatar + Lead text row (only when content or typing dots exist) */}
                  {(hasLeadContent || showTypingDots) && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs">
                        <SolderLogo className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Lead text */}
                        {msg.text && (
                          <div className="lead text-[16px] leading-[1.7] text-[#d4d4d4]">
                            <FormattedMarkdown content={msg.text} />
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-4 bg-[#f5f5f5] ml-1 translate-y-0.5 animate-pulse" />
                            )}
                          </div>
                        )}

                        {/* Vision Detected Parts list & "Build with these" chip */}
                        {msg.detectedParts && msg.detectedParts.length > 0 && (
                          <div className="p-3 rounded-xl bg-[#161616] border border-[#2c2c2c] space-y-2.5 text-xs">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-white" />
                              <span>Identified Hardware Components</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.detectedParts.map((p, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#222] border border-[#333] text-white"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                  <span>{p.name}</span>
                                </span>
                              ))}
                            </div>

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onSendMessage(
                                    msg.suggestedPrompt || `Build device using ${msg.detectedParts?.map((p) => p.name).join(', ')}`,
                                    undefined,
                                    msg.detectedParts?.map((p) => p.name)
                                  )
                                }
                                className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer shadow-sm flex items-center gap-1.5"
                              >
                                <span>Build with these parts</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Typing dots: only when waiting and no checks or text */}
                        {showTypingDots && (
                          <div className="flex items-center gap-1.5 py-1 text-[#a3a3a3]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse [animation-delay:150ms]"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] animate-pulse [animation-delay:300ms]"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Solder Deterministic Harness Trace: Only HarnessTrace signal-line rows while building and done */}
                  {(msg.buildData || msg.isStreaming || (msg.harnessChecks && msg.harnessChecks.length > 0)) && (
                    <div className="ml-10">
                      <HarnessTrace
                        build={msg.buildData}
                        isStreaming={msg.isStreaming}
                        checks={msg.harnessChecks}
                        onSelectTab={onSelectTab}
                      />
                    </div>
                  )}

                  {/* Tabbed Result Card (3D Case, Parts, Wiring, Simulate, Firmware) */}
                  {msg.buildData && (
                    <div className="ml-10">
                      <ResultPanel
                        build={msg.buildData}
                        onOpenOrder={onOpenOrder}
                        onOpenShip={onOpenShip}
                        onOpenAr={onOpenAr}
                        onOpenShare={onOpenShare}
                      />
                    </div>
                  )}

                  {/* Message Actions Row (Copy, Regenerate, Thumbs) */}
                  <div className="ml-10 flex items-center gap-1 text-[#666] pt-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1.5 rounded-md hover:bg-[#1f1f1f] hover:text-[#f5f5f5] transition cursor-pointer"
                      title="Copy reply text"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-white" />
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
                          ? 'text-white'
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
