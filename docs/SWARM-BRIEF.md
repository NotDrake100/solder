Build "Solder" (Type an idea. Get a build.). Full spec: docs/SPEC.md, read section 12 first, it overrides the rest. Design references: docs/refs/*.png (b4/b6 white style).
Workers, each only in its own folder, post API contracts on the board before coding:
1. FRONTEND: Vite+React+Tailwind app in web/: idea input, showcase cards (Sip, Wisp, Hasp, Eave), tabs for Parts (INR prices), Case 3D, Wiring, Code, Agent log.
2. VIEWER: three.js viewer in web/src/viewer: parts as separate meshes from layout JSON, assembled/exploded toggle, burst reveal animation.
3. BACKEND: Express in server/: POST /api/build using @google/genai with model gemini-3.8-flash and a JSON response schema (see SPEC section 5), zod validation, prompt-hash cache, rate limit, SSE agent log, GET /api/showcase/:id. Read the key only from process.env.GEMINI_API_KEY. Never write any key to a file. Also serves web/dist.
4. HARDWARE: parts-lib/*.json with real dimensions, showcase/*.json for the 4 products, wiring SVG data.
5. VERIFIER: npm install + build, run the server, open Sip in /browser, report bugs on the board.
Commit to the current branch antigravity-build in small commits. Goal: Sip works end to end by 11:00 PM IST.
