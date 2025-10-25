import Queue, { Job } from 'bull';
import { queueOptions } from '../config/redis.config';

// Job data interface
export interface VerificationJobData {
  submissionId: string;
  taskId: string;
  workerId: string;
  submissionData: any;
  verificationCriteria: any;
  taskType: string;
}

// Create verification queue
export const verificationQueue = new Queue<VerificationJobData>(
  'verification-queue',
  queueOptions
);

// Queue event listeners
verificationQueue.on('waiting', (jobId) => {
  console.log(`🕐 Job ${jobId} is waiting...`);
});

verificationQueue.on('active', (job: Job<VerificationJobData>) => {
  console.log(`🔄 Job ${job.id} started processing...`);
});

verificationQueue.on('completed', (job: Job<VerificationJobData>, result: any) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

verificationQueue.on('failed', (job: Job<VerificationJobData>, err: Error) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

verificationQueue.on('error', (error: Error) => {
  console.error('❌ Queue error:', error);
});

verificationQueue.on('stalled', (job: Job<VerificationJobData>) => {
  console.warn(`⚠️  Job ${job.id} stalled`);
});

/**
 * Add verification job to queue
 */
export async function addVerificationJob(data: VerificationJobData): Promise<Job<VerificationJobData>> {
  console.log(`\n➕ Adding verification job for submission ${data.submissionId}`);
  
  const job = await verificationQueue.add('verify-submission', data, {
    jobId: `verify-${data.submissionId}`, // Unique job ID
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    timeout: 30000,
  });

  console.log(`✅ Job added to queue: ${job.id}`);
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    verificationQueue.getWaitingCount(),
    verificationQueue.getActiveCount(),
    verificationQueue.getCompletedCount(),
    verificationQueue.getFailedCount(),
    verificationQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

export default verificationQueue;
