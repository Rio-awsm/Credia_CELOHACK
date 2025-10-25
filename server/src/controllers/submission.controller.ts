import { Response } from "express";
import { prisma } from "../database/connections";
import { addVerificationJob } from "../queues/verification.queue";
import {
  AuthenticatedRequest,
  CreateSubmissionDto,
  VerificationWebhookDto,
} from "../types/api.types";
import { TaskStatus, VerificationStatus } from "../types/database.types";
import { ResponseUtil } from "../utils/response.util";

export class SubmissionController {
  /**
   * POST /api/submissions/submit
   * Submit a task
   */
  static async submitTask(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const submissionData: CreateSubmissionDto = req.body;
      const workerId = req.user!.userId!;

      console.log(
        `\n📤 Worker ${workerId} submitting task ${submissionData.taskId}`
      );

      // Step 1: Get task details
      const task = await prisma.task.findUnique({
        where: { id: submissionData.taskId },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      if (!task) {
        ResponseUtil.notFound(res, "Task");
        return;
      }

      // Step 2: Validate task is still open
      if (task.status !== TaskStatus.OPEN) {
        ResponseUtil.error(
          res,
          "Task is not open for submissions",
          "TASK_NOT_OPEN",
          400
        );
        return;
      }

      // Step 3: Check if task expired
      if (task.expiresAt < new Date()) {
        ResponseUtil.error(res, "Task has expired", "TASK_EXPIRED", 400);
        return;
      }

      // Step 4: Check if max submissions reached
      if (task._count.submissions >= task.maxSubmissions) {
        ResponseUtil.error(
          res,
          "Task has reached maximum submissions",
          "MAX_SUBMISSIONS_REACHED",
          400
        );
        return;
      }

      // Step 5: Check if worker already submitted
      const existingSubmission = await prisma.submission.findUnique({
        where: {
          taskId_workerId: {
            taskId: submissionData.taskId,
            workerId: workerId,
          },
        },
      });

      if (existingSubmission) {
        ResponseUtil.error(
          res,
          "You have already submitted for this task",
          "DUPLICATE_SUBMISSION",
          400
        );
        return;
      }

      // Step 6: Check if worker is not the requester
      if (task.requesterId === workerId) {
        ResponseUtil.error(
          res,
          "You cannot submit to your own task",
          "SELF_SUBMISSION",
          400
        );
        return;
      }

      // Step 7: Create submission
      const submission = await prisma.submission.create({
        data: {
          taskId: submissionData.taskId,
          workerId: workerId,
          submissionData: submissionData.submissionData,
          verificationStatus: VerificationStatus.PENDING,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              paymentAmount: true,
            },
          },
        },
      });

      // Update task status to in_progress
      if (task.status === TaskStatus.OPEN) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: TaskStatus.IN_PROGRESS },
        });
      }

      console.log(`✅ Submission created: ${submission.id}`);

      // Step 8: Trigger async verification
      try {
        await addVerificationJob({
          submissionId: submission.id,
          taskId: submissionData.taskId,
          workerId: workerId,
          submissionData: submissionData.submissionData,
          verificationCriteria: task.verificationCriteria,
          taskType: task.taskType,
        });

        console.log(`✅ Submission added to verification queue`);
      } catch (queueError) {
        console.error("Failed to add job to queue:", queueError);
      }

      ResponseUtil.success(
        res,
        {
          submissionId: submission.id,
          status: "pending",
          message: "Submission received. AI verification in progress.",
          estimatedTime: "1-2 minutes",
        },
        201
      );
    } catch (error) {
      console.error("Submit task error:", error);
      ResponseUtil.internalError(res, "Failed to submit task");
    }
  }

  /**
   * POST /api/submissions/verify-webhook
   * Internal webhook for verification results (called by worker)
   */
  static async verifyWebhook(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const webhookData: VerificationWebhookDto = req.body;

      console.log(
        `\n🔔 Verification webhook for submission ${webhookData.submissionId}`
      );

      // Verify webhook secret (add to headers in production)
      const webhookSecret = req.headers["x-webhook-secret"];
      if (webhookSecret !== process.env.WEBHOOK_SECRET) {
        ResponseUtil.unauthorized(res, "Invalid webhook secret");
        return;
      }

      const submission = await prisma.submission.findUnique({
        where: { id: webhookData.submissionId },
        include: {
          task: true,
        },
      });

      if (!submission) {
        ResponseUtil.notFound(res, "Submission");
        return;
      }

      // Update submission with verification result
      await prisma.submission.update({
        where: { id: webhookData.submissionId },
        data: {
          aiVerificationResult: webhookData.verificationResult,
          verificationStatus: webhookData.verificationResult.approved
            ? VerificationStatus.APPROVED
            : VerificationStatus.REJECTED,
        },
      });

      ResponseUtil.success(res, { message: "Verification result processed" });
    } catch (error) {
      console.error("Verify webhook error:", error);
      ResponseUtil.internalError(res, "Failed to process verification");
    }
  }

  /**
   * GET /api/submissions/:submissionId/status
   * Get submission status
   */
  static async getSubmissionStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { submissionId } = req.params;
      const userId = req.user!.userId!;

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              paymentAmount: true,
              requesterId: true,
            },
          },
          worker: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      });

      if (!submission) {
        ResponseUtil.notFound(res, "Submission");
        return;
      }

      // Check if user has access to this submission
      const isOwner =
        submission.workerId === userId ||
        submission.task.requesterId === userId;
      if (!isOwner) {
        ResponseUtil.forbidden(
          res,
          "You do not have access to this submission"
        );
        return;
      }

      // Get payment info if exists
      const payment = await prisma.payment.findFirst({
        where: {
          taskId: submission.taskId,
          workerId: submission.workerId,
        },
      });

      ResponseUtil.success(res, {
        submission: {
          id: submission.id,
          status: submission.verificationStatus,
          submittedAt: submission.createdAt,
          verificationResult: submission.aiVerificationResult,
        },
        task: submission.task,
        payment: payment || null,
      });
    } catch (error) {
      console.error("Get submission status error:", error);
      ResponseUtil.internalError(res, "Failed to fetch submission status");
    }
  }

  /**
   * GET /api/submissions/my-submissions
   * Get submissions by authenticated worker
   */
  static async getMySubmissions(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const workerId = req.user!.userId!;

      const submissions = await prisma.submission.findMany({
        where: { workerId },
        orderBy: { createdAt: "desc" },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              paymentAmount: true,
              taskType: true,
            },
          },
        },
      });

      // Get payment info for each
      const submissionsWithPayments = await Promise.all(
        submissions.map(async (submission) => {
          const payment = await prisma.payment.findFirst({
            where: {
              taskId: submission.taskId,
              workerId: submission.workerId,
            },
          });

          return {
            ...submission,
            payment: payment || null,
          };
        })
      );

      ResponseUtil.success(res, submissionsWithPayments);
    } catch (error) {
      console.error("Get my submissions error:", error);
      ResponseUtil.internalError(res, "Failed to fetch submissions");
    }
  }
}
