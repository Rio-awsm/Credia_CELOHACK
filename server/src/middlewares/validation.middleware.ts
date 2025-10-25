import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { ResponseUtil } from '../utils/response.util';

export class ValidationMiddleware {
  /**
   * Validate request using express-validator
   */
  static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Run all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      // Check for errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.validationError(res, errors.array());
      }

      next();
    };
  }
}
