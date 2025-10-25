import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { rateLimiters } from '../middlewares/rate-limit.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { submissionValidators } from '../validators/submission.validator';

const router = Router();

// Submit task (authenticated, rate limited)
router.post(
  '/submit',
  rateLimiters.perWallet,
  AuthMiddleware.verifyWallet,
  ValidationMiddleware.validate(submissionValidators.submit),
  SubmissionController.submitTask
);

// Verification webhook (internal, strict rate limit)
router.post(
  '/verify-webhook',
  rateLimiters.strict,
  ValidationMiddleware.validate(submissionValidators.verifyWebhook),
  SubmissionController.verifyWebhook
);

// Get submission status (authenticated)
router.get(
  '/:submissionId/status',
  rateLimiters.general,
  AuthMiddleware.verifyWallet,
  ValidationMiddleware.validate(submissionValidators.getStatus),
  SubmissionController.getSubmissionStatus
);

// Get my submissions (authenticated)
router.get(
  '/my/submissions',
  rateLimiters.perWallet,
  AuthMiddleware.verifyWallet,
  SubmissionController.getMySubmissions
);

export default router;
