import { NextRequest, NextResponse } from "next/server";
import { RepositoryFetcher } from "../../../../../scripts/ingest_repository";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function ingestHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository ingestion...");

    const fetcher = new RepositoryFetcher();

    // Connect to database
    await fetcher.connect();

    let totalNewRepos = 0;
    let addedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const sources = ["ossinsight", "paper", "trending"];
    const MAX_REPOS_PER_HOUR = 20;

    // Collect all new repositories from all sources first
    const allNewRepos: any[] = [];

    // Fetch new repositories from all scraping endpoints
    for (const source of sources) {
      try {
        console.log(`📡 Fetching repositories from ${source}...`);

        // Make internal API call to scraping endpoint
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/api/${source}`,
          {
            headers: {
              "X-API-Key": process.env.API_SECRET_KEY || "",
              "User-Agent": "Spy-Automation/1.0",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`${source} API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            `${source} API failed: ${data.error || "Unknown error"}`
          );
        }

        // Handle different response formats from different endpoints
        let newRepos = [];
        if (source === "paper") {
          // Paper endpoint returns 'papers' array with different structure
          newRepos = (data.papers || []).map((paper: any) => ({
            href: paper.url, // Paper uses 'url' as the repository identifier
            url: paper.url,
            name: paper.url,
            title: paper.title,
            authors: paper.authors,
            thumbnail: paper.thumbnail,
            source: source,
          }));
        } else {
          // OSS Insight and Trending endpoints return 'repositories' array
          newRepos = (data.repositories || []).map((repo: any) => ({
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
        if (source !== sources[sources.length - 1]) {
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
          summary: repo.description || repo.title || "",
          content: "",
          languages: "",
          experience: "",
          usability: "",
          deployment: "",
          stars: BigInt(parseInt(repo.stars) || 0),
          forks: BigInt(parseInt(repo.forks) || 0),
          watching: BigInt(0),
          license: "",
          homepage: repo.url || "",
          images: JSON.stringify([]),
          created_at: new Date(),
          updated_at: new Date(),
          archived: false,
          disabled: false,
          open_issues: BigInt(0),
          default_branch: "main",
          network_count: BigInt(0),
          tags: "",
          arxiv_url: "",
          huggingface_url: "",
          paper_authors: repo.authors ? JSON.stringify(repo.authors) : "",
          paper_abstract: "",
          paper_scraped_at: null,
          readme: "",
          publish: false,
          ingested: false, // Mark as not ingested so process endpoint can handle it
          enriched: false, // Mark as not enriched so enrich endpoint can handle it
        };

        // Insert directly into database
        const insertQuery = `
          INSERT INTO repositories (
            id, repository, summary, content, languages, experience, usability, deployment,
            stars, forks, watching, license, homepage, images, created_at, updated_at,
            archived, disabled, open_issues, default_branch, network_count, tags,
            arxiv_url, huggingface_url, paper_authors, paper_abstract, paper_scraped_at,
            readme, publish, ingested, enriched
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
          ) ON CONFLICT (repository) DO NOTHING
        `;

        await (fetcher as any).dbClient.query(insertQuery, [
          repoRecord.id,
          repoRecord.repository,
          repoRecord.summary,
          repoRecord.content,
          repoRecord.languages,
          repoRecord.experience,
          repoRecord.usability,
          repoRecord.deployment,
          repoRecord.stars,
          repoRecord.forks,
          repoRecord.watching,
          repoRecord.license,
          repoRecord.homepage,
          repoRecord.images,
          repoRecord.created_at,
          repoRecord.updated_at,
          repoRecord.archived,
          repoRecord.disabled,
          repoRecord.open_issues,
          repoRecord.default_branch,
          repoRecord.network_count,
          repoRecord.tags,
          repoRecord.arxiv_url,
          repoRecord.huggingface_url,
          repoRecord.paper_authors,
          repoRecord.paper_abstract,
          repoRecord.paper_scraped_at,
          repoRecord.readme,
          repoRecord.publish,
          repoRecord.ingested,
          repoRecord.enriched,
        ]);

        addedCount++;

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

    await fetcher.disconnect();

    const result = {
      success: true,
      message: `Repository ingestion completed - added ${addedCount} new repositories`,
      totalFound: totalNewRepos,
      processed: addedCount,
      limited: totalNewRepos > MAX_REPOS_PER_HOUR,
      maxPerHour: MAX_REPOS_PER_HOUR,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      sources: sources,
      note: "Repositories added to database but not fully processed. Processing will be handled by separate endpoints.",
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
