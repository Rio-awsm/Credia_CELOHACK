"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submission_controller_1 = require("../controllers/submission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const submission_validator_1 = require("../validators/submission.validator");
const router = (0, express_1.Router)();
// Submit task (authenticated, rate limited)
router.post('/submit', rate_limit_middleware_1.rateLimiters.perWallet, auth_middleware_1.AuthMiddleware.verifyWallet, validation_middleware_1.ValidationMiddleware.validate(submission_validator_1.submissionValidators.submit), submission_controller_1.SubmissionController.submitTask);
// Verification webhook (internal, strict rate limit)
router.post('/verify-webhook', rate_limit_middleware_1.rateLimiters.strict, validation_middleware_1.ValidationMiddleware.validate(submission_validator_1.submissionValidators.verifyWebhook), submission_controller_1.SubmissionController.verifyWebhook);
// Get submission status (authenticated)
router.get('/:submissionId/status', rate_limit_middleware_1.rateLimiters.general, auth_middleware_1.AuthMiddleware.verifyWallet, validation_middleware_1.ValidationMiddleware.validate(submission_validator_1.submissionValidators.getStatus), submission_controller_1.SubmissionController.getSubmissionStatus);
// Get my submissions (authenticated)
router.get('/my/submissions', rate_limit_middleware_1.rateLimiters.perWallet, auth_middleware_1.AuthMiddleware.verifyWallet, submission_controller_1.SubmissionController.getMySubmissions);
exports.default = router;
