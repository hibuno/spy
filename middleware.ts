import { NextRequest, NextResponse } from "next/server";
import { validateOrigin, getClientIP } from "./src/lib/security";

export function middleware(request: NextRequest) {
  // Only apply middleware to API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

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

  // Log all API requests for monitoring
  const clientIP = getClientIP(request);
  const origin =
    request.headers.get("origin") || request.headers.get("referer") || "direct";
  console.log(
    `API Request: ${request.method} ${request.nextUrl.pathname} from ${clientIP} (${origin})`
  );

  // Basic security headers for all API responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS headers - only allow requests from configured domains
  if (allowedDomains.length > 0) {
    const origin = request.headers.get("origin");
    if (origin && validateOrigin(request, allowedDomains)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (process.env.NODE_ENV === "development") {
      // In development, be more permissive
      response.headers.set("Access-Control-Allow-Origin", "*");
    }
  } else {
    // If no domains configured, allow all in development, none in production
    if (process.env.NODE_ENV === "development") {
      response.headers.set("Access-Control-Allow-Origin", "*");
    }
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key"
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
