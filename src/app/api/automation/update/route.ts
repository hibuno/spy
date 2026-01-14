import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { sql, eq, and, lt } from "drizzle-orm";
import {
  fetchGitHubRepository,
  parseRepositoryPath,
} from "@/services/github-service";

/**
 * Update published repositories with latest GitHub stats
 * Runs every 20 seconds, updates repos that haven't been updated in 1+ days
 */
async function updateHandler(_request: NextRequest) {
  try {
    console.log("🔄 Starting repository stats update...");

    // Get published repositories that haven't been updated in 1+ days
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const repositoriesToUpdate = await db
      .select()
      .from(repositoriesTable)
      .where(
        and(
          sql`${repositoriesTable.publish} = true`,
          sql`${repositoriesTable.updated_at} < ${oneDayAgo}`
        )
      )
      .orderBy(sql`${repositoriesTable.updated_at} ASC`)
      .limit(10); // Process max 10 at a time to avoid rate limits

    if (repositoriesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No repositories need updating",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📊 Found ${repositoriesToUpdate.length} repositories to update`
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process repositories
    for (let i = 0; i < repositoriesToUpdate.length; i++) {
      const repository = repositoriesToUpdate[i];

      try {
        console.log(
          `🔄 Updating ${i + 1}/${repositoriesToUpdate.length}: ${
            repository.repository
          }`
        );

        // Parse repository path
        const parsed = parseRepositoryPath(repository.repository || "");

        if (!parsed) {
          console.warn(
            `Could not parse repository path: ${repository.repository}`
          );
          errorCount++;
          errors.push(`${repository.repository}: Invalid repository path`);
          continue;
        }

        const { owner, repo } = parsed;

        // Fetch latest GitHub data
        const githubRepo = await fetchGitHubRepository(owner, repo);

        if (!githubRepo) {
          console.warn(`GitHub repository not found: ${owner}/${repo}`);
          errorCount++;
          errors.push(
            `${repository.repository}: Repository not found on GitHub`
          );
          continue;
        }

        // Update repository with latest stats
        await db
          .update(repositoriesTable)
          .set({
            stars: githubRepo.stargazers_count,
            forks: githubRepo.forks_count,
            watching: githubRepo.watchers_count,
            open_issues: githubRepo.open_issues_count,
            archived: githubRepo.archived,
            disabled: githubRepo.disabled,
            network_count: githubRepo.network_count,
            updated_at: new Date(),
          })
          .where(eq(repositoriesTable.id, repository.id));

        processedCount++;
        console.log(
          `✅ Updated: ${repository.repository} (⭐ ${githubRepo.stargazers_count})`
        );

        // Add small delay to respect GitHub rate limits
        if (i < repositoriesToUpdate.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repository.repository}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error updating ${repository.repository}:`, error);
        continue;
      }
    }

    const result = {
      success: true,
      message: `Repository stats update completed`,
      totalFound: repositoriesToUpdate.length,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Update completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Update automation error:", error);
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
  updateHandler,
  middlewareConfigs.scraping
);
