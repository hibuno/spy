import { NextRequest } from "next/server";
import {
  validateOrigin,
  getClientIP,
  validateApiKey,
  SecurityResponses,
} from "./security";
import { rateLimiters, RateLimiterType } from "./rate-limiter";

export interface MiddlewareOptions {
  rateLimiter?: RateLimiterType;
  requireApiKey?: boolean;
  allowedMethods?: string[];
  skipOriginCheck?: boolean;
}

/**
 * API middleware wrapper that applies security measures
 */
export function withApiMiddleware(
  handler: (request: NextRequest) => Promise<Response>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Get allowed domains from environment
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      const allowedDomains: string[] = [];

      if (appUrl) {
        try {
          const url = new URL(appUrl);
          allowedDomains.push(url.hostname);
        } catch {
          console.error("Invalid NEXT_PUBLIC_APP_URL:", appUrl);
        }
      }

      // Add localhost for development
      if (process.env.NODE_ENV === "development") {
        allowedDomains.push("localhost", "127.0.0.1");
      }

      // 1. Method validation
      if (
        options.allowedMethods &&
        !options.allowedMethods.includes(request.method)
      ) {
        return new Response(
          JSON.stringify({
            error: "Method Not Allowed",
            message: `Method ${request.method} is not allowed for this endpoint`,
          }),
          {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              Allow: options.allowedMethods.join(", "),
            },
          }
        );
      }

      // 2. Origin validation (skip for certain endpoints like webhooks)
      if (!options.skipOriginCheck && allowedDomains.length > 0) {
        if (!validateOrigin(request, allowedDomains)) {
          console.warn(
            `Blocked request from invalid origin: ${
              request.headers.get("origin") ||
              request.headers.get("referer") ||
              "unknown"
            }`
          );
          return SecurityResponses.invalidOrigin();
        }
      }

      // 3. API key validation
      if (options.requireApiKey) {
        if (!validateApiKey(request)) {
          console.warn(
            `Blocked request with invalid API key from IP: ${getClientIP(
              request
            )}`
          );
          return SecurityResponses.invalidApiKey();
        }
      }

      // 4. Rate limiting
      if (options.rateLimiter) {
        const clientIP = getClientIP(request);
        const rateLimiter = rateLimiters[options.rateLimiter];
        const { allowed, remaining, resetTime } = rateLimiter.check(clientIP);

        if (!allowed) {
          const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
          console.warn(`Rate limit exceeded for IP: ${clientIP}`);
          return SecurityResponses.rateLimitExceeded(retryAfter);
        }

        // Add rate limit headers to response
        const response = await handler(request);

        // Clone response to add headers
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

        newResponse.headers.set(
          "X-RateLimit-Limit",
          rateLimiters[options.rateLimiter].maxRequests.toString()
        );
        newResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        newResponse.headers.set(
          "X-RateLimit-Reset",
          Math.ceil(resetTime / 1000).toString()
        );

        return newResponse;
      }

      // 5. Execute the handler
      return await handler(request);
    } catch (error) {
      console.error("API middleware error:", error);
      return SecurityResponses.serverError("An unexpected error occurred");
    }
  };
}

/**
 * Predefined middleware configurations for common use cases
 */
export const middlewareConfigs = {
  // Public read-only endpoints (repositories, stats)
  publicRead: {
    rateLimiter: "general" as RateLimiterType,
    allowedMethods: ["GET"],
    requireApiKey: false,
    skipOriginCheck: false,
  },

  // Search endpoints with more restrictive rate limiting
  search: {
    rateLimiter: "search" as RateLimiterType,
    allowedMethods: ["GET"],
    requireApiKey: false,
    skipOriginCheck: false,
  },

  // Scraping endpoints - very restrictive
  scraping: {
    rateLimiter: "scraping" as RateLimiterType,
    allowedMethods: ["GET", "POST"], // Allow both GET and POST for automation
    requireApiKey: true, // Require API key for scraping
    skipOriginCheck: true, // Allow server-to-server calls
  },

  // Stats endpoint with moderate limits
  stats: {
    rateLimiter: "stats" as RateLimiterType,
    allowedMethods: ["GET"],
    requireApiKey: false,
    skipOriginCheck: false,
  },
};
