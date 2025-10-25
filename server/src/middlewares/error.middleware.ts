import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

export class ErrorMiddleware {
  /**
   * Global error handler
   */
  static handle(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response {
    console.error('Error caught by global handler:', error);

    // Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return ErrorMiddleware.handlePrismaError(error, res);
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return ResponseUtil.validationError(res, error.details);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return ResponseUtil.unauthorized(res, 'Invalid token');
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'INTERNAL_ERROR';

    ResponseUtil.error(res, message, code, statusCode);
  }

  /**
   * Handle Prisma-specific errors
   */
  private static handlePrismaError(error: any, res: Response): void {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        ResponseUtil.error(
          res,
          'Resource already exists',
          'DUPLICATE_ENTRY',
          409,
          { field: error.meta?.target }
        );
        break;

      case 'P2025':
        // Record not found
        ResponseUtil.notFound(res, 'Resource');
        break;

      case 'P2003':
        // Foreign key constraint violation
        ResponseUtil.error(
          res,
          'Invalid reference to related resource',
          'INVALID_REFERENCE',
          400
        );
        break;

      default:
        ResponseUtil.internalError(res, 'Database error');
    }
  }

  /**
   * 404 handler
   */
  static notFound(req: Request, res: Response): void {
    ResponseUtil.error(
      res,
      `Route ${req.method} ${req.path} not found`,
      'ROUTE_NOT_FOUND',
      404
    );
  }
}
