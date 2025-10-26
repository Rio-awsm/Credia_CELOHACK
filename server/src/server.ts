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

  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Test routes enabled (development mode only)');
  }
});
