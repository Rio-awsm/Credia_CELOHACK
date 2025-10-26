"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const response_util_1 = require("../utils/response.util");
class ErrorMiddleware {
    /**
     * Global error handler
     */
    static handle(error, req, res, next) {
        console.error('Error caught by global handler:', error);
        // Prisma errors
        if (error.code && error.code.startsWith('P')) {
            return ErrorMiddleware.handlePrismaError(error, res);
        }
        // Validation errors
        if (error.name === 'ValidationError') {
            return response_util_1.ResponseUtil.validationError(res, error.details);
        }
        // JWT errors
        if (error.name === 'JsonWebTokenError') {
            return response_util_1.ResponseUtil.unauthorized(res, 'Invalid token');
        }
        // Default error
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal server error';
        const code = error.code || 'INTERNAL_ERROR';
        response_util_1.ResponseUtil.error(res, message, code, statusCode);
    }
    /**
     * Handle Prisma-specific errors
     */
    static handlePrismaError(error, res) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                response_util_1.ResponseUtil.error(res, 'Resource already exists', 'DUPLICATE_ENTRY', 409, { field: error.meta?.target });
                break;
            case 'P2025':
                // Record not found
                response_util_1.ResponseUtil.notFound(res, 'Resource');
                break;
            case 'P2003':
                // Foreign key constraint violation
                response_util_1.ResponseUtil.error(res, 'Invalid reference to related resource', 'INVALID_REFERENCE', 400);
                break;
            default:
                response_util_1.ResponseUtil.internalError(res, 'Database error');
        }
    }
    /**
     * 404 handler
     */
    static notFound(req, res) {
        response_util_1.ResponseUtil.error(res, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND', 404);
    }
}
exports.ErrorMiddleware = ErrorMiddleware;
