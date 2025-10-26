"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopVerificationWorker = exports.startVerificationWorker = void 0;
const verification_worker_1 = require("./verification.worker");
Object.defineProperty(exports, "startVerificationWorker", { enumerable: true, get: function () { return verification_worker_1.startVerificationWorker; } });
Object.defineProperty(exports, "stopVerificationWorker", { enumerable: true, get: function () { return verification_worker_1.stopVerificationWorker; } });
// Start worker on import
(0, verification_worker_1.startVerificationWorker)();
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await (0, verification_worker_1.stopVerificationWorker)();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received');
    await (0, verification_worker_1.stopVerificationWorker)();
    process.exit(0);
});
