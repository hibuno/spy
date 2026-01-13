import * as cheerio from "cheerio";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { inArray } from "drizzle-orm";

export interface PaperRepository {
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

export async function fetchPaperRepositories(): Promise<PaperRepository[]> {
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

  // Parse HTML with cheerio
  const $ = cheerio.load(html);

  // Select all article elements in the papers section
  const articleElements = $("main section article");

  const papers: PaperRepository[] = [];

  // First, collect all paper data
  const scrapedPapers: Array<Omit<PaperRepository, "existsInDB">> = [];

  articleElements.each((_, article) => {
    try {
      const $article = $(article);

      // Get the main paper link and href
      const mainLink = $article.find('a[href*="/papers/"]');
      const href = mainLink.attr("href") || "";

      if (!href) return; // Skip if no valid href found

      // Extract thumbnail
      const thumbnailImg = $article.find('img[src*="social-thumbnails"]');
      const thumbnail = thumbnailImg.attr("src") || "";

      // Extract title
      const titleElement = $article.find("h3 a");
      const title = titleElement.text()?.trim() || "N/A";

      // Extract upvotes
      const upvoteElement = $article.find(
        ".flex.items-center.flex-col .leading-none"
      );
      const upvotes = parseInt(upvoteElement.text()?.trim() || "0") || 0;

      // Extract submitted by information
      let submittedBy = "N/A";

      // Look for "Submitted by" text
      const submittedByContainer = $article
        .find("*")
        .filter((_, el) => $(el).text().includes("Submitted by"));
      if (submittedByContainer.length > 0) {
        const submittedByText = submittedByContainer.first().text() || "";
        const match = submittedByText.match(/Submitted by\s+(\w+)/);
        submittedBy = match ? match[1] : "N/A";
      }

      // Extract authors from the avatar list
      const authorAvatars = $article.find("ul li[title]");
      const authors: string[] = [];
      let authorCount = 0;

      authorAvatars.each((_, avatar) => {
        const authorName = $(avatar).attr("title");
        if (authorName) {
          authors.push(authorName);
        }
      });

      // Check for "X authors" text
      const authorCountText =
        $article
          .find("*")
          .filter((_, el) => $(el).text().includes("authors"))
          .first()
          .text() || "";

      const authorCountMatch = authorCountText.match(/(\d+)\s+authors/);
      authorCount = authorCountMatch
        ? parseInt(authorCountMatch[1])
        : authors.length;

      // Extract GitHub count (first metric)
      const metricElements = $article.find(
        ".flex.items-center.gap-2 a span, .flex.items-center.gap-2 span"
      );
      let githubCount = 0;
      let commentCount = 0;

      if (metricElements.length >= 1) {
        githubCount = parseInt($(metricElements[0]).text()?.trim() || "0") || 0;
      }

      // Extract comment count (look for the blue-colored element which typically indicates comments)
      const commentElement = $article.find(
        '[class*="text-blue-500"], [class*="bg-blue-600"]'
      );
      if (commentElement.length > 0) {
        const commentText = commentElement.first().text()?.trim() || "0";
        commentCount = parseInt(commentText) || 0;
      } else if (metricElements.length >= 2) {
        commentCount =
          parseInt($(metricElements[1]).text()?.trim() || "0") || 0;
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

  return papers;
}
