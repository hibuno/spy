import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { validateRepositoryPath } from "@/lib/utils";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";

interface ScrapedPaperDetail {
  title: string;
  abstract: string;
  aiSummary?: string;
  publishDate: string;
  submittedDate: string;
  paperOfTheDay?: string;
  authors: Array<{
    name: string;
    profileUrl?: string;
    avatarUrl?: string;
  }>;
  arxivId: string;
  urls: {
    arxiv?: string;
    pdf?: string;
    projectPage?: string;
    github?: string;
  };
  githubStars?: number;
  upvotes: number;
}

async function paperDetailHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperUrl = searchParams.get("url");

    if (!paperUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Paper URL parameter is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Ensure it's a valid Hugging Face paper URL
    let fullUrl = paperUrl;
    if (paperUrl.startsWith("/papers/")) {
      fullUrl = `https://huggingface.co${paperUrl}`;
    } else if (!paperUrl.startsWith("https://huggingface.co/papers/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Hugging Face paper URL",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Fetch the paper detail page
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const paperDetail: ScrapedPaperDetail = {
      title: "",
      abstract: "",
      publishDate: "",
      submittedDate: "",
      authors: [],
      arxivId: "",
      urls: {},
      upvotes: 0,
    };

    // Extract title
    const titleElement = $("h1");
    // Clean up title
    paperDetail.title = (titleElement.text()?.trim() || "N/A").replace(
      /\s+/g,
      " "
    );

    // Extract ArXiv ID
    const arxivElement = $("*").filter((_, el) =>
      $(el).text().includes("arxiv:")
    );
    if (arxivElement.length > 0) {
      const arxivMatch = arxivElement
        .first()
        .text()
        ?.match(/arxiv:(\d+\.\d+)/);
      paperDetail.arxivId = arxivMatch ? arxivMatch[1] : "";
    }

    // Extract publish and submitted dates
    const dateElements = $(".mb-6, .text-gray-500");
    dateElements.each((_, element) => {
      const text = $(element).text()?.trim().replace(/\s+/g, " ") || "";

      // Extract publish date
      const publishMatch = text.match(/publish on\s+([A-Za-z]+\s+\d+)/);
      if (publishMatch) {
        paperDetail.publishDate = publishMatch[1];
      }

      // Extract submitted date
      const submittedMatch = text.match(/on\s+(Aug \d+|[A-Za-z]+ \d+)/);
      if (submittedMatch) {
        paperDetail.submittedDate = submittedMatch[1];
      }
    });

    // Extract "Paper of the day" badge
    const paperOfDayElement = $(".text-blue-500").filter((_, el) =>
      $(el).text().includes("Paper of the day")
    );
    if (paperOfDayElement.length > 0) {
      paperDetail.paperOfTheDay = paperOfDayElement.first().text()?.trim();
    }

    // Extract upvotes
    const upvoteElement = $(
      ".font-semibold.text-orange-500, .text-orange-500"
    ).first();
    if (upvoteElement.length > 0) {
      paperDetail.upvotes = parseInt(upvoteElement.text()?.trim() || "0") || 0;
    }

    // Extract authors
    const authorElements = $(".author, span.author");
    authorElements.each((_, authorEl) => {
      const $authorEl = $(authorEl);
      const nameElement = $authorEl.find("a, button").first();
      const avatarElement = $authorEl.find("img").first();

      if (nameElement.length > 0) {
        const author = {
          name: nameElement.text()?.trim() || "N/A",
          profileUrl: nameElement.attr("href") || undefined,
          avatarUrl: avatarElement.attr("src") || undefined,
        };
        paperDetail.authors.push(author);
      }
    });

    // If no authors found with .author class, try alternative approach
    if (paperDetail.authors.length === 0) {
      const authorsSection = $("*").filter((_, el) =>
        $(el).text().includes("Authors:")
      );

      if (authorsSection.length > 0) {
        const authorLinks = authorsSection
          .first()
          .parent()
          .find('a[href*="/"]');
        authorLinks.each((_, link) => {
          const $link = $(link);
          const img = $link.find("img");
          paperDetail.authors.push({
            name: $link.text()?.trim() || "N/A",
            profileUrl: $link.attr("href") || undefined,
            avatarUrl: img.attr("src") || undefined,
          });
        });
      }
    }

    // Extract abstract and AI summary
    const abstractSection = $("h2").filter((_, h2) =>
      $(h2).text().includes("Abstract")
    );

    if (abstractSection.length > 0) {
      const abstractContainer = abstractSection.first().parent();

      // Extract AI summary (blue box)
      const aiSummaryElement = abstractContainer.find(
        '[class*="bg-blue-"], [class*="border-blue-"]'
      );
      if (aiSummaryElement.length > 0) {
        const summaryText = aiSummaryElement.find("p");
        paperDetail.aiSummary = summaryText.text()?.trim().replace(/\s+/g, " ");
      }

      // Extract main abstract (gray text paragraph)
      const abstractElement = abstractContainer.find(
        ".text-gray-600, p.text-gray-600"
      );
      if (abstractElement.length > 0) {
        paperDetail.abstract =
          abstractElement.text()?.trim().replace(/\s+/g, " ") || "N/A";
      }
    }

    // Extract URLs from buttons/links
    const linkElements = $("a[href]");
    linkElements.each((_, link) => {
      const $link = $(link);
      const href = $link.attr("href") || "";
      const text = $link.text()?.toLowerCase() || "";

      if (href.includes("arxiv.org/abs/")) {
        paperDetail.urls.arxiv = href;
      } else if (href.includes("arxiv.org/pdf/")) {
        paperDetail.urls.pdf = href;
      } else if (text.includes("project page") || text.includes("home page")) {
        paperDetail.urls.projectPage = href;
      } else if (href.includes("github.com") && text.includes("github")) {
        // Clean and validate the GitHub repository path
        const cleanRepoPath = validateRepositoryPath(href);
        if (cleanRepoPath) {
          paperDetail.urls.github = cleanRepoPath;

          // Extract GitHub stars
          const starsElement = $link.find("span");
          if (starsElement.length > 0) {
            paperDetail.githubStars =
              parseInt(starsElement.text()?.trim() || "0") || 0;
          }
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: fullUrl,
        paper: paperDetail,
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
  paperDetailHandler,
  middlewareConfigs.scraping
);
