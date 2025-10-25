import { body, param, query } from 'express-validator';
import { TaskStatus, TaskType } from '../types/database.types';

export const taskValidators = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 20, max: 5000 })
      .withMessage('Description must be between 20 and 5000 characters'),
    
    body('taskType')
      .isIn(Object.values(TaskType))
      .withMessage('Invalid task type'),
    
    body('paymentAmount')
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('Payment amount must be between 0.01 and 10000'),
    
    body('verificationCriteria')
      .isObject()
      .withMessage('Verification criteria must be an object'),
    
    body('verificationCriteria.requiredFields')
      .isArray({ min: 1 })
      .withMessage('At least one required field must be specified'),
    
    body('verificationCriteria.aiPrompt')
      .trim()
      .isLength({ min: 10 })
      .withMessage('AI prompt must be at least 10 characters'),
    
    body('maxSubmissions')
      .isInt({ min: 1, max: 1000 })
      .withMessage('Max submissions must be between 1 and 1000'),
    
    body('expiresAt')
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
    query('status')
      .optional()
      .isIn(Object.values(TaskStatus))
      .withMessage('Invalid status'),
    
    query('taskType')
      .optional()
      .isIn(Object.values(TaskType))
      .withMessage('Invalid task type'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer'),
    
    query('sortBy')
      .optional()
      .isIn(['payment', 'createdAt', 'expiresAt'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  getById: [
    param('taskId')
      .isUUID()
      .withMessage('Invalid task ID'),
  ],
};
