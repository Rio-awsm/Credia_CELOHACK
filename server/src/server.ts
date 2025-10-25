import 'dotenv/config';
import { createApp } from './app';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Celo Task Marketplace API Server                     ║
║                                                           ║
║   📡 Server running on: http://localhost:${PORT}           ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   ⛓️  Network: Celo Sepolia Testnet                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
