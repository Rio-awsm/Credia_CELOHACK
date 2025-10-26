"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionValidators = void 0;
const express_validator_1 = require("express-validator");
exports.submissionValidators = {
    submit: [
        (0, express_validator_1.body)('taskId')
            .isUUID()
            .withMessage('Invalid task ID'),
        (0, express_validator_1.body)('submissionData')
            .isObject()
            .withMessage('Submission data must be an object'),
        (0, express_validator_1.body)('submissionData.text')
            .optional()
            .trim()
            .isLength({ min: 1, max: 10000 })
            .withMessage('Text must be between 1 and 10000 characters'),
        (0, express_validator_1.body)('submissionData.imageUrls')
            .optional()
            .isArray()
            .withMessage('Image URLs must be an array'),
        (0, express_validator_1.body)('submissionData.imageUrls.*')
            .optional()
            .isURL()
            .withMessage('Invalid image URL'),
        (0, express_validator_1.body)('submissionData.answers')
            .optional()
            .isObject()
            .withMessage('Answers must be an object'),
    ],
    verifyWebhook: [
        (0, express_validator_1.body)('submissionId')
            .isUUID()
            .withMessage('Invalid submission ID'),
        (0, express_validator_1.body)('verificationResult')
            .isObject()
            .withMessage('Verification result must be an object'),
        (0, express_validator_1.body)('verificationResult.approved')
            .isBoolean()
            .withMessage('Approved must be a boolean'),
        (0, express_validator_1.body)('verificationResult.score')
            .isFloat({ min: 0, max: 100 })
            .withMessage('Score must be between 0 and 100'),
        (0, express_validator_1.body)('verificationResult.reasoning')
            .trim()
            .notEmpty()
            .withMessage('Reasoning is required'),
    ],
    getStatus: [
        (0, express_validator_1.param)('submissionId')
            .isUUID()
            .withMessage('Invalid submission ID'),
    ],
};
