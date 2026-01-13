import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function statusHandler(_request: NextRequest) {
  try {
    console.log("📊 Fetching automation status...");

    // Get counts for different repository states
    const [
      totalRepos,
      ingestedRepos,
      enrichedRepos,
      publishedRepos,
      needIngestionRepos,
      needEnrichmentRepos,
    ] = await Promise.all([
      // Total repositories
      db.select({ count: count() }).from(repositoriesTable),

      // Ingested repositories
      db
        .select({ count: count() })
        .from(repositoriesTable)
        .where(sql`${repositoriesTable.ingested} = true`),

      // Enriched repositories
      db
        .select({ count: count() })
        .from(repositoriesTable)
        .where(sql`${repositoriesTable.enriched} = true`),

      // Published repositories
      db
        .select({ count: count() })
        .from(repositoriesTable)
        .where(sql`${repositoriesTable.publish} = true`),

      // Need ingestion (not ingested)
      db
        .select({ count: count() })
        .from(repositoriesTable)
        .where(sql`${repositoriesTable.ingested} = false`),

      // Need enrichment (ingested but not enriched)
      db
        .select({ count: count() })
        .from(repositoriesTable)
        .where(
          sql`${repositoriesTable.ingested} = true AND ${repositoriesTable.enriched} = false`
        ),
    ]);

    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        total: totalRepos[0]?.count || 0,
        ingested: ingestedRepos[0]?.count || 0,
        enriched: enrichedRepos[0]?.count || 0,
        published: publishedRepos[0]?.count || 0,
        needIngestion: needIngestionRepos[0]?.count || 0,
        needEnrichment: needEnrichmentRepos[0]?.count || 0,
      },
      percentages: {
        ingested: totalRepos[0]?.count
          ? Math.round(
              ((ingestedRepos[0]?.count || 0) / totalRepos[0].count) * 100
            )
          : 0,
        enriched: totalRepos[0]?.count
          ? Math.round(
              ((enrichedRepos[0]?.count || 0) / totalRepos[0].count) * 100
            )
          : 0,
        published: totalRepos[0]?.count
          ? Math.round(
              ((publishedRepos[0]?.count || 0) / totalRepos[0].count) * 100
            )
          : 0,
      },
      nextActions: {
        shouldRunIngestion: (needIngestionRepos[0]?.count || 0) > 0,
        shouldRunEnrichment: (needEnrichmentRepos[0]?.count || 0) > 0,
        ingestionsNeeded: needIngestionRepos[0]?.count || 0,
        enrichmentsNeeded: needEnrichmentRepos[0]?.count || 0,
      },
    };

    console.log("✅ Status fetched:", status);
    return NextResponse.json(status);
  } catch (error) {
    console.error("💥 Status fetch error:", error);
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
export const GET = withApiMiddleware(statusHandler, middlewareConfigs.scraping);
