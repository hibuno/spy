import { NextRequest, NextResponse } from "next/server";
import { RepositoryFetcher } from "../../../../../scripts/ingest_repository";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function ingestHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository ingestion...");

    const fetcher = new RepositoryFetcher();

    // Connect to database
    await fetcher.connect();

    // Get repositories that need processing
    const repositoriesToProcess =
      await fetcher.getAllRepositoriesWithEmptyImages();

    if (repositoriesToProcess.length === 0) {
      await fetcher.disconnect();
      return NextResponse.json({
        success: true,
        message: "No repositories need processing",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📋 Found ${repositoriesToProcess.length} repositories to process`
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process repositories with rate limiting
    for (let i = 0; i < repositoriesToProcess.length; i++) {
      const repository = repositoriesToProcess[i];

      try {
        console.log(
          `📦 Processing ${i + 1}/${repositoriesToProcess.length}: ${
            repository.repository
          }`
        );
        await fetcher.processRepository(repository);
        processedCount++;

        // Add delay between repositories (GitHub rate limit: 60 req/min)
        if (i < repositoriesToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repository.repository}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error processing ${repository.repository}:`, error);

        // Continue with next repository
        continue;
      }
    }

    await fetcher.disconnect();

    const result = {
      success: true,
      message: `Repository ingestion completed`,
      totalFound: repositoriesToProcess.length,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Ingestion completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Ingestion automation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply security middleware - require API key for automation endpoints
export const POST = withApiMiddleware(
  ingestHandler,
  middlewareConfigs.scraping
);
