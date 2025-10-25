import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { rateLimiters } from '../middlewares/rate-limit.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { userValidators } from '../validators/user.validator';

const router = Router();

// Register user (strict rate limit)
router.post(
  '/register',
  rateLimiters.strict,
  ValidationMiddleware.validate(userValidators.register),
  UserController.register
);

// Get profile (authenticated)
router.get(
  '/profile',
  rateLimiters.perWallet,
  AuthMiddleware.verifyWallet,
  UserController.getProfile
);

// Get public profile
router.get(
  '/:walletAddress/public',
  rateLimiters.general,
  UserController.getPublicProfile
);

export default router;
