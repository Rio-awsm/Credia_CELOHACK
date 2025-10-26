"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionController = void 0;
const connections_1 = require("../database/connections");
const verification_queue_1 = require("../queues/verification.queue");
const database_types_1 = require("../types/database.types");
const response_util_1 = require("../utils/response.util");
class SubmissionController {
    /**
     * POST /api/submissions/submit
     * Submit a task
     */
    static async submitTask(req, res) {
        try {
            const submissionData = req.body;
            const workerId = req.user.userId;
            console.log(`\n📤 Worker ${workerId} submitting task ${submissionData.taskId}`);
            // Step 1: Get task details
            const task = await connections_1.prisma.task.findUnique({
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
                response_util_1.ResponseUtil.notFound(res, "Task");
                return;
            }
            // Step 2: Validate task is still open
            if (task.status !== database_types_1.TaskStatus.OPEN) {
                response_util_1.ResponseUtil.error(res, "Task is not open for submissions", "TASK_NOT_OPEN", 400);
                return;
            }
            // Step 3: Check if task expired
            if (task.expiresAt < new Date()) {
                response_util_1.ResponseUtil.error(res, "Task has expired", "TASK_EXPIRED", 400);
                return;
            }
            // Step 4: Check if max submissions reached
            if (task._count.submissions >= task.maxSubmissions) {
                response_util_1.ResponseUtil.error(res, "Task has reached maximum submissions", "MAX_SUBMISSIONS_REACHED", 400);
                return;
            }
            // Step 5: Check if worker already submitted
            const existingSubmission = await connections_1.prisma.submission.findUnique({
                where: {
                    taskId_workerId: {
                        taskId: submissionData.taskId,
                        workerId: workerId,
                    },
                },
            });
            if (existingSubmission) {
                response_util_1.ResponseUtil.error(res, "You have already submitted for this task", "DUPLICATE_SUBMISSION", 400);
                return;
            }
            // Step 6: Check if worker is not the requester
            if (task.requesterId === workerId) {
                response_util_1.ResponseUtil.error(res, "You cannot submit to your own task", "SELF_SUBMISSION", 400);
                return;
            }
            // Step 7: Create submission
            const submission = await connections_1.prisma.submission.create({
                data: {
                    taskId: submissionData.taskId,
                    workerId: workerId,
                    submissionData: submissionData.submissionData,
                    verificationStatus: database_types_1.VerificationStatus.PENDING,
                },
                include: {
                    task: {
                        select: {
                            id: true,
                            title: true,
                            paymentAmount: true,
                            contractTaskId: true,
                        },
                    },
                    worker: {
                        select: {
                            walletAddress: true,
                        },
                    },
                },
            });
            // Update task status to in_progress
            if (task.status === database_types_1.TaskStatus.OPEN) {
                await connections_1.prisma.task.update({
                    where: { id: task.id },
                    data: { status: database_types_1.TaskStatus.IN_PROGRESS },
                });
            }
            console.log(`✅ Submission created: ${submission.id}`);
            // Step 7.2: Create pending payment record
            try {
                await connections_1.prisma.payment.create({
                    data: {
                        taskId: submissionData.taskId,
                        workerId: workerId,
                        amount: submission.task.paymentAmount,
                        transactionHash: "pending", // Placeholder until blockchain confirms
                        status: "pending",
                    },
                });
                console.log(`✅ Payment record created with pending status`);
            }
            catch (paymentError) {
                console.error("Failed to create payment record:", paymentError);
                // Don't fail the submission if payment record creation fails
            }
            // Step 7.5: Assign worker on blockchain
            if (submission.task.contractTaskId) {
                try {
                    const { blockchainService } = await Promise.resolve().then(() => __importStar(require('../services/blockchain.service')));
                    await blockchainService.assignWorker(submission.task.contractTaskId, submission.worker.walletAddress);
                    console.log(`✅ Worker assigned on blockchain`);
                }
                catch (blockchainError) {
                    console.error('Failed to assign worker on blockchain:', blockchainError);
                    // Continue even if blockchain assignment fails - the verification will catch it
                }
            }
            // Step 8: Trigger async verification
            try {
                await (0, verification_queue_1.addVerificationJob)({
                    submissionId: submission.id,
                    taskId: submissionData.taskId,
                    workerId: workerId,
                    submissionData: submissionData.submissionData,
                    verificationCriteria: task.verificationCriteria,
                    taskType: task.taskType,
                });
                console.log(`✅ Submission added to verification queue`);
            }
            catch (queueError) {
                console.error("Failed to add job to queue:", queueError);
            }
            response_util_1.ResponseUtil.success(res, {
                submissionId: submission.id,
                status: "pending",
                message: "Submission received. AI verification in progress.",
                estimatedTime: "1-2 minutes",
            }, 201);
        }
        catch (error) {
            console.error("Submit task error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to submit task");
        }
    }
    /**
     * POST /api/submissions/verify-webhook
     * Internal webhook for verification results (called by worker)
     */
    static async verifyWebhook(req, res) {
        try {
            const webhookData = req.body;
            console.log(`\n🔔 Verification webhook for submission ${webhookData.submissionId}`);
            // Verify webhook secret (add to headers in production)
            const webhookSecret = req.headers["x-webhook-secret"];
            if (webhookSecret !== process.env.WEBHOOK_SECRET) {
                response_util_1.ResponseUtil.unauthorized(res, "Invalid webhook secret");
                return;
            }
            const submission = await connections_1.prisma.submission.findUnique({
                where: { id: webhookData.submissionId },
                include: {
                    task: true,
                    worker: true,
                },
            });
            if (!submission) {
                response_util_1.ResponseUtil.notFound(res, "Submission");
                return;
            }
            // Update submission with verification result
            await connections_1.prisma.submission.update({
                where: { id: webhookData.submissionId },
                data: {
                    aiVerificationResult: webhookData.verificationResult,
                    verificationStatus: webhookData.verificationResult.approved
                        ? database_types_1.VerificationStatus.APPROVED
                        : database_types_1.VerificationStatus.REJECTED,
                },
            });
            // If approved, trigger payment processing
            if (webhookData.verificationResult.approved) {
                console.log(`✅ Submission approved! Processing payment for submission ${webhookData.submissionId}`);
                try {
                    // Import payment service
                    const { paymentService } = await Promise.resolve().then(() => __importStar(require("../services/payment.service")));
                    // Check if contractTaskId exists
                    if (!submission.task.contractTaskId) {
                        console.warn(`⚠️  Contract task ID not found for task ${submission.taskId}. Processing local payment.`);
                        try {
                            // Update payment record directly without blockchain confirmation
                            await connections_1.prisma.payment.updateMany({
                                where: {
                                    taskId: submission.taskId,
                                    workerId: submission.workerId,
                                },
                                data: {
                                    transactionHash: `local-${submission.taskId}`,
                                    status: "completed",
                                },
                            });
                            console.log(`✅ Payment marked as completed with local reference`);
                        }
                        catch (localPaymentError) {
                            console.error(`❌ Failed to process local payment:`, localPaymentError);
                        }
                    }
                    else {
                        // Release payment via blockchain
                        const paymentResult = await paymentService.approveSubmissionWithRetry(submission.taskId, submission.id, submission.workerId, submission.task.contractTaskId, submission.task.paymentAmount.toString());
                        if (paymentResult.success) {
                            console.log(`💰 Payment released successfully! Tx: ${paymentResult.txHash}`);
                        }
                        else {
                            console.error(`❌ Payment failed: ${paymentResult.error}`);
                        }
                    }
                    // Update task status to completed
                    await connections_1.prisma.task.update({
                        where: { id: submission.taskId },
                        data: { status: database_types_1.TaskStatus.COMPLETED },
                    });
                    // Update worker earnings
                    await connections_1.prisma.user.update({
                        where: { id: submission.workerId },
                        data: {
                            totalEarnings: {
                                increment: submission.task.paymentAmount,
                            },
                            totalTasksCompleted: {
                                increment: 1,
                            },
                        },
                    });
                    console.log(`✅ Worker ${submission.workerId} earnings updated`);
                }
                catch (paymentError) {
                    console.error(`❌ Error processing payment:`, paymentError);
                    // Don't fail the webhook response, just log the error
                }
            }
            response_util_1.ResponseUtil.success(res, { message: "Verification result processed" });
        }
        catch (error) {
            console.error("Verify webhook error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to process verification");
        }
    }
    /**
     * GET /api/submissions/:submissionId/status
     * Get submission status
     */
    static async getSubmissionStatus(req, res) {
        try {
            const { submissionId } = req.params;
            const userId = req.user.userId;
            const submission = await connections_1.prisma.submission.findUnique({
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
                response_util_1.ResponseUtil.notFound(res, "Submission");
                return;
            }
            // Check if user has access to this submission
            const isOwner = submission.workerId === userId ||
                submission.task.requesterId === userId;
            if (!isOwner) {
                response_util_1.ResponseUtil.forbidden(res, "You do not have access to this submission");
                return;
            }
            // Get payment info if exists
            const payment = await connections_1.prisma.payment.findFirst({
                where: {
                    taskId: submission.taskId,
                    workerId: submission.workerId,
                },
            });
            response_util_1.ResponseUtil.success(res, {
                submission: {
                    id: submission.id,
                    status: submission.verificationStatus,
                    submittedAt: submission.createdAt,
                    verificationResult: submission.aiVerificationResult,
                },
                task: submission.task,
                payment: payment || null,
            });
        }
        catch (error) {
            console.error("Get submission status error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch submission status");
        }
    }
    /**
     * GET /api/submissions/:submissionId/payment
     * Get detailed payment status for a submission
     */
    static async getPaymentStatus(req, res) {
        try {
            const { submissionId } = req.params;
            const userId = req.user.userId;
            const submission = await connections_1.prisma.submission.findUnique({
                where: { id: submissionId },
                include: {
                    task: {
                        select: {
                            id: true,
                            requesterId: true,
                        },
                    },
                },
            });
            if (!submission) {
                response_util_1.ResponseUtil.notFound(res, "Submission");
                return;
            }
            // Check if user has access to this submission
            const isOwner = submission.workerId === userId ||
                submission.task.requesterId === userId;
            if (!isOwner) {
                response_util_1.ResponseUtil.forbidden(res, "You do not have access to this payment");
                return;
            }
            // Get payment info
            const payment = await connections_1.prisma.payment.findFirst({
                where: {
                    taskId: submission.taskId,
                    workerId: submission.workerId,
                },
            });
            if (!payment) {
                response_util_1.ResponseUtil.notFound(res, "Payment");
                return;
            }
            response_util_1.ResponseUtil.success(res, {
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    transactionHash: payment.transactionHash,
                    createdAt: payment.createdAt,
                    submissionId: submission.id,
                    verificationStatus: submission.verificationStatus,
                },
            });
        }
        catch (error) {
            console.error("Get payment status error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch payment status");
        }
    }
    /**
     * GET /api/submissions/my-submissions
     * Get submissions by authenticated worker
     */
    static async getMySubmissions(req, res) {
        try {
            const workerId = req.user.userId;
            const submissions = await connections_1.prisma.submission.findMany({
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
            const submissionsWithPayments = await Promise.all(submissions.map(async (submission) => {
                const payment = await connections_1.prisma.payment.findFirst({
                    where: {
                        taskId: submission.taskId,
                        workerId: submission.workerId,
                    },
                });
                return {
                    ...submission,
                    payment: payment || null,
                };
            }));
            response_util_1.ResponseUtil.success(res, submissionsWithPayments);
        }
        catch (error) {
            console.error("Get my submissions error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch submissions");
        }
    }
}
exports.SubmissionController = SubmissionController;
