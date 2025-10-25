import { RateLimitConfig } from '../types/ai.types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(key: string = 'global'): Promise<boolean> {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      const waitTime = entry.resetTime - now;
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    entry.count++;
    return true;
  }

  async waitForSlot(key: string = 'global'): Promise<void> {
    try {
      await this.checkLimit(key);
    } catch (error) {
      const entry = this.requests.get(key);
      if (entry) {
        const waitTime = entry.resetTime - Date.now();
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        await this.waitForSlot(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  getStatus(key: string = 'global'): { remaining: number; resetTime: number } | null {
    const entry = this.requests.get(key);
    if (!entry) {
      return {
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    if (Date.now() > entry.resetTime) {
      return {
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
}
