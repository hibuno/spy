import { NextRequest, NextResponse } from "next/server";
import { ContentEnricher } from "../../../../../scripts/enrich_repository";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function enrichHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository enrichment...");

    const enricher = new ContentEnricher();

    // Connect to database
    await enricher.connect();

    // Get repositories that need enrichment
    const repositoriesToEnrich =
      await enricher.getRepositoriesNeedingEnrichment();

    if (repositoriesToEnrich.length === 0) {
      await enricher.disconnect();
      return NextResponse.json({
        success: true,
        message: "No repositories need enrichment",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📋 Found ${repositoriesToEnrich.length} repositories to enrich`
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process repositories with rate limiting
    for (let i = 0; i < repositoriesToEnrich.length; i++) {
      const repository = repositoriesToEnrich[i];

      try {
        console.log(
          `📝 Enriching ${i + 1}/${repositoriesToEnrich.length}: ${
            repository.repository
          }`
        );
        await enricher.processRepository(repository);
        processedCount++;

        // Add delay between repositories (OpenAI rate limit)
        if (i < repositoriesToEnrich.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repository.repository}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error enriching ${repository.repository}:`, error);

        // Continue with next repository
        continue;
      }
    }

    await enricher.disconnect();

    const result = {
      success: true,
      message: `Repository enrichment completed`,
      totalFound: repositoriesToEnrich.length,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Enrichment completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Enrichment automation error:", error);
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
  enrichHandler,
  middlewareConfigs.scraping
);
