import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { rateLimiters } from '../middlewares/rate-limit.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { taskValidators } from '../validators/task.validator';

const router = Router();

// Create task (authenticated, rate limited)
router.post(
  '/create',
  rateLimiters.perWallet,
  AuthMiddleware.verifyWallet,
  ValidationMiddleware.validate(taskValidators.create),
  TaskController.createTask
);

// List tasks (public, with optional auth)
router.get(
  '/list',
  rateLimiters.general,
  ValidationMiddleware.validate(taskValidators.list),
  TaskController.listTasks
);

// Get single task (public)
router.get(
  '/:taskId',
  rateLimiters.general,
  ValidationMiddleware.validate(taskValidators.getById),
  TaskController.getTask
);

// Get my tasks (authenticated)
router.get(
  '/my/tasks',
  rateLimiters.perWallet,
  AuthMiddleware.verifyWallet,
  TaskController.getMyTasks
);

export default router;
