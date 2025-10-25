import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  private static limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Create rate limiter middleware
   */
  static create(options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
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
        return ResponseUtil.error(
          res,
          'Too many requests. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      // Increment count
      limit.count++;
      next();
    };
  }

  /**
   * Cleanup expired entries (call periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Cleanup every 5 minutes
setInterval(() => RateLimitMiddleware.cleanup(), 5 * 60 * 1000);

// Pre-configured rate limiters
export const rateLimiters = {
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
      const walletAddress = req.headers['x-wallet-address'] as string;
      return walletAddress || req.ip || 'unknown';
    },
  }),
};
