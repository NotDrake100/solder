import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Terminal, ShieldCheck } from 'lucide-react';
import type { AgentLogStep } from '../types';

interface AgentLogPanelProps {
  steps: AgentLogStep[];
  isStreaming?: boolean;
}

export const AgentLogPanel: React.FC<AgentLogPanelProps> = ({
  steps,
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  const errorCount = steps.filter((s) => s.status === 'error').length;
  const allSuccess = steps.length > 0 && steps.every((s) => s.status === 'success');

  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-200/90 shadow-soft overflow-hidden transition-all">
      {/* Top Banner / Summary */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-zinc-50/70 hover:bg-zinc-50 border-b border-zinc-100 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-[11px] font-bold">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900">Solder Agent Verification Loop</span>
              {isStreaming && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Autonomous compiler, headless avr8js simulation & clearance check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick status badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {allSuccess && (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Complete
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 font-medium px-2 py-0.5 rounded-md border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Patched {errorCount} Issue
              </span>
            )}
          </div>

          <button className="text-zinc-400 hover:text-zinc-600 p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Logs Stream */}
      {isExpanded && (
        <div className="p-4 bg-zinc-950 text-zinc-200 font-mono text-xs divide-y divide-zinc-800/80 max-h-56 overflow-y-auto">
          {steps.map((step) => {
            const isSuccess = step.status === 'success';
            const isPending = step.status === 'pending';
            const isError = step.status === 'error';

            return (
              <div key={step.id} className="py-2.5 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isPending && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                    {isError && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <span className="text-zinc-100 font-semibold">{step.label}</span>
                    <span className="text-zinc-400 ml-2">{step.detail}</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 shrink-0">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
