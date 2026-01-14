import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import {
  fetchGitHubRepository,
  fetchGitHubReadme,
  fetchGitHubLanguages,
  parseRepositoryPath,
  extractImagesFromReadme,
  determineExperienceLevel,
  determineUsabilityLevel,
  determineDeploymentLevel,
} from "@/services/github-service";

async function enrichHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository enrichment...");

    // Get repositories that need enrichment (ingested but not enriched)
    const repositoriesToEnrich = await db
      .select()
      .from(repositoriesTable)
      .where(
        sql`${repositoriesTable.ingested} = true AND ${repositoriesTable.enriched} = false`
      )
      .limit(10); // Process max 10 at a time

    if (repositoriesToEnrich.length === 0) {
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

        // Parse repository path
        const parsed = parseRepositoryPath(repository.repository || "");

        if (!parsed) {
          console.warn(
            `Could not parse repository path: ${repository.repository}`
          );
          // Mark as enriched anyway to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              enriched: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
          processedCount++;
          continue;
        }

        const { owner, repo } = parsed;

        // Fetch GitHub data
        const [githubRepo, readme, languages] = await Promise.all([
          fetchGitHubRepository(owner, repo),
          fetchGitHubReadme(owner, repo),
          fetchGitHubLanguages(owner, repo),
        ]);

        if (!githubRepo) {
          console.warn(`GitHub repository not found: ${owner}/${repo}`);
          // Mark as enriched to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              enriched: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
          processedCount++;
          continue;
        }

        // Extract images from README
        const images = readme ? extractImagesFromReadme(readme) : [];

        // Determine levels
        const experienceLevel = determineExperienceLevel(
          languages || [],
          githubRepo.topics || [],
          githubRepo.description
        );

        const usabilityLevel = determineUsabilityLevel(
          !!readme,
          !!githubRepo.homepage,
          githubRepo.topics || []
        );

        const deploymentLevel = determineDeploymentLevel(
          languages || [],
          githubRepo.topics || []
        );

        // Update repository with enriched data
        await db
          .update(repositoriesTable)
          .set({
            summary: githubRepo.description || repository.summary,
            content: readme ? readme.substring(0, 5000) : null, // Limit content size
            languages: languages ? languages.join(", ") : null,
            experience: experienceLevel,
            usability: usabilityLevel,
            deployment: deploymentLevel,
            stars: githubRepo.stargazers_count,
            forks: githubRepo.forks_count,
            watching: githubRepo.watchers_count,
            license: githubRepo.license?.name || null,
            homepage: githubRepo.homepage || githubRepo.html_url,
            images: images.length > 0 ? images : [],
            archived: githubRepo.archived,
            disabled: githubRepo.disabled,
            open_issues: githubRepo.open_issues_count,
            default_branch: githubRepo.default_branch,
            network_count: githubRepo.network_count,
            tags: githubRepo.topics?.join(", ") || null,
            readme: readme,
            enriched: true,
            updated_at: new Date(),
          })
          .where(eq(repositoriesTable.id, repository.id));

        processedCount++;
        console.log(`✅ Enriched: ${owner}/${repo}`);

        // Add delay between repositories (GitHub API rate limit: 5000/hour with token, 60/hour without)
        if (i < repositoriesToEnrich.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
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
