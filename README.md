# Solder — Type an Idea. Get a Build.

> **Berkeley x DeepMind Hackathon — Antigravity CLI Track**  
> *"Type an idea. Get a build."*  
> An autonomous AI hardware engineer that turns natural language into production-ready physical devices with real running firmware, precision 3D-printable enclosures, Fritzing-style wiring, and component sourcing in Indian Rupees (₹).

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%203.8%20Flash%20%7C%203.5%20Flash--Lite%20%7C%204%20Hydrogen-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Antigravity CLI](https://img.shields.io/badge/Orchestrated%20with-Antigravity%20CLI%20%2Fswarm-8E24AA?style=flat-square)](https://antigravity.google)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## ⚡ The Problem & The Gap

Existing AI hardware tools either focus exclusively on enterprise PCB layout (like Flux), generative CAD without electronics (like Zoo/CADAM), or isolated code snippets without physical constraints.

**Nobody bridges the full gap:**
$$\text{Idea} \longrightarrow \text{Firmware that compiles \& simulates} \longrightarrow \text{Case that fits} \longrightarrow \text{Kit you can buy in INR}$$

**Solder solves this in one unified screen.**

---

## 🌟 5 Standout Features

### 1. Real Code, Really Running in the Browser
The server validates and compiles Arduino C++ sketches for Uno / ESP32 targets. In the browser, **avr8js** (open-source AVR CPU emulation) executes the compiled binary in real-time. Interactive sensor sliders (soil moisture %, temperature, VOC gas ppm, ultrasonic distance) feed virtual ADC/GPIO inputs directly into the virtual CPU with live serial telemetry and actuator reaction (relay, LED, buzzer, servo).

### 2. Scrap Mode / Photo-to-Build
Snap or upload a photo of your workbench or parts drawer. **Gemini Vision** identifies components you already own (e.g. Arduino Uno, 5V relay, soil probe), deducts them from the bill of materials, and reports exact savings: *"You already own 3 of 5 parts — you save ₹620!"*

### 3. Algorithmic Fit Check & Procedural OpenSCAD Enclosures
All parts are bound to real physical dimensions (Uno: 53.4 × 68.6 × 15 mm, mounting holes, pin headers). Solder algorithmically checks clearances against a 3D enclosure, enforcing $\ge 2.0\text{ mm}$ wall clearance. A parametric **OpenSCAD** script is synthesized with mounting standoffs, USB cutouts, and snap-fit lids.

### 4. Self-Healing Live Agent Loop (SSE)
Judges watch the agent in real time over Server-Sent Events (SSE):
$$\text{Compile} \longrightarrow \text{Virtual Simulation Assertions} \longrightarrow \text{Catch Bug} \longrightarrow \text{Auto-Patch} \longrightarrow \text{Fit Check} \longrightarrow \text{Ready}$$
Compiler warnings or failed test assertions trigger self-healing firmware patches before presenting the finalized build to the user.

### 5. Signature "Burst Reveal" 3D Case Viewer
Built with **Three.js**, the 3D viewer renders the procedural enclosure (frosted acrylic / matte PLA) and all internal modules. On load, parts start scattered in space, glide into an exploded layout, and smoothly snap together into the assembled chassis as the camera dollies back.

---

## 🤖 Gemini Multi-Tier AI Architecture

Solder leverages Google's frontier Gemini model family, routing tasks to the optimal model based on reasoning depth, token economics, and latency:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER PROMPT / IDEA                              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  gemini-3.8-flash (Primary Generation & Vision)                        │
│  • Structured JSON output via responseSchema                           │
│  • Generates parts list, layout coordinates, OpenSCAD, wiring,         │
│    Arduino C++ code, assert test cases, product copy, and SVG box art   │
│  • Multimodal vision analyzes parts drawer photos in Scrap Mode        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
                        AUTOMATED VERIFICATION
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
        [Firmware Compile]                    [Simulation Test Fail]
               │                                       │
               └───────────────────┬───────────────────┘
                                   │
                   Does it pass all assertions?
                                   ├──► YES: Proceed to Fit Check & Viewer
                                   │
                                   ▼ NO (Self-Healing Loop)
┌────────────────────────────────────────────────────────────────────────┐
│  gemini-3.5-flash-lite (Fast Self-Healing Patch)                       │
│  • High-frequency iterative debugger (500 RPD tier)                    │
│  • Diagnoses compiler errors & assertion mismatches                    │
│  • Produces minimal targeted code patches in < 800ms                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      Failed 2 consecutive times?
                                   ├──► NO: Re-test with Flash-Lite
                                   │
                                   ▼ YES (Escalated Reasoning)
┌────────────────────────────────────────────────────────────────────────┐
│  gemini-4-hydrogen (Frontier Deep Reasoning)                           │
│  • Activated ONLY when low-latency patches fail                        │
│  • Full architectural analysis of pin conflicts, timing constraints,   │
│    and memory allocation                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🐜 Built with Antigravity CLI `/swarm`

This repository was planned, partitioned, and built from scratch using the **Antigravity CLI** (`agy`) multi-agent `/swarm` preview:

| Swarm Worker | Ownership Scope | Deliverables & Responsibilities |
|---|---|---|
| **@coordinator** | Orchestration & Protocol | Swarm brief allocation, shared board synchronization, task milestone tracking. |
| **@frontend** | `web/` | Vite + React + Tailwind CSS client, "b4 white" minimalist aesthetic, chat hero, tabs (Parts, Case, Wiring, Code), live Agent log, Scrap mode drawer scanner, Order/Ship/AR modals. |
| **@viewer** | `web/src/viewer/` | Three.js 3D viewer component (`CaseViewer.tsx`), procedural materials (frosted acrylic, PLA), burst reveal animation, exploded/assembled view toggle. |
| **@hardware** | `parts-lib/`, `server/hw/`, `web/src/sim/` | Verified physical component definitions (mm + ₹), `arduino-cli` & fallback compiler, OpenSCAD engine, algorithmic clearance checking, avr8js virtual CPU simulator with interactive sliders. |
| **@backend** | `server/`, `showcase/`, root `README.md` | Express/Node REST & SSE server, Gemini API orchestration (3.8 Flash, 3.5 Flash-Lite, 4 Hydrogen), SHA-256 prompt caching, rate limiter, precomputed showcases, fallback generators. |
| **@verifier** | Test & Quality Assurance | End-to-end integration tests, build integrity, bundle checks, currency verification. |

Swarm logs, message history, and verification transcripts are preserved in `docs/agy-logs/`.

---

## 📦 Showcase Builds (Instant & Zero API Cost)

Solder includes 4 complete, pre-computed reference builds in `showcase/` that load instantly with zero API consumption:

| Project | Target | Sensors & Actuators | Retail Kit | Enclosure Style |
|---|---|---|---|---|
| **Sip** | Arduino Uno | Capacitive soil probe, 5V relay, 0.96" OLED, 18650 supply | ₹1,290 | Frosted green acrylic, snap-fit, side probe gland |
| **Wisp** | ESP32 | MQ-135 VOC gas sensor, DHT11 temp/humidity, OLED, piezo buzzer | ₹1,490 | Translucent blue resin, honeycomb air vents |
| **Hasp** | Arduino Uno | SG90 micro-servo latch, piezo sounder, 0.96" OLED, biometric trigger | ₹1,390 | 2.5mm reinforced matte black ABS, concealed hinges |
| **Eave** | ESP32 | HC-SR04 ultrasonic sonar, DHT11, 0.96" OLED, solar battery buffer | ₹1,540 | Weather-baffled downward louvers, solar gland |

---

## 🔌 API Contract Reference

The backend operates on port `3001` (or `process.env.PORT`):

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status, active Gemini models, rate limit window, API key status |
| `GET` | `/api/showcase` | Returns summaries of the 4 flagship reference projects |
| `GET` | `/api/showcase/:id` | Full build specification for `sip`, `wisp`, `hasp`, or `eave` |
| `POST` | `/api/build` | Generates a full build from prompt + chips. Uses cache & rate limiter |
| `GET` | `/api/build/:id` | Retrieves an existing build by unique ID |
| `GET` | `/api/build/:id/stream` | Server-Sent Events (SSE) live streaming of the Solder Agent execution loop |
| `POST` | `/api/fix` | Self-healing fix endpoint (routes to Flash-Lite or Hydrogen) |
| `POST` | `/api/photo` | Scrap Mode: identifies parts from base64 image and computes INR savings |
| `POST` | `/api/compile` | Compiles sketch via `arduino-cli` or built-in validator, returning Intel HEX |
| `POST` | `/api/fitcheck` | Evaluates 3D layout clearances against enclosure dimensions |

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- Node.js $\ge 20.0$ (Node 24 recommended)
- npm $\ge 10.0$
- Optional: `arduino-cli` with `arduino:avr` core (for local native C++ compilation)
- Optional: `openscad` CLI (for local STL mesh compilation)

### 1. Clone the Repository
```bash
git clone https://github.com/NotDrake100/solder.git
cd solder
```

### 2. Configure Environment (Optional for Live Gemini API)
```bash
# Solder includes a smart offline generator for zero-cost operation.
# To enable live frontier Gemini models, export your API key:
export GEMINI_API_KEY="your-google-ai-studio-api-key"
```
> **Security Note:** Keys are read exclusively from `process.env.GEMINI_API_KEY`. Keys are never committed or exposed to the client.

### 3. Launch the Backend
```bash
cd server
npm start
# Server starts at http://localhost:3001
```

Run backend unit & integration tests:
```bash
cd server
npm test
```

### 4. Launch the Frontend
```bash
cd web
npm install
npm run dev
# Vite dev server starts at http://localhost:5173
```

---

## 🏛️ Directory Structure

```
solder/
├── docs/                      # Build plan, hackathon submission, swarm session transcripts
│   ├── solder-build-plan.md   # Master hackathon architecture document
│   └── agy-logs/              # Antigravity CLI swarm logs
├── parts-lib/                 # Parametric electronics component library
│   ├── parts.json             # Aggregated parts catalog with dimensions & INR prices
│   ├── arduino_uno.json       # Physical specs, pinouts, and mounting holes
│   ├── esp32_devkit.json      # Dual-core microcontroller definition
│   └── ...                    # Sensors, displays, actuators, power
├── server/                    # Node.js backend API
│   ├── server.js              # HTTP server with zero external runtime dependencies
│   ├── routes/                # Endpoint handlers (build, showcase, fix, photo, hw)
│   ├── services/              # Gemini orchestration, cache, rate limiter, agent loop
│   ├── hw/                    # Compiler, OpenSCAD, and fit check engine
│   └── test/                  # Automated integration tests
├── showcase/                  # Precomputed reference hardware kits
│   ├── sip.json               # Autonomous plant waterer
│   ├── wisp.json              # VOC & humidity monitor
│   ├── hasp.json              # Biometric servo lockbox
│   └── eave.json              # Solar micro-weather station
└── web/                       # Vite + React + Tailwind frontend
    ├── src/
    │   ├── components/        # Chat input, tabs, agent log, scrap mode modal
    │   ├── viewer/            # Three.js 3D enclosure viewer & burst animation
    │   └── sim/               # avr8js virtual CPU & interactive sensor sliders
    └── package.json
```

---

## 👥 Hackathon Team & Acknowledgements

- **Archit** — Concept, hardware design, product vision, demo presentation.
- **Antigravity CLI Swarm Team** — Parallel autonomous engineering agents:
  - Coordinator, Frontend, Viewer, Hardware, Backend, Verifier.
- Built for the **Berkeley x DeepMind Hackathon (November 2026)**.
- Special thanks to the Google Antigravity & DeepMind teams for the frontier Gemini models and the `/swarm` multi-agent framework.
