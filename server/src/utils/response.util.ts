import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

export class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: any
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error
   */
  static validationError(res: Response, errors: any[]): Response {
    return this.error(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors);
  }

  /**
   * Send not found error
   */
  static notFound(res: Response, resource: string): Response {
    return this.error(res, `${resource} not found`, 'NOT_FOUND', 404);
  }

  /**
   * Send unauthorized error
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  /**
   * Send forbidden error
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  /**
   * Send internal server error
   */
  static internalError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 'INTERNAL_ERROR', 500);
  }
}
