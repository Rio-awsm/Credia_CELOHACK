import { Request, Response, Router } from 'express';
import { prisma } from '../database/connections';
import { addVerificationJob } from '../queues/verification.queue';
import { ResponseUtil } from '../utils/response.util';

const router = Router();

// Only enable in development
if (process.env.NODE_ENV === 'development') {
  /**
   * POST /api/test/create-submission
   * Create a test submission for testing the queue
   */
  router.post('/create-submission', async (req: Request, res: Response) => {
    try {
      // 1. Get or create test user
      let testUser = await prisma.user.findFirst({
        where: { walletAddress: '0xtest1234567890' },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            walletAddress: '0xtest1234567890',
            role: 'worker',
            reputationScore: 0,
          },
        });
      }

      // 2. Get or create test task
      let testTask = await prisma.task.findFirst({
        where: { title: 'Test Task for Queue' },
      });

      if (!testTask) {
        // Find a requester or create one
        let requester = await prisma.user.findFirst({
          where: { role: 'requester' },
        });

        if (!requester) {
          requester = await prisma.user.create({
            data: {
              walletAddress: '0xrequester123',
              role: 'requester',
            },
          });
        }

        testTask = await prisma.task.create({
          data: {
            requesterId: requester.id,
            title: 'Test Task for Queue',
            description: 'This is a test task',
            taskType: 'text_verification',
            paymentAmount: 5.0,
            verificationCriteria: {
              requiredFields: ['text'],
              aiPrompt: 'Verify if the text makes sense',
            },
            maxSubmissions: 10,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'open',
          },
        });
      }

      // 3. Create test submission
      const submission = await prisma.submission.create({
        data: {
          taskId: testTask.id,
          workerId: testUser.id,
          submissionData: {
            text: req.body.text || 'This is a test submission for the verification queue',
          },
          verificationStatus: 'pending',
        },
      });

      // 4. Add to queue
      await addVerificationJob({
        submissionId: submission.id,
        taskId: testTask.id,
        workerId: testUser.id,
        submissionData: submission.submissionData,
        verificationCriteria: testTask.verificationCriteria,
        taskType: testTask.taskType,
      });

      ResponseUtil.success(res, {
        message: 'Test submission created and added to queue',
        submissionId: submission.id,
        taskId: testTask.id,
      }, 201);
    } catch (error) {
      console.error('Test submission error:', error);
      ResponseUtil.internalError(res, `Failed to create test submission: ${error}`);
    }
  });

  /**
   * GET /api/test/queue-stats
   * Get queue statistics
   */
  router.get('/queue-stats', async (req: Request, res: Response) => {
    try {
      const { getQueueStats } = await import('../queues/verification.queue');
      const stats = await getQueueStats();
      
      ResponseUtil.success(res, stats);
    } catch (error) {
      console.error('Queue stats error:', error);
      ResponseUtil.internalError(res, 'Failed to get queue stats');
    }
  });

  /**
   * POST /api/test/reprocess/:submissionId
   * Re-enqueue an existing approved/failed submission to finalize payment or retry processing
   */
  router.post('/reprocess/:submissionId', async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params;

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { task: true },
      });

      if (!submission) {
        return ResponseUtil.notFound(res, 'Submission');
      }

      await addVerificationJob({
        submissionId: submission.id,
        taskId: submission.taskId,
        workerId: submission.workerId,
        submissionData: submission.submissionData,
        verificationCriteria: submission.task.verificationCriteria,
        taskType: submission.task.taskType,
      });

      return ResponseUtil.success(res, {
        message: 'Submission re-enqueued for processing',
        submissionId: submission.id,
        taskId: submission.taskId,
        status: submission.verificationStatus,
      });
    } catch (error) {
      console.error('Reprocess submission error:', error);
      return ResponseUtil.internalError(res, 'Failed to re-enqueue submission');
    }
  });

  console.log('⚠️  Test routes enabled (development mode only)');
}

export default router;
