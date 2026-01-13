import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { count, sum, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

export const revalidate = 600; // Revalidate every 10 minutes

async function statsHandler(_request: NextRequest) {
  try {
    const totalReposResult = await db
      .select({ count: count() })
      .from(repositoriesTable)
      .where(sql`${repositoriesTable.publish} = true`);

    const totalStarsResult = await db
      .select({ stars: sum(repositoriesTable.stars) })
      .from(repositoriesTable)
      .where(sql`${repositoriesTable.publish} = true`);

    const languagesResult = await db
      .select({ languages: repositoriesTable.languages })
      .from(repositoriesTable)
      .where(sql`${repositoriesTable.publish} = true`);

    const languageSet = new Set<string>();
    languagesResult.forEach((repo) => {
      if (repo.languages) {
        repo.languages.split(",").forEach((lang) => {
          const trimmedLang = lang.trim();
          if (trimmedLang) {
            languageSet.add(trimmedLang);
          }
        });
      }
    });

    const stats = {
      totalRepos: totalReposResult[0]?.count || 0,
      totalStars: parseInt(totalStarsResult[0]?.stars || "0", 10),
      totalLanguages: languageSet.size,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withApiMiddleware(statsHandler, middlewareConfigs.stats);
