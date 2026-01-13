import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
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
    const dom = new JSDOM(html);
    const document = dom.window.document;

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
    const titleElement = document.querySelector("h1");
    // Clean up title
    paperDetail.title = (titleElement?.textContent?.trim() || "N/A").replace(
      /\s+/g,
      " "
    );

    // Extract ArXiv ID
    const arxivElement = Array.from(document.querySelectorAll("*")).find((el) =>
      el.textContent?.includes("arxiv:")
    );
    if (arxivElement) {
      const arxivMatch = arxivElement.textContent?.match(/arxiv:(\d+\.\d+)/);
      paperDetail.arxivId = arxivMatch ? arxivMatch[1] : "";
    }

    // Extract publish and submitted dates
    const dateElements = document.querySelectorAll(".mb-6, .text-gray-500");
    dateElements.forEach((element) => {
      const text = element.textContent?.trim().replace(/\s+/g, " ") || "";

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
    const paperOfDayElement = Array.from(
      document.querySelectorAll(".text-blue-500")
    ).find((el) => el.textContent?.includes("Paper of the day"));
    if (paperOfDayElement) {
      paperDetail.paperOfTheDay = paperOfDayElement.textContent?.trim();
    }

    // Extract upvotes
    const upvoteElement =
      document.querySelector(".font-semibold.text-orange-500") ||
      document.querySelector(".text-orange-500");
    if (upvoteElement) {
      paperDetail.upvotes =
        parseInt(upvoteElement.textContent?.trim() || "0") || 0;
    }

    // Extract authors
    const authorElements = document.querySelectorAll(".author, span.author");
    authorElements.forEach((authorEl) => {
      const nameElement =
        authorEl.querySelector("a") || authorEl.querySelector("button");
      const avatarElement = authorEl.querySelector("img");

      if (nameElement) {
        const author = {
          name: nameElement.textContent?.trim() || "N/A",
          profileUrl: nameElement.getAttribute("href") || undefined,
          avatarUrl: avatarElement?.getAttribute("src") || undefined,
        };
        paperDetail.authors.push(author);
      }
    });

    // If no authors found with .author class, try alternative approach
    if (paperDetail.authors.length === 0) {
      const authorsSection = Array.from(document.querySelectorAll("*")).find(
        (el) => el.textContent?.includes("Authors:")
      );

      if (authorsSection) {
        const authorLinks =
          authorsSection.parentElement?.querySelectorAll('a[href*="/"]') || [];
        authorLinks.forEach((link) => {
          const img = link.querySelector("img");
          paperDetail.authors.push({
            name: link.textContent?.trim() || "N/A",
            profileUrl: link.getAttribute("href") || undefined,
            avatarUrl: img?.getAttribute("src") || undefined,
          });
        });
      }
    }

    // Extract abstract and AI summary
    const abstractSection = Array.from(document.querySelectorAll("h2")).find(
      (h2) => h2.textContent?.includes("Abstract")
    );

    if (abstractSection) {
      const abstractContainer = abstractSection.parentElement;

      // Extract AI summary (blue box)
      const aiSummaryElement = abstractContainer?.querySelector(
        '[class*="bg-blue-"], [class*="border-blue-"]'
      );
      if (aiSummaryElement) {
        const summaryText = aiSummaryElement.querySelector("p");
        paperDetail.aiSummary = summaryText?.textContent
          ?.trim()
          .replace(/\s+/g, " ");
      }

      // Extract main abstract (gray text paragraph)
      const abstractElement = abstractContainer?.querySelector(
        ".text-gray-600, p.text-gray-600"
      );
      if (abstractElement) {
        paperDetail.abstract =
          abstractElement.textContent?.trim().replace(/\s+/g, " ") || "N/A";
      }
    }

    // Extract URLs from buttons/links
    const linkElements = document.querySelectorAll("a[href]");
    linkElements.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const text = link.textContent?.toLowerCase() || "";

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
          const starsElement = link.querySelector("span");
          if (starsElement) {
            paperDetail.githubStars =
              parseInt(starsElement.textContent?.trim() || "0") || 0;
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
