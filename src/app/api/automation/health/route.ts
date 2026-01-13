import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { count } from "drizzle-orm";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function healthHandler(_request: NextRequest) {
  try {
    // Test database connection
    const testQuery = await db
      .select({ count: count() })
      .from(repositoriesTable);

    // Check environment variables
    const requiredEnvVars = [
      "SUPABASE_DATABASE_HOST",
      "SUPABASE_DATABASE_NAME",
      "SUPABASE_DATABASE_USER",
      "SUPABASE_DATABASE_PASSWORD",
      "GITHUB_TOKEN",
      "OPENAI_API_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    const health = {
      success: true,
      timestamp: new Date().toISOString(),
      status: "healthy",
      services: {
        database: {
          status: "connected",
          totalRepositories: testQuery[0]?.count || 0,
        },
        github: {
          status: process.env.GITHUB_TOKEN ? "configured" : "missing_token",
          hasToken: !!process.env.GITHUB_TOKEN,
        },
        openai: {
          status: process.env.OPENAI_API_KEY ? "configured" : "missing_key",
          hasKey: !!process.env.OPENAI_API_KEY,
          apiUrl:
            process.env.OPENAI_API_URL ||
            "https://api.openai.com/v1/chat/completions",
          model: process.env.OPENAI_API_MODEL || "gpt-4.1-nano",
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        missingEnvVars: missingEnvVars,
      },
    };

    // If there are missing environment variables, mark as degraded
    if (missingEnvVars.length > 0) {
      health.status = "degraded";
      health.success = false;
    }

    const statusCode = health.success ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error("💥 Health check error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Apply security middleware - require API key for automation endpoints
export const GET = withApiMiddleware(healthHandler, middlewareConfigs.scraping);
