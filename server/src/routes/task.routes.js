"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const task_validator_1 = require("../validators/task.validator");
const router = (0, express_1.Router)();
// Create task (authenticated, rate limited)
router.post('/create', rate_limit_middleware_1.rateLimiters.perWallet, auth_middleware_1.AuthMiddleware.verifyWallet, validation_middleware_1.ValidationMiddleware.validate(task_validator_1.taskValidators.create), task_controller_1.TaskController.createTask);
// List tasks (public, with optional auth)
router.get('/list', rate_limit_middleware_1.rateLimiters.general, validation_middleware_1.ValidationMiddleware.validate(task_validator_1.taskValidators.list), task_controller_1.TaskController.listTasks);
// Get single task (public)
router.get('/:taskId', rate_limit_middleware_1.rateLimiters.general, validation_middleware_1.ValidationMiddleware.validate(task_validator_1.taskValidators.getById), task_controller_1.TaskController.getTask);
// Get my tasks (authenticated)
router.get('/my/tasks', rate_limit_middleware_1.rateLimiters.perWallet, auth_middleware_1.AuthMiddleware.verifyWallet, task_controller_1.TaskController.getMyTasks);
exports.default = router;
