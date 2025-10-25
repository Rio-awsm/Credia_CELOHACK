import { createHash } from 'crypto';
import { CacheConfig } from '../types/ai.types';

// Simple in-memory cache (use Redis in production)
class CacheService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  generateKey(prefix: string, data: any): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache HIT: ${key}`);
    return entry.data as T;
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.config.enabled) return;

    const expiresAt = Date.now() + (ttl || this.config.ttl) * 1000;
    this.cache.set(key, { data, expiresAt });
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl || this.config.ttl}s)`);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    console.log('🗑️  Cache cleared');
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheService = new CacheService({
  enabled: true,
  ttl: 3600, // 1 hour
});
