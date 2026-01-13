import * as cheerio from "cheerio";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { validateRepositoryPath } from "@/lib/utils";

export interface TrendingRepository {
  href: string;
  url: string;
  name: string;
  existsInDB: boolean;
}

export async function fetchTrendingRepositories(): Promise<
  TrendingRepository[]
> {
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

  // Parse HTML with cheerio
  const $ = cheerio.load(html);

  // Select h2 elements with class "h3 lh-condensed"
  const h2Elements = $("h2.h3.lh-condensed");

  const repositories: TrendingRepository[] = [];

  // First, collect all repository hrefs
  const scrapedRepos: Array<{ href: string; url: string; name: string }> = [];

  h2Elements.each((_, h2) => {
    // Find the anchor tag within the h2
    const anchor = $(h2).find("a[href]");
    if (anchor.length > 0) {
      const href = anchor.attr("href");
      const repoName = anchor.text()?.trim().replace(/\s+/g, " ");

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

  return repositories;
}
