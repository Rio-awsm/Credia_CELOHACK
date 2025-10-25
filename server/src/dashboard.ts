import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import { verificationQueue } from './queues/verification.queue';

/**
 * Create Bull Board dashboard
 */
export function createQueueDashboard(): express.Router {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(verificationQueue)],
    serverAdapter: serverAdapter,
  });

  console.log('📊 Bull Board dashboard available at: /admin/queues');

  return serverAdapter.getRouter();
}
