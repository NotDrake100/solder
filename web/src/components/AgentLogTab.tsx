import React from 'react';
import { AgentLogStep } from '../types';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Terminal,
  ShieldCheck,
  Check,
  Cpu,
  Layers,
  Box,
} from 'lucide-react';

interface AgentLogTabProps {
  logs: AgentLogStep[];
  isGenerating?: boolean;
}

export const AgentLogTab: React.FC<AgentLogTabProps> = ({
  logs,
  isGenerating = false,
}) => {
  const getStepIcon = (step: string) => {
    switch (step) {
      case 'code_gen':
      case 'spec_parse':
        return Cpu;
      case 'compile':
        return Terminal;
      case 'sim_test':
        return ShieldCheck;
      case 'case_fit':
        return Box;
      default:
        return Layers;
    }
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'spec_parse':
        return 'Requirement & Parts Analysis';
      case 'code_gen':
        return 'Firmware Generation';
      case 'compile':
        return 'Firmware Compilation (arduino-cli)';
      case 'sim_test':
        return 'Simulation Test Assertions (avr8js)';
      case 'case_fit':
        return '3D Case Clearance & Fit Check';
      default:
        return step.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Agent Verification Pipeline
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Autonomous Self-Healing Loop
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real compiler outputs, automated headless simulation assertions, and 3D enclosure clearance verification
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
            {logs.filter((l) => l.status === 'pass').length} / {logs.length} Stages Passed
          </span>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {logs.map((item, idx) => {
          const Icon = getStepIcon(item.step);
          const isPass = item.status === 'pass';
          const isRunning = item.status === 'running';
          const isFail = item.status === 'fail';

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                isPass
                  ? 'border-emerald-200/80 bg-emerald-50/20 shadow-2xs'
                  : isRunning
                  ? 'border-amber-300 ring-2 ring-amber-300/20 shadow-2xs'
                  : isFail
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-zinc-200/70 bg-zinc-50/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-700'
                        : isRunning
                        ? 'bg-amber-100 text-amber-700'
                        : isFail
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    {isPass && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        PASS
                      </span>
                    )}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        RUNNING
                      </span>
                    )}
                    {isFail && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        FAIL
                      </span>
                    )}
                    {!isPass && !isRunning && !isFail && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-zinc-900 tracking-tight">
                  {getStepLabel(item.step)}
                </h4>
              </div>

              <p className="text-[11px] text-zinc-500 mt-2 font-mono leading-relaxed line-clamp-3">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Terminal Output Log */}
      <div className="bg-[#121214] rounded-2xl border border-zinc-800 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-xs text-zinc-400">
              solder-agent-session.log
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>AGENT ONLINE</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 font-mono text-xs space-y-2 max-h-[380px] overflow-y-auto">
          <div className="text-zinc-500">
            [00:00.00] Antigravity Solder Agent Engine initialized
          </div>
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-zinc-600 select-none">
                [00:{String(i * 2 + 1).padStart(2, '0')}.{String((i * 35) % 99).padStart(2, '0')}]
              </span>
              <span
                className={
                  l.status === 'pass'
                    ? 'text-emerald-400'
                    : l.status === 'fail'
                    ? 'text-rose-400'
                    : l.status === 'running'
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }
              >
                [{l.step}]
              </span>
              <span className="text-zinc-300 flex-1 leading-relaxed">
                {l.detail}
              </span>
            </div>
          ))}
          {logs.every((l) => l.status === 'pass') && (
            <div className="pt-2 text-emerald-400 font-semibold">
              [SYSTEM] All hardware & firmware checks verified. Build certified ready for physical prototyping.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
