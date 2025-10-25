import { Job } from "bull";
import { prisma } from "../database/connections";
import {
  VerificationJobData,
  verificationQueue,
} from "../queues/verification.queue";
import { aiVerificationService } from "../services/ai-verification.service";
import { blockchainService } from "../services/blockchain.service";
import { contentModerationService } from "../services/content-moderation.service";
import {
  notificationService,
  NotificationType,
} from "../services/notification.service";
import { VerificationStatus } from "../types/database.types";
import { ModerationAction } from "../types/moderation.types";
import { queueLogger } from "../utils/queue-logger";

/**
 * Process verification job
 */
async function processVerification(
  job: Job<VerificationJobData>
): Promise<any> {
  const startTime = Date.now();
  const {
    submissionId,
    taskId,
    workerId,
    submissionData,
    verificationCriteria,
    taskType,
  } = job.data;

  queueLogger.logJobStart(job.id as string, job.data);

  try {
    console.log(`\n🔍 Processing verification job ${job.id}`);
    console.log(`Submission: ${submissionId}`);
    console.log(`Attempt: ${job.attemptsMade + 1} / ${job.opts.attempts}`);

    // Get full submission and task details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        task: true,
        worker: true,
      },
    });

    if (!submission) {
      const error = new Error(`Submission ${submissionId} not found`);
      (error as any).permanent = true; // Mark as permanent error
      throw error;
    }

    // Check if already processed
    if (submission.verificationStatus !== VerificationStatus.PENDING) {
      console.log(
        `⚠️  Submission ${submissionId} already processed with status: ${submission.verificationStatus}`
      );
      return {
        success: true,
        alreadyProcessed: true,
        status: submission.verificationStatus,
      };
    }

    // Step 1: Content Moderation
    console.log("🛡️  Step 1: Running content moderation...");
    const moderationResult = await contentModerationService.moderateSubmission({
      content: JSON.stringify(submissionData),
      context: {
        taskType,
        userId: workerId,
      },
      submissionId,
    });

    // Auto-reject if flagged by moderation
    if (moderationResult.action === ModerationAction.AUTO_REJECT) {
      console.log("🚫 Auto-rejected by content moderation");

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          aiVerificationResult: JSON.parse(
            JSON.stringify({
              moderation: moderationResult,
              rejected: true,
              reason: "Content moderation failed",
              timestamp: new Date().toISOString(),
            })
          ),
        },
      });

      // Notify worker
      await notificationService.send(workerId, {
        type: NotificationType.SUBMISSION_REJECTED,
        taskId,
        submissionId,
        result: moderationResult,
      });

      const duration = Date.now() - startTime;
      queueLogger.logJobComplete(job.id as string, duration, {
        approved: false,
        reason: "moderation",
      });

      return {
        success: true,
        approved: false,
        reason: "Content moderation failed",
      };
    }

    // Step 2: AI Verification
    console.log("🤖 Step 2: Running AI verification...");
    const verificationResult = await aiVerificationService.verifyTextTask({
      submissionText: JSON.stringify(submissionData),
      verificationCriteria: JSON.stringify(verificationCriteria),
      taskType,
    });

    // Step 3: Combine results
    const finalApproval =
      verificationResult.approved && !moderationResult.flagged;

    console.log(
      `📊 Verification result: ${finalApproval ? "APPROVED" : "REJECTED"}`
    );

    // Step 4: Update database
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verificationStatus: finalApproval
          ? VerificationStatus.APPROVED
          : VerificationStatus.REJECTED,
        aiVerificationResult: JSON.parse(
          JSON.stringify({
            verification: verificationResult,
            moderation: moderationResult,
            finalApproval,
            timestamp: new Date().toISOString(),
          })
        ),
      },
    });

    // Step 5: Call smart contract if approved
    if (finalApproval) {
      console.log("⛓️  Step 5: Calling smart contract to release payment...");

      if (!submission.task.contractTaskId) {
        throw new Error("Contract task ID not found");
      }

      const txHash = await blockchainService.approveSubmission(
        submission.task.contractTaskId
      );

      console.log(`✅ Payment transaction: ${txHash}`);

      // Create payment record
      await prisma.payment.create({
        data: {
          taskId,
          workerId,
          amount: submission.task.paymentAmount,
          transactionHash: txHash,
          status: "completed",
        },
      });

      // Update submission with transaction hash
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          paymentTransactionHash: txHash,
        },
      });

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "completed" },
      });

      // Update worker stats
      await prisma.user.update({
        where: { id: workerId },
        data: {
          totalEarnings: {
            increment: submission.task.paymentAmount,
          },
          totalTasksCompleted: {
            increment: 1,
          },
        },
      });

      // Notify worker about approval and payment
      await notificationService.send(workerId, {
        type: NotificationType.PAYMENT_RELEASED,
        taskId,
        submissionId,
        amount: Number(submission.task.paymentAmount),
        txHash,
        result: verificationResult,
      });
    } else {
      // Notify worker about rejection
      await notificationService.send(workerId, {
        type: NotificationType.SUBMISSION_REJECTED,
        taskId,
        submissionId,
        result: verificationResult,
      });
    }

    const duration = Date.now() - startTime;
    queueLogger.logJobComplete(job.id as string, duration, {
      approved: finalApproval,
      score: verificationResult.score,
    });

    return {
      success: true,
      approved: finalApproval,
      verificationResult,
      moderationResult,
      txHash: finalApproval ? submission.paymentTransactionHash : null,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    queueLogger.logJobFailed(job.id as string, error, job.attemptsMade + 1);

    // Check if it's a permanent error (don't retry)
    if (error.permanent) {
      console.error(`❌ Permanent error for job ${job.id}: ${error.message}`);
      // Don't throw - let the job complete as failed without retry
      return {
        success: false,
        error: error.message,
        permanent: true,
      };
    }

    // On final failure, mark as pending for manual review
    if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
      console.error(`❌ Job ${job.id} failed after all retries`);

      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            verificationStatus: VerificationStatus.PENDING,
            aiVerificationResult: JSON.parse(
              JSON.stringify({
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                needsManualReview: true,
              })
            ),
          },
        });
      } catch (dbError) {
        console.error("Failed to update submission after error:", dbError);
      }
    }

    throw error; // Re-throw to trigger Bull retry
  }
}

/**
 * Start worker
 */
export function startVerificationWorker(): void {
  console.log("\n🚀 Starting verification worker...");

  // Process jobs with concurrency of 5
  verificationQueue.process("verify-submission", 5, processVerification);

  console.log("✅ Verification worker started");
  console.log("📊 Concurrency: 5 jobs at a time");
  console.log("🔄 Retry: 3 attempts with exponential backoff");
  console.log("⏱️  Timeout: 30 seconds per job\n");
}

/**
 * Graceful shutdown
 */
export async function stopVerificationWorker(): Promise<void> {
  console.log("\n⏹️  Stopping verification worker...");
  await verificationQueue.close();
  console.log("✅ Worker stopped");
}
