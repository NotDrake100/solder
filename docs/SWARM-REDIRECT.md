CHANGE OF PLAN (Archit, 9:38 PM IST). Teammate Joel owns the main app on branch joel-swarm (web/, web/src/viewer, server build API, showcase). Stop all work on those.
Our swarm now owns ONLY:
1. SIM: a self-contained folder sim/ : Express route module + browser component that compiles an Arduino sketch (arduino-cli, fqbn arduino:avr:uno) to .hex and runs it in the browser with avr8js, with virtual sensor sliders (soil %, temperature, button), LED/pump outputs and a serial log. Expose it as POST /api/compile plus a React component <Simulator hex=... /> that the main app can import. Include a working Sip sketch test (pump turns on below 30% soil).
2. DEPLOY: deploy/ folder with a Dockerfile and instructions to publish the app to a public HTTPS link. No secrets in files; GEMINI_API_KEY comes from env.
Work only in sim/ and deploy/. Do not edit other folders. Commit small, on branch antigravity-build.
