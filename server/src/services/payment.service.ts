import { prisma } from "../database/connections";
import { blockchainService } from "./blockchain.service";
import { notificationService, NotificationType } from "./notification.service";

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

/**
 * Payment Service
 * Handles payment processing, retries, and error recovery
 */
export class PaymentService {
    /**
     * Sleep helper function
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Approve submission with retry logic and error handling
     */
    static async approveSubmissionWithRetry(
        taskId: string,
        submissionId: string,
        workerId: string,
        contractTaskId: number,
        paymentAmount: string
    ): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
        attempts: number;
    }> {
        let lastError: any = null;
        let txHash: string | null = null;

        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                console.log(
                    `\n💳 Approving submission (Attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`
                );

                // Call blockchain to release payment
                txHash = await blockchainService.approveSubmission(contractTaskId);
                console.log(`✅ Blockchain approval successful: ${txHash}`);

                // Update payment record with transaction hash
                await prisma.payment.updateMany({
                    where: {
                        taskId,
                        workerId,
                    },
                    data: {
                        transactionHash: txHash,
                        status: "completed",
                    },
                });

                console.log(`✅ Payment record updated with transaction hash`);

                // Update submission with transaction hash
                await prisma.submission.update({
                    where: { id: submissionId },
                    data: {
                        paymentTransactionHash: txHash,
                    },
                });

                // Notify worker of successful payment
                await notificationService.send(workerId, {
                    type: NotificationType.PAYMENT_RELEASED,
                    taskId,
                    submissionId,
                    amount: Number(paymentAmount),
                    txHash: txHash,
                });

                return {
                    success: true,
                    txHash,
                    attempts: attempt,
                };
            } catch (error: any) {
                lastError = error;
                console.error(`⚠️  Attempt ${attempt} failed:`, error.message);

                // If this is not the last attempt, wait before retrying
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
                    await this.sleep(RETRY_DELAY_MS);
                }
            }
        }

        // All retries failed - update payment status to failed
        console.error(`❌ All ${MAX_RETRY_ATTEMPTS} attempts failed`);

        try {
            await prisma.payment.updateMany({
                where: {
                    taskId,
                    workerId,
                },
                data: {
                    status: "failed",
                },
            });

            // Notify worker of payment failure
            await notificationService.send(workerId, {
                type: NotificationType.SUBMISSION_REJECTED,
                taskId,
                submissionId,
                result: { error: lastError?.message || "Payment processing failed" },
            });
        } catch (updateError) {
            console.error("Failed to update payment status:", updateError);
        }

        return {
            success: false,
            error: lastError?.message,
            attempts: MAX_RETRY_ATTEMPTS,
        };
    }

    /**
     * Rollback payment on verification failure
     */
    static async rollbackPayment(taskId: string, workerId: string): Promise<void> {
        try {
            console.log(
                `🔙 Rolling back payment for task ${taskId}, worker ${workerId}`
            );

            // Delete the pending payment record
            const deletedPayment = await prisma.payment.deleteMany({
                where: {
                    taskId,
                    workerId,
                    status: "pending",
                },
            });

            if (deletedPayment.count > 0) {
                console.log(
                    `✅ Deleted ${deletedPayment.count} pending payment record(s)`
                );
            } else {
                console.log(`⚠️  No pending payment records found to delete`);
            }
        } catch (error) {
            console.error("Failed to rollback payment:", error);
            throw new Error(`Payment rollback failed: ${error}`);
        }
    }

    /**
     * Get payment status by submission ID
     */
    static async getPaymentStatus(submissionId: string): Promise<any | null> {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                task: {
                    select: { id: true },
                },
            },
        });

        if (!submission) {
            throw new Error("Submission not found");
        }

        const payment = await prisma.payment.findFirst({
            where: {
                taskId: submission.task.id,
                workerId: submission.workerId,
            },
        });

        return payment || null;
    }

    /**
     * Get all payments for a worker
     */
    static async getWorkerPayments(workerId: string): Promise<any[]> {
        return await prisma.payment.findMany({
            where: { workerId },
            orderBy: { createdAt: "desc" },
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
    }

    /**
     * Get payment statistics for a worker
     */
    static async getPaymentStats(workerId: string): Promise<{
        totalEarnings: number;
        completedPayments: number;
        pendingPayments: number;
        failedPayments: number;
    }> {
        const payments = await prisma.payment.findMany({
            where: { workerId },
        });

        return {
            totalEarnings: payments
                .filter((p) => p.status === "completed")
                .reduce((sum, p) => sum + Number(p.amount), 0),
            completedPayments: payments.filter((p) => p.status === "completed")
                .length,
            pendingPayments: payments.filter((p) => p.status === "pending").length,
            failedPayments: payments.filter((p) => p.status === "failed").length,
        };
    }
}

export const paymentService = PaymentService;
