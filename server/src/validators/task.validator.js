"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskValidators = void 0;
const express_validator_1 = require("express-validator");
const database_types_1 = require("../types/database.types");
exports.taskValidators = {
    create: [
        (0, express_validator_1.body)('title')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Title must be between 5 and 100 characters'),
        (0, express_validator_1.body)('description')
            .trim()
            .isLength({ min: 20, max: 5000 })
            .withMessage('Description must be between 20 and 5000 characters'),
        (0, express_validator_1.body)('taskType')
            .isIn(Object.values(database_types_1.TaskType))
            .withMessage('Invalid task type'),
        (0, express_validator_1.body)('paymentAmount')
            .isFloat({ min: 0.01, max: 10000 })
            .withMessage('Payment amount must be between 0.01 and 10000'),
        (0, express_validator_1.body)('verificationCriteria')
            .isObject()
            .withMessage('Verification criteria must be an object'),
        (0, express_validator_1.body)('verificationCriteria.requiredFields')
            .isArray({ min: 1 })
            .withMessage('At least one required field must be specified'),
        (0, express_validator_1.body)('verificationCriteria.aiPrompt')
            .trim()
            .isLength({ min: 10 })
            .withMessage('AI prompt must be at least 10 characters'),
        (0, express_validator_1.body)('maxSubmissions')
            .isInt({ min: 1, max: 1000 })
            .withMessage('Max submissions must be between 1 and 1000'),
        (0, express_validator_1.body)('expiresAt')
            .isISO8601()
            .withMessage('Invalid expiration date')
            .custom((value) => {
            const expiryDate = new Date(value);
            const now = new Date();
            if (expiryDate <= now) {
                throw new Error('Expiration date must be in the future');
            }
            return true;
        }),
    ],
    list: [
        (0, express_validator_1.query)('status')
            .optional()
            .isIn(Object.values(database_types_1.TaskStatus))
            .withMessage('Invalid status'),
        (0, express_validator_1.query)('taskType')
            .optional()
            .isIn(Object.values(database_types_1.TaskType))
            .withMessage('Invalid task type'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        (0, express_validator_1.query)('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a positive integer'),
        (0, express_validator_1.query)('sortBy')
            .optional()
            .isIn(['payment', 'createdAt', 'expiresAt'])
            .withMessage('Invalid sort field'),
        (0, express_validator_1.query)('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc'),
    ],
    getById: [
        (0, express_validator_1.param)('taskId')
            .isUUID()
            .withMessage('Invalid task ID'),
    ],
};
