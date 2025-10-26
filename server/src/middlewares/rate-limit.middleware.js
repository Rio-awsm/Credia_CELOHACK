"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiters = exports.RateLimitMiddleware = void 0;
const response_util_1 = require("../utils/response.util");
class RateLimitMiddleware {
    /**
     * Create rate limiter middleware
     */
    static create(options) {
        return (req, res, next) => {
            const key = options.keyGenerator
                ? options.keyGenerator(req)
                : req.ip || 'unknown';
            const now = Date.now();
            const limit = this.limits.get(key);
            // Create new entry if doesn't exist or expired
            if (!limit || now > limit.resetTime) {
                this.limits.set(key, {
                    count: 1,
                    resetTime: now + options.windowMs,
                });
                return next();
            }
            // Check if limit exceeded
            if (limit.count >= options.maxRequests) {
                const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
                res.setHeader('Retry-After', retryAfter);
                return response_util_1.ResponseUtil.error(res, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
            }
            // Increment count
            limit.count++;
            next();
        };
    }
    /**
     * Cleanup expired entries (call periodically)
     */
    static cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
RateLimitMiddleware.limits = new Map();
// Cleanup every 5 minutes
setInterval(() => RateLimitMiddleware.cleanup(), 5 * 60 * 1000);
// Pre-configured rate limiters
exports.rateLimiters = {
    // General API: 100 requests per minute
    general: RateLimitMiddleware.create({
        windowMs: 60 * 1000,
        maxRequests: 100,
    }),
    // Strict (auth, registration): 10 requests per minute
    strict: RateLimitMiddleware.create({
        windowMs: 60 * 1000,
        maxRequests: 10,
    }),
    // Per wallet: 50 requests per minute
    perWallet: RateLimitMiddleware.create({
        windowMs: 60 * 1000,
        maxRequests: 50,
        keyGenerator: (req) => {
            const walletAddress = req.headers['x-wallet-address'];
            return walletAddress || req.ip || 'unknown';
        },
    }),
};
