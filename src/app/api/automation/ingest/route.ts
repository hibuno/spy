import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";
import { fetchOSSInsightRepositories } from "@/services/ossinsight-service";
import { fetchPaperRepositories } from "@/services/paper-service";
import { fetchTrendingRepositories } from "@/services/trending-service";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";

async function ingestHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository ingestion...");

    let totalNewRepos = 0;
    let addedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const sources = [
      { name: "ossinsight", fetcher: fetchOSSInsightRepositories },
      { name: "paper", fetcher: fetchPaperRepositories },
      { name: "trending", fetcher: fetchTrendingRepositories },
    ];
    const MAX_REPOS_PER_HOUR = 20;

    // Collect all new repositories from all sources first
    const allNewRepos: any[] = [];

    // Fetch new repositories from all scraping services directly
    for (const { name: source, fetcher } of sources) {
      try {
        console.log(`📡 Fetching repositories from ${source}...`);

        // Call service directly instead of making HTTP request
        const repositories = await fetcher();

        // Handle different response formats from different services
        let newRepos = [];
        if (source === "paper") {
          // Paper service returns papers with different structure
          newRepos = repositories
            .filter((paper: any) => !paper.existsInDB)
            .map((paper: any) => ({
              href: paper.url, // Paper uses 'url' as the repository identifier
              url: paper.url,
              name: paper.url,
              title: paper.title,
              authors: paper.authors,
              thumbnail: paper.thumbnail,
              source: source,
            }));
        } else {
          // OSS Insight and Trending services return repositories array
          newRepos = repositories
            .filter((repo: any) => !repo.existsInDB)
            .map((repo: any) => ({
              ...repo,
              source: source,
            }));
        }

        console.log(
          `📋 Found ${newRepos.length} new repositories from ${source}`
        );
        totalNewRepos += newRepos.length;
        allNewRepos.push(...newRepos);

        // Add delay between different sources
        if (source !== sources[sources.length - 1].name) {
          console.log(`⏳ Waiting before fetching from next source...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error fetching from ${source}:`, error);
        errors.push(
          `${source}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        continue;
      }
    }

    // Limit to MAX_REPOS_PER_HOUR and prioritize by source
    const limitedRepos = allNewRepos.slice(0, MAX_REPOS_PER_HOUR);
    console.log(
      `🎯 Processing ${limitedRepos.length} repositories (limited from ${totalNewRepos} total)`
    );

    // Add repositories to database with minimal processing
    for (let i = 0; i < limitedRepos.length; i++) {
      const repo = limitedRepos[i];

      try {
        console.log(
          `➕ Adding ${i + 1}/${limitedRepos.length}: ${
            repo.name || repo.href
          } (from ${repo.source})`
        );

        // Create minimal repository record - just add to database without full processing
        const repoRecord = {
          id: crypto.randomUUID(),
          repository: repo.href || repo.name,
          summary: repo.description || repo.title || null,
          content: null,
          languages: null,
          experience: null,
          usability: null,
          deployment: null,
          stars: repo.stars ? parseInt(repo.stars) : null,
          forks: repo.forks ? parseInt(repo.forks) : null,
          watching: null,
          license: null,
          homepage: repo.url || null,
          images: [],
          created_at: new Date(),
          updated_at: new Date(),
          archived: false,
          disabled: false,
          open_issues: null,
          default_branch: "main",
          network_count: null,
          tags: null,
          arxiv_url: null,
          huggingface_url: repo.source === "paper" ? repo.url : null,
          paper_authors: repo.authors ? JSON.stringify(repo.authors) : null,
          paper_abstract: null,
          paper_scraped_at: repo.source === "paper" ? new Date() : null,
          readme: null,
          publish: false,
          ingested: true,
          enriched: false, // Mark as not enriched so enrich endpoint can handle it
        };

        // Insert directly into database using Drizzle ORM
        try {
          await db
            .insert(repositoriesTable)
            .values(repoRecord)
            .onConflictDoNothing();
          addedCount++;
        } catch (insertError) {
          // If insert fails due to conflict or other issues, don't count it
          console.warn(
            `Insert skipped for ${repo.name || repo.href}:`,
            insertError
          );
        }

        // Small delay between database inserts
        if (i < limitedRepos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repo.name || repo.href}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error adding ${repo.name || repo.href}:`, error);
        continue;
      }
    }

    const result = {
      success: true,
      message: `Repository ingestion completed - added ${addedCount} new repositories`,
      totalFound: totalNewRepos,
      processed: addedCount,
      limited: totalNewRepos > MAX_REPOS_PER_HOUR,
      maxPerHour: MAX_REPOS_PER_HOUR,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      sources: sources.map((s) => s.name),
      note: "Repositories added to database but not fully processed. Processing will be handled by separate endpoints. Using direct service calls instead of HTTP requests.",
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
