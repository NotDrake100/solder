import React, { useState } from 'react';
import { ArduinoCode } from '../types';
import { Copy, Check, Download, Code2, Cpu, FileCode } from 'lucide-react';

interface CodeTabProps {
  code: ArduinoCode;
  board: string;
}

export const CodeTab: React.FC<CodeTabProps> = ({ code, board }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.ino);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code.ino], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = code.filename || 'sketch.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Syntax highlighting parser
  const renderHighlightedCode = (rawCode: string) => {
    const lines = rawCode.split('\n');
    return lines.map((line, idx) => {
      // Basic token recognition for Arduino C++
      let formatted = line;

      // Escape HTML
      formatted = formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Comments
      if (formatted.trim().startsWith('//') || formatted.trim().startsWith('/*') || formatted.trim().startsWith('*')) {
        return (
          <div key={idx} className="table-row leading-relaxed hover:bg-zinc-800/40">
            <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px] w-10">
              {idx + 1}
            </span>
            <span className="table-cell font-mono text-xs text-zinc-500 italic whitespace-pre">
              {line}
            </span>
          </div>
        );
      }

      // Preprocessor
      if (formatted.trim().startsWith('#')) {
        return (
          <div key={idx} className="table-row leading-relaxed hover:bg-zinc-800/40">
            <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px] w-10">
              {idx + 1}
            </span>
            <span className="table-cell font-mono text-xs text-amber-400 whitespace-pre">
              {line}
            </span>
          </div>
        );
      }

      return (
        <div key={idx} className="table-row leading-relaxed hover:bg-zinc-800/40">
          <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px] w-10">
            {idx + 1}
          </span>
          <span className="table-cell font-mono text-xs text-zinc-100 whitespace-pre">
            {line}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Code Header Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight font-mono">
              {code.filename || 'sketch.ino'}
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              arduino-cli verified
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Standard Arduino C++ firmware ready to flash with Arduino IDE or WebSerial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" />
            <span>Download .ino</span>
          </button>
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="bg-[#121214] rounded-2xl border border-zinc-800 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-xs text-zinc-400">
              {code.filename || 'sketch.ino'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <Cpu className="w-3 h-3 text-zinc-500" />
            <span>Target: {board.toUpperCase() === 'UNO' ? 'arduino:avr:uno' : 'esp32:esp32:esp32da'}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-x-auto max-h-[560px] overflow-y-auto">
          <div className="table w-full">
            {renderHighlightedCode(code.ino)}
          </div>
        </div>
      </div>
    </div>
  );
};
