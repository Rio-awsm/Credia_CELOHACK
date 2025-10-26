"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    /**
     * Send success response
     */
    static success(res, data, statusCode = 200, meta) {
        const response = {
            success: true,
            data,
            ...(meta && { meta }),
        };
        return res.status(statusCode).json(response);
    }
    /**
     * Send error response
     */
    static error(res, message, code, statusCode = 400, details) {
        const response = {
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
    static validationError(res, errors) {
        return this.error(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors);
    }
    /**
     * Send not found error
     */
    static notFound(res, resource) {
        return this.error(res, `${resource} not found`, 'NOT_FOUND', 404);
    }
    /**
     * Send unauthorized error
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 'UNAUTHORIZED', 401);
    }
    /**
     * Send forbidden error
     */
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 'FORBIDDEN', 403);
    }
    /**
     * Send internal server error
     */
    static internalError(res, message = 'Internal server error') {
        return this.error(res, message, 'INTERNAL_ERROR', 500);
    }
}
exports.ResponseUtil = ResponseUtil;
