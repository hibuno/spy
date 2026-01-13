import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { repositoriesTable, type SelectRepository } from "@/db/schema";
import { eq, desc, asc, or, ilike, and, notInArray } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

async function repositoriesHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");
    const language = searchParams.get("language");
    const experience = searchParams.get("experience");
    const license = searchParams.get("license");

    const offset = (page - 1) * limit;

    // Get recommended repositories to exclude from main list
    const { data: recommendedData } = await supabase.rpc(
      "get_recommended_repos",
      {
        min_stars: 50,
        max_stars: 1000,
        limit_count: 12,
      }
    );
    const recommendedIds = recommendedData
      ? recommendedData.map((repo: SelectRepository) => repo.id)
      : [];

    // Build where conditions
    const conditions = [eq(repositoriesTable.publish, true)];

    // Exclude recommended repositories to avoid duplicates
    if (recommendedIds.length > 0) {
      conditions.push(notInArray(repositoriesTable.id, recommendedIds));
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(repositoriesTable.summary, searchTerm),
          ilike(repositoriesTable.repository, searchTerm),
          ilike(repositoriesTable.languages, searchTerm),
          ilike(repositoriesTable.tags, searchTerm)
        )!
      );
    }

    // Apply language filter
    if (language) {
      conditions.push(ilike(repositoriesTable.languages, `%${language}%`));
    }

    // Apply experience filter
    if (experience) {
      conditions.push(ilike(repositoriesTable.experience, `%${experience}%`));
    }

    if (license) {
      conditions.push(ilike(repositoriesTable.license, `%${license}%`));
    }

    // Build the final where clause
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Build and execute query with sorting and pagination
    let repositories;

    if (sortBy === "created_at") {
      repositories =
        sortOrder === "asc"
          ? await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(asc(repositoriesTable.created_at))
              .limit(limit)
              .offset(offset)
          : await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(desc(repositoriesTable.created_at))
              .limit(limit)
              .offset(offset);
    } else if (sortBy === "stars") {
      repositories =
        sortOrder === "asc"
          ? await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(asc(repositoriesTable.stars))
              .limit(limit)
              .offset(offset)
          : await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(desc(repositoriesTable.stars))
              .limit(limit)
              .offset(offset);
    } else if (sortBy === "forks") {
      repositories =
        sortOrder === "asc"
          ? await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(asc(repositoriesTable.forks))
              .limit(limit)
              .offset(offset)
          : await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(desc(repositoriesTable.forks))
              .limit(limit)
              .offset(offset);
    } else if (sortBy === "updated_at") {
      repositories =
        sortOrder === "asc"
          ? await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(asc(repositoriesTable.updated_at))
              .limit(limit)
              .offset(offset)
          : await db
              .select()
              .from(repositoriesTable)
              .where(whereClause)
              .orderBy(desc(repositoriesTable.updated_at))
              .limit(limit)
              .offset(offset);
    } else {
      repositories = await db
        .select()
        .from(repositoriesTable)
        .where(whereClause)
        .orderBy(desc(repositoriesTable.created_at))
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json({
      success: true,
      repositories,
      page,
      limit,
      hasMore: repositories.length === limit,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withApiMiddleware(
  repositoriesHandler,
  middlewareConfigs.search
);
