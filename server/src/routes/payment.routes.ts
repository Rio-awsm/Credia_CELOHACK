import { Router } from "express";
import { SubmissionController } from "../controllers/submission.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { rateLimiters } from "../middlewares/rate-limit.middleware";
import { ValidationMiddleware } from "../middlewares/validation.middleware";
import { AuthenticatedRequest } from "../types/api.types";

const router = Router();

/**
 * Payment Routes
 */

/**
 * GET /api/payments/:submissionId
 * Get detailed payment status for a submission
 */
router.get(
    "/:submissionId",
    rateLimiters.general,
    AuthMiddleware.verifyWallet,
    SubmissionController.getPaymentStatus
);

/**
 * GET /api/payments/stats/worker
 * Get worker payment statistics
 */
router.get(
    "/stats/worker",
    rateLimiters.general,
    AuthMiddleware.verifyWallet,
    async (req: AuthenticatedRequest, res) => {
        try {
            const { paymentService } = await import("../services/payment.service");
            const userId = req.user!.userId!;

            const stats = await paymentService.getPaymentStats(userId);
            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Failed to fetch payment stats:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch payment statistics",
            });
        }
    }
);

export default router;
