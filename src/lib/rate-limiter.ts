/**
 * In-memory rate limiter for API endpoints
 * For production, consider using Redis or a database-backed solution
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  public windowMs: number;
  public maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (usually IP address)
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window has expired
      const resetTime = now + this.windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }
}

// Create different rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints - 100 requests per minute
  general: new RateLimiter(60 * 1000, 100),

  // Search endpoints - more restrictive due to database queries
  search: new RateLimiter(60 * 1000, 30),

  // Scraping endpoints - very restrictive to prevent abuse
  scraping: new RateLimiter(60 * 1000, 10),

  // Stats endpoint - moderate limit since it's cached
  stats: new RateLimiter(60 * 1000, 60),
};

export type RateLimiterType = keyof typeof rateLimiters;
