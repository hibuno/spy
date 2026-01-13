import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { validateRepositoryPath } from "@/lib/utils";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

interface OSSInsightRepository {
  repo_id: string;
  repo_name: string;
  primary_language: string;
  description: string;
  stars: string;
  forks: string;
  pull_requests: string;
  pushes: string;
  total_score: string;
  contributor_logins: string;
  collection_names: string;
  existsInDB: boolean;
}

async function ossinsightHandler(_request: NextRequest) {
  try {
    // Fetch OSS Insight trending repositories
    const response = await fetch("https://api.ossinsight.io/v1/trends/repos", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    const repositories: OSSInsightRepository[] = apiResponse.data.rows;
    const scrapedRepos: Array<{
      href: string;
      url: string;
      name: string;
      existsInDB?: boolean;
    }> = [];

    repositories.sort((a, b) => parseInt(b.stars) - parseInt(a.stars));

    repositories
      .filter(({ stars }) => parseInt(stars) > 50)
      .forEach((repo) => {
        // Validate and clean repository path
        const cleanRepoName = validateRepositoryPath(repo.repo_name);

        if (cleanRepoName) {
          scrapedRepos.push({
            href: cleanRepoName,
            url: `https://github.com/${cleanRepoName}`,
            name: cleanRepoName,
          });
        }
      });

    // Check which repositories already exist in the database
    const existingRepos = await db
      .select({ repository: repositoriesTable.repository })
      .from(repositoriesTable)
      .where(
        inArray(
          repositoriesTable.repository,
          scrapedRepos.map((repo) => repo.href)
        )
      );

    const existingHrefs = new Set(
      existingRepos.map((repo) => repo.repository).filter(Boolean)
    );

    const bracket: Array<{
      href: string;
      url: string;
      name: string;
      existsInDB?: boolean;
    }> = [];

    // Add database status to each repository
    scrapedRepos.forEach((repo) => {
      bracket.push({
        ...repo,
        existsInDB: existingHrefs.has(repo.href),
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: bracket.filter((repo) => !repo.existsInDB).slice(0, 50).length,
        repositories: bracket.filter((repo) => !repo.existsInDB).slice(0, 50),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
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

// Apply security middleware - scraping endpoints require API key
export const GET = withApiMiddleware(
  ossinsightHandler,
  middlewareConfigs.scraping
);
