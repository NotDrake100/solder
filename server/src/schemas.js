import { z } from 'zod';

export const BuildInputSchema = z.object({
  prompt: z.string({ required_error: 'Prompt is required' }).trim().min(2, 'Prompt must be at least 2 characters').max(2000, 'Prompt too long'),
  ownedParts: z.array(z.string()).optional().default([]),
  stream: z.boolean().optional().default(false),
});

export const PartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  libId: z.string(),
  qty: z.number().int().positive().default(1),
  priceInr: z.number().nonnegative(),
  why: z.string(),
});

export const LayoutItemSchema = z.object({
  id: z.string().optional(),
  libId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  rotZ: z.number().optional().default(0),
  dims: z.array(z.number()).length(3),
  color: z.string().optional(),
  shape: z.enum(['box', 'cylinder']).optional().default('box'),
});

export const CaseDataSchema = z.object({
  outerMm: z.array(z.number()).length(3),
  wallMm: z.number().positive().default(2),
  lidType: z.string().default('snap'),
  clearanceMm: z.number().optional().default(2.0),
  scad: z.string().optional(),
});

export const WiringItemSchema = z.object({
  from: z.object({
    part: z.string(),
    pin: z.string(),
  }),
  to: z.object({
    part: z.string(),
    pin: z.string(),
  }),
  color: z.string().default('#ef4444'),
  signal: z.string().default('VCC'),
});

export const CodeSchema = z.object({
  filename: z.string().default('sketch.ino'),
  ino: z.string(),
});

export const TestCaseSchema = z.object({
  name: z.string(),
  set: z.record(z.any()).optional().default({}),
  expectSerial: z.string().optional(),
});

export const ProductSchema = z.object({
  pageHeadline: z.string(),
  bullets: z.array(z.string()),
  priceInr: z.number().nonnegative(),
  boxSvg: z.string().optional(),
});

export const AgentLogItemSchema = z.object({
  step: z.string(),
  status: z.enum(['pass', 'fail', 'running', 'pending', 'warn']),
  detail: z.string(),
  timestamp: z.string().optional(),
});

export const BuildResultSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  tagline: z.string(),
  summary: z.string(),
  board: z.enum(['uno', 'esp32']),
  parts: z.array(PartItemSchema),
  layout: z.array(LayoutItemSchema),
  case: CaseDataSchema,
  wiring: z.array(WiringItemSchema),
  wiringSvg: z.string().optional(),
  code: CodeSchema,
  tests: z.array(TestCaseSchema).optional().default([]),
  product: ProductSchema,
  buildSteps: z.array(z.string()).optional().default([]),
  agentLog: z.array(AgentLogItemSchema).optional().default([]),
  cached: z.boolean().optional(),
});

// JSON Schema for Gemini structured output
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Product name, e.g. Sip, Wisp, Hasp, Eave' },
    tagline: { type: 'string', description: 'One punchy sentence product tagline' },
    summary: { type: 'string', description: '2-3 sentence technical overview' },
    board: { type: 'string', enum: ['uno', 'esp32'], description: 'Target microcontroller' },
    parts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          libId: { type: 'string' },
          qty: { type: 'number' },
          priceInr: { type: 'number' },
          why: { type: 'string' },
        },
        required: ['id', 'name', 'libId', 'qty', 'priceInr', 'why'],
      },
    },
    layout: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          libId: { type: 'string' },
          name: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
          rotZ: { type: 'number' },
          dims: {
            type: 'array',
            items: { type: 'number' },
            description: '[width, depth, height] in mm',
          },
          color: { type: 'string' },
        },
        required: ['libId', 'name', 'x', 'y', 'z', 'dims'],
      },
    },
    case: {
      type: 'object',
      properties: {
        outerMm: {
          type: 'array',
          items: { type: 'number' },
          description: '[width, depth, height] outer dimensions in mm',
        },
        wallMm: { type: 'number' },
        lidType: { type: 'string' },
        clearanceMm: { type: 'number' },
        scad: { type: 'string', description: 'Parametric OpenSCAD code' },
      },
      required: ['outerMm', 'wallMm', 'lidType'],
    },
    wiring: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: {
            type: 'object',
            properties: {
              part: { type: 'string' },
              pin: { type: 'string' },
            },
            required: ['part', 'pin'],
          },
          to: {
            type: 'object',
            properties: {
              part: { type: 'string' },
              pin: { type: 'string' },
            },
            required: ['part', 'pin'],
          },
          color: { type: 'string' },
          signal: { type: 'string' },
        },
        required: ['from', 'to', 'color', 'signal'],
      },
    },
    wiringSvg: { type: 'string', description: 'Clean SVG diagram of the wiring' },
    code: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        ino: { type: 'string', description: 'Full Arduino C++ code with setup() and loop()' },
      },
      required: ['filename', 'ino'],
    },
    tests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          set: { type: 'object' },
          expectSerial: { type: 'string' },
        },
        required: ['name', 'expectSerial'],
      },
    },
    product: {
      type: 'object',
      properties: {
        pageHeadline: { type: 'string' },
        bullets: {
          type: 'array',
          items: { type: 'string' },
        },
        priceInr: { type: 'number' },
        boxSvg: { type: 'string', description: 'SVG artwork for the retail box' },
      },
      required: ['pageHeadline', 'bullets', 'priceInr'],
    },
    buildSteps: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['name', 'tagline', 'summary', 'board', 'parts', 'layout', 'case', 'wiring', 'code', 'tests', 'product', 'buildSteps'],
};
