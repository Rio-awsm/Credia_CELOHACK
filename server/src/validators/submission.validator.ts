import { body, param } from 'express-validator';

export const submissionValidators = {
  submit: [
    body('taskId')
      .isUUID()
      .withMessage('Invalid task ID'),
    
    body('submissionData')
      .isObject()
      .withMessage('Submission data must be an object'),
    
    body('submissionData.text')
      .optional()
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Text must be between 1 and 10000 characters'),
    
    body('submissionData.imageUrls')
      .optional()
      .isArray()
      .withMessage('Image URLs must be an array'),
    
    body('submissionData.imageUrls.*')
      .optional()
      .isURL()
      .withMessage('Invalid image URL'),
    
    body('submissionData.answers')
      .optional()
      .isObject()
      .withMessage('Answers must be an object'),
  ],

  verifyWebhook: [
    body('submissionId')
      .isUUID()
      .withMessage('Invalid submission ID'),
    
    body('verificationResult')
      .isObject()
      .withMessage('Verification result must be an object'),
    
    body('verificationResult.approved')
      .isBoolean()
      .withMessage('Approved must be a boolean'),
    
    body('verificationResult.score')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Score must be between 0 and 100'),
    
    body('verificationResult.reasoning')
      .trim()
      .notEmpty()
      .withMessage('Reasoning is required'),
  ],

  getStatus: [
    param('submissionId')
      .isUUID()
      .withMessage('Invalid submission ID'),
  ],
};
