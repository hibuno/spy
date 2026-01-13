import { NextRequest } from "next/server";

/**
 * Security utilities for API protection
 */

export interface SecurityConfig {
  allowedDomains: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Validates if the request origin is from an allowed domain
 */
export function validateOrigin(
  request: NextRequest,
  allowedDomains: string[]
): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow requests without origin/referer for direct API access (like curl, Postman)
  // But in production, you might want to be more strict
  if (!origin && !referer) {
    return process.env.NODE_ENV === "development";
  }

  // Check origin header first
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return allowedDomains.some((domain) => {
        // Support both exact match and subdomain match
        return (
          originUrl.hostname === domain ||
          originUrl.hostname.endsWith(`.${domain}`)
        );
      });
    } catch {
      return false;
    }
  }

  // Fallback to referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedDomains.some((domain) => {
        return (
          refererUrl.hostname === domain ||
          refererUrl.hostname.endsWith(`.${domain}`)
        );
      });
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Extracts client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to unknown if no IP found
  return "unknown";
}

/**
 * Validates API key if provided
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.API_SECRET_KEY;

  // If no API key is configured, skip validation
  if (!validApiKey) {
    return true;
  }

  // If API key is configured, it must be provided and valid
  return apiKey === validApiKey;
}

/**
 * Security response helpers
 */
export const SecurityResponses = {
  invalidOrigin: () =>
    new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Request not allowed from this origin",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    ),

  rateLimitExceeded: (retryAfter?: number) =>
    new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter ? retryAfter.toString() : "60",
        },
      }
    ),

  invalidApiKey: () =>
    new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or missing API key",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    ),

  serverError: (message = "Internal server error") =>
    new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    ),
};
