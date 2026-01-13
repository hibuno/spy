import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { validateRepositoryPath } from "@/lib/utils";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

interface ScrapedRepository {
  href: string;
  url: string;
  name: string;
  existsInDB: boolean;
}

async function trendingHandler(_request: NextRequest) {
  try {
    // Fetch GitHub trending page
    const response = await fetch("https://github.com/trending", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML with jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Select h2 elements with class "h3 lh-condensed"
    const h2Elements = document.querySelectorAll("h2.h3.lh-condensed");

    const repositories: ScrapedRepository[] = [];

    // First, collect all repository hrefs
    const scrapedRepos: Array<{ href: string; url: string; name: string }> = [];

    h2Elements.forEach((h2) => {
      // Find the anchor tag within the h2
      const anchor = h2.querySelector("a[href]");
      if (anchor) {
        const href = anchor.getAttribute("href");
        const repoName = anchor?.textContent?.trim().replace(/\s+/g, " ");

        if (href) {
          // Validate and clean repository path
          const cleanHref = validateRepositoryPath(href);

          if (cleanHref) {
            scrapedRepos.push({
              href: cleanHref,
              url: `https://github.com/${cleanHref}`,
              name: repoName || "N/A",
            });
          }
        }
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

    // Add database status to each repository
    scrapedRepos.forEach((repo) => {
      repositories.push({
        ...repo,
        existsInDB: existingHrefs.has(repo.href),
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: repositories.filter((repo) => !repo.existsInDB).length,
        repositories: repositories.filter((repo) => !repo.existsInDB),
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
  trendingHandler,
  middlewareConfigs.scraping
);
