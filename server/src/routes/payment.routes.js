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
const express_1 = require("express");
const submission_controller_1 = require("../controllers/submission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const router = (0, express_1.Router)();
/**
 * Payment Routes
 */
/**
 * GET /api/payments/:submissionId
 * Get detailed payment status for a submission
 */
router.get("/:submissionId", rate_limit_middleware_1.rateLimiters.general, auth_middleware_1.AuthMiddleware.verifyWallet, submission_controller_1.SubmissionController.getPaymentStatus);
/**
 * GET /api/payments/stats/worker
 * Get worker payment statistics
 */
router.get("/stats/worker", rate_limit_middleware_1.rateLimiters.general, auth_middleware_1.AuthMiddleware.verifyWallet, async (req, res) => {
    try {
        const { paymentService } = await Promise.resolve().then(() => __importStar(require("../services/payment.service")));
        const userId = req.user.userId;
        const stats = await paymentService.getPaymentStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error("Failed to fetch payment stats:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch payment statistics",
        });
    }
});
exports.default = router;
