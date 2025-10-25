import { prisma } from '../database/connections';
import { VerificationStatus } from '../types/database.types';
import { ModerationAction } from '../types/moderation.types';
import { aiVerificationService } from './ai-verification.service';
import { blockchainService } from './blockchain.service';
import { contentModerationService } from './content-moderation.service';

export class VerificationWorkerService {
  /**
   * Process submission verification asynchronously
   */
  static async processSubmission(submissionId: string): Promise<void> {
    try {
      console.log(`\n🔄 Processing submission ${submissionId}...`);

      // Get submission with task details
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          task: true,
          worker: true,
        },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Step 1: Content moderation
      console.log('🛡️  Running content moderation...');
      const moderationResult = await contentModerationService.moderateSubmission({
        content: JSON.stringify(submission.submissionData),
        context: {
          taskType: submission.task.taskType,
          userId: submission.workerId,
        },
        submissionId,
      });

      // Auto-reject if flagged as critical
      if (moderationResult.action === ModerationAction.AUTO_REJECT) {
        console.log('🚫 Submission auto-rejected by moderation');
        
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            verificationStatus: VerificationStatus.REJECTED,
            aiVerificationResult: JSON.parse(JSON.stringify({
              moderation: moderationResult,
              rejected: true,
              reason: 'Content moderation failed',
            })) as any,  // ← FIX: Cast to any after JSON conversion
          },
        });

        // TODO: Notify worker
        return;
      }

      // Step 2: AI verification (if moderation passed)
      console.log('🤖 Running AI verification...');
      const verificationResult = await aiVerificationService.verifyTextTask({
        submissionText: JSON.stringify(submission.submissionData),
        verificationCriteria: JSON.stringify(submission.task.verificationCriteria),
        taskType: submission.task.taskType,
      });

      // Update submission with verification result
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          aiVerificationResult: JSON.parse(JSON.stringify({
            moderation: moderationResult,
            verification: verificationResult,
          })) as any,  // ← FIX: Cast to any after JSON conversion
          verificationStatus: verificationResult.approved
            ? VerificationStatus.APPROVED
            : VerificationStatus.REJECTED,
        },
      });

      // Step 3: If approved, release payment via smart contract
      if (verificationResult.approved) {
        console.log('✅ Submission approved! Releasing payment...');
        
        // Check if contractTaskId exists
        if (!submission.task.contractTaskId) {
          throw new Error('Contract task ID not found');
        }

        const txHash = await blockchainService.approveSubmission(
          submission.task.contractTaskId  // ← FIX: Now this field exists
        );

        // Update payment record
        await prisma.payment.create({
          data: {
            taskId: submission.taskId,
            workerId: submission.workerId,
            amount: submission.task.paymentAmount,
            transactionHash: txHash,
            status: 'completed',
          },
        });

        // Update task status
        await prisma.task.update({
          where: { id: submission.taskId },
          data: { status: 'completed' },
        });

        // Update worker earnings and task count
        await prisma.user.update({
          where: { id: submission.workerId },
          data: {
            totalEarnings: {
              increment: submission.task.paymentAmount,
            },
            totalTasksCompleted: {  // ← FIX: Now this field exists
              increment: 1,
            },
          },
        });

        console.log(`💰 Payment released! Tx: ${txHash}`);
      } else {
        console.log('❌ Submission rejected by AI verification');
      }

      console.log(`✅ Verification complete for submission ${submissionId}`);
    } catch (error) {
      console.error(`❌ Verification failed for submission ${submissionId}:`, error);
      
      // Mark as pending for manual review
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          verificationStatus: VerificationStatus.PENDING,
          aiVerificationResult: JSON.parse(JSON.stringify({
            error: String(error),
            timestamp: new Date().toISOString(),
          })) as any,  // ← FIX: Cast to any after JSON conversion
        },
      });
    }
  }
}
