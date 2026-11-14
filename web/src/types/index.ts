import type { CaseSpec, PartLayoutItem, WireConnection } from '../viewer/types';
import type { TestCase } from '../sim/types';

export type { CaseSpec, PartLayoutItem, WireConnection };

export interface PartItem {
  id: string;
  name: string;
  libId: string;
  qty: number;
  priceInr: number;
  why: string;
  owned?: boolean;
}

export interface SolderBuild {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  board: 'uno' | 'esp32';
  parts: PartItem[];
  layout: PartLayoutItem[];
  case: CaseSpec;
  wiring: WireConnection[];
  code: {
    filename: string;
    ino: string;
  };
  tests: TestCase[];
  product: {
    pageHeadline: string;
    bullets: string[];
    priceInr: number;
    boxSvg: string;
  };
  buildSteps: string[];
  hex?: string;
  cadClearanceMm?: number;
}

export interface AgentLogStep {
  id: string;
  step: 'generate' | 'compile' | 'simulate' | 'fitcheck' | 'fix' | 'clearance';
  label: string;
  status: 'pending' | 'success' | 'error';
  detail: string;
  timestamp: number;
}

export interface ScrapPhotoResult {
  ownedParts: Array<{
    libId: string;
    name: string;
    qty: number;
    confidence: number;
    priceInr: number;
  }>;
  totalSavingsInr: number;
  suggestedPrompt: string;
}
