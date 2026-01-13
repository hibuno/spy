import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

interface ScrapedPaper {
  href: string;
  url: string;
  title: string;
  thumbnail: string;
  upvotes: number;
  authors: string[];
  authorCount: number;
  githubCount: number;
  commentCount: number;
  submittedBy: string;
  existsInDB: boolean;
}

async function paperHandler(_request: NextRequest) {
  try {
    // Fetch Hugging Face papers page for specific date
    const targetYearMonth = new Date(
      Date.UTC(new Date().getFullYear(), new Date().getMonth())
    )
      .toISOString()
      .slice(0, 7); // current year and month in UTC
    const response = await fetch(
      `https://huggingface.co/papers/month/${targetYearMonth}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML with jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Select all article elements in the papers section
    const articleElements = document.querySelectorAll("main section article");

    const papers: ScrapedPaper[] = [];

    // First, collect all paper data
    const scrapedPapers: Array<Omit<ScrapedPaper, "existsInDB">> = [];

    articleElements.forEach((article) => {
      try {
        // Get the main paper link and href
        const mainLink = article.querySelector('a[href*="/papers/"]');
        const href = mainLink?.getAttribute("href") || "";

        if (!href) return; // Skip if no valid href found

        // Extract thumbnail
        const thumbnailImg = article.querySelector(
          'img[src*="social-thumbnails"]'
        );
        const thumbnail = thumbnailImg?.getAttribute("src") || "";

        // Extract title
        const titleElement = article.querySelector("h3 a");
        const title = titleElement?.textContent?.trim() || "N/A";

        // Extract upvotes
        const upvoteElement = article.querySelector(
          ".flex.items-center.flex-col .leading-none"
        );
        const upvotes =
          parseInt(upvoteElement?.textContent?.trim() || "0") || 0;

        // Extract submitted by information
        let submittedBy = "N/A";

        // Look for "Submitted by" text
        const submittedByContainer = Array.from(
          article.querySelectorAll("*")
        ).find((el) => el.textContent?.includes("Submitted by"));
        if (submittedByContainer) {
          const submittedByText = submittedByContainer.textContent || "";
          const match = submittedByText.match(/Submitted by\s+(\w+)/);
          submittedBy = match ? match[1] : "N/A";
        }

        // Extract authors from the avatar list
        const authorAvatars = article.querySelectorAll("ul li[title]");
        const authors: string[] = [];
        let authorCount = 0;

        authorAvatars.forEach((avatar) => {
          const authorName = avatar.getAttribute("title");
          if (authorName) {
            authors.push(authorName);
          }
        });

        // Check for "X authors" text
        const authorCountText =
          Array.from(article.querySelectorAll("*")).find((el) =>
            el.textContent?.includes("authors")
          )?.textContent || "";

        const authorCountMatch = authorCountText.match(/(\d+)\s+authors/);
        authorCount = authorCountMatch
          ? parseInt(authorCountMatch[1])
          : authors.length;

        // Extract GitHub count (first metric)
        const metricElements = article.querySelectorAll(
          ".flex.items-center.gap-2 a span, .flex.items-center.gap-2 span"
        );
        let githubCount = 0;
        let commentCount = 0;

        if (metricElements.length >= 1) {
          githubCount =
            parseInt(metricElements[0]?.textContent?.trim() || "0") || 0;
        }

        // Extract comment count (look for the blue-colored element which typically indicates comments)
        const commentElement = article.querySelector(
          '[class*="text-blue-500"], [class*="bg-blue-600"]'
        );
        if (commentElement) {
          const commentText = commentElement.textContent?.trim() || "0";
          commentCount = parseInt(commentText) || 0;
        } else if (metricElements.length >= 2) {
          commentCount =
            parseInt(metricElements[1]?.textContent?.trim() || "0") || 0;
        }

        scrapedPapers.push({
          href: href.replace(/^\//, ""),
          url: `https://huggingface.co${href}`,
          title,
          thumbnail,
          upvotes,
          authors,
          authorCount,
          githubCount,
          commentCount,
          submittedBy,
        });
      } catch (error) {
        console.warn("Error parsing article:", error);
        // Continue with next article
      }
    });

    // Check which repositories already exist in the database
    const existingPapers = await db
      .select({ huggingface_url: repositoriesTable.huggingface_url })
      .from(repositoriesTable)
      .where(
        inArray(
          repositoriesTable.huggingface_url,
          scrapedPapers.map((paper) => paper.url)
        )
      );

    const existingHrefs = new Set(
      existingPapers.map((paper) => paper.huggingface_url).filter(Boolean)
    );

    // Add database status to each paper
    scrapedPapers.forEach((paper) => {
      papers.push({
        ...paper,
        existsInDB: existingHrefs.has(paper.url),
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        date: targetYearMonth,
        count: papers.filter((paper) => !paper.existsInDB).length,
        totalScraped: papers.length,
        papers: papers.filter((paper) => !paper.existsInDB), // Return only new papers
        allPapers: papers, // Include all papers for debugging
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
export const GET = withApiMiddleware(paperHandler, middlewareConfigs.scraping);
