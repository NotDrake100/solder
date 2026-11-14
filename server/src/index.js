import { createApp } from './app.js';
import { PORT } from './config.js';

const app = createApp();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Solder server listening on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Showcase: http://localhost:${PORT}/api/showcase/sip`);
  console.log(`   Build API: http://localhost:${PORT}/api/build`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
