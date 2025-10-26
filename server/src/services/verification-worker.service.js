"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationWorkerService = void 0;
const connections_1 = require("../database/connections");
const database_types_1 = require("../types/database.types");
const moderation_types_1 = require("../types/moderation.types");
const ai_verification_service_1 = require("./ai-verification.service");
const blockchain_service_1 = require("./blockchain.service");
const content_moderation_service_1 = require("./content-moderation.service");
class VerificationWorkerService {
    /**
     * Process submission verification asynchronously
     */
    static async processSubmission(submissionId) {
        try {
            console.log(`\n🔄 Processing submission ${submissionId}...`);
            // Get submission with task details
            const submission = await connections_1.prisma.submission.findUnique({
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
            const moderationResult = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: JSON.stringify(submission.submissionData),
                context: {
                    taskType: submission.task.taskType,
                    userId: submission.workerId,
                },
                submissionId,
            });
            // Auto-reject if flagged as critical
            if (moderationResult.action === moderation_types_1.ModerationAction.AUTO_REJECT) {
                console.log('🚫 Submission auto-rejected by moderation');
                await connections_1.prisma.submission.update({
                    where: { id: submissionId },
                    data: {
                        verificationStatus: database_types_1.VerificationStatus.REJECTED,
                        aiVerificationResult: JSON.parse(JSON.stringify({
                            moderation: moderationResult,
                            rejected: true,
                            reason: 'Content moderation failed',
                        })), // ← FIX: Cast to any after JSON conversion
                    },
                });
                // TODO: Notify worker
                return;
            }
            // Step 2: AI verification (if moderation passed)
            console.log('🤖 Running AI verification...');
            const verificationResult = await ai_verification_service_1.aiVerificationService.verifyTextTask({
                submissionText: JSON.stringify(submission.submissionData),
                verificationCriteria: JSON.stringify(submission.task.verificationCriteria),
                taskType: submission.task.taskType,
            });
            // Update submission with verification result
            await connections_1.prisma.submission.update({
                where: { id: submissionId },
                data: {
                    aiVerificationResult: JSON.parse(JSON.stringify({
                        moderation: moderationResult,
                        verification: verificationResult,
                    })), // ← FIX: Cast to any after JSON conversion
                    verificationStatus: verificationResult.approved
                        ? database_types_1.VerificationStatus.APPROVED
                        : database_types_1.VerificationStatus.REJECTED,
                },
            });
            // Step 3: If approved, release payment via smart contract
            if (verificationResult.approved) {
                console.log('✅ Submission approved! Releasing payment...');
                // Check if contractTaskId exists
                if (!submission.task.contractTaskId) {
                    throw new Error('Contract task ID not found');
                }
                const txHash = await blockchain_service_1.blockchainService.approveSubmission(submission.task.contractTaskId // ← FIX: Now this field exists
                );
                // Update payment record
                await connections_1.prisma.payment.create({
                    data: {
                        taskId: submission.taskId,
                        workerId: submission.workerId,
                        amount: submission.task.paymentAmount,
                        transactionHash: txHash,
                        status: 'completed',
                    },
                });
                // Update task status
                await connections_1.prisma.task.update({
                    where: { id: submission.taskId },
                    data: { status: 'completed' },
                });
                // Update worker earnings and task count
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
                console.log(`💰 Payment released! Tx: ${txHash}`);
            }
            else {
                console.log('❌ Submission rejected by AI verification');
            }
            console.log(`✅ Verification complete for submission ${submissionId}`);
        }
        catch (error) {
            console.error(`❌ Verification failed for submission ${submissionId}:`, error);
            // Mark as pending for manual review
            await connections_1.prisma.submission.update({
                where: { id: submissionId },
                data: {
                    verificationStatus: database_types_1.VerificationStatus.PENDING,
                    aiVerificationResult: JSON.parse(JSON.stringify({
                        error: String(error),
                        timestamp: new Date().toISOString(),
                    })), // ← FIX: Cast to any after JSON conversion
                },
            });
        }
    }
}
exports.VerificationWorkerService = VerificationWorkerService;
