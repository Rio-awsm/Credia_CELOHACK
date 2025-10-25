import { startVerificationWorker, stopVerificationWorker } from './verification.worker';

// Start worker on import
startVerificationWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received');
  await stopVerificationWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received');
  await stopVerificationWorker();
  process.exit(0);
});

export { startVerificationWorker, stopVerificationWorker };

