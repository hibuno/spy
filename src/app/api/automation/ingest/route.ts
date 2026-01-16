import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";
import { fetchOSSInsightRepositories } from "@/services/ossinsight-service";
import { fetchPaperRepositories } from "@/services/paper-service";
import { fetchTrendingRepositories } from "@/services/trending-service";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import {
  fetchGitHubRepository,
  fetchGitHubReadme,
  fetchGitHubLanguages,
  parseRepositoryPath,
} from "@/services/github-service";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || "";

interface ImageItem {
  url: string;
  type?: string;
  width?: number;
  height?: number;
}

/**
 * Extract homepage URL from README content
 */
function extractHomepageFromReadme(readmeContent: string): string | null {
  try {
    // Keywords to search for homepage links
    const homepageKeywords = [
      "website",
      "demo",
      "live demo",
      "preview",
      "live preview",
      "deployed",
      "production",
      "app",
      "application",
      "site",
      "view live",
      "see live",
      "check it out",
      "visit",
      "homepage",
    ];

    // Split content into lines for analysis
    const lines = readmeContent.split("\n");

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Check if line contains any homepage keywords
      const hasHomepageKeyword = homepageKeywords.some((keyword) =>
        lowerLine.includes(keyword)
      );

      if (hasHomepageKeyword) {
        // Extract URLs from the line using regex
        const urlRegex = /https?:\/\/[^\s\)]+/gi;
        const urls = line.match(urlRegex);

        if (urls && urls.length > 0) {
          // Return the first valid URL found
          for (const url of urls) {
            // Clean up URL (remove trailing punctuation)
            const cleanUrl = url.replace(/[.,;:!\?\)]+$/, "");

            // Skip GitHub URLs and other common non-homepage URLs
            if (
              !cleanUrl.includes("github.com") &&
              !cleanUrl.includes("linkedin.com") &&
              !cleanUrl.includes("twitter.com") &&
              !cleanUrl.includes("facebook.com") &&
              !cleanUrl.includes("instagram.com")
            ) {
              console.log(`🔗 Found potential homepage in README: ${cleanUrl}`);
              return cleanUrl;
            }
          }
        }
      }
    }

    // Also check for markdown link patterns like [Demo](url) or [Website](url)
    const markdownLinkRegex =
      /\[([^\]]*(?:website|demo|live|preview|app|site|deployed)[^\]]*)\]\(([^)]+)\)/gi;
    let match;

    while ((match = markdownLinkRegex.exec(readmeContent)) !== null) {
      const url = match[2].trim();

      // Skip GitHub URLs
      if (!url.includes("github.com")) {
        console.log(`🔗 Found homepage via markdown link: ${url}`);
        return url;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error extracting homepage from README:", error);
    return null;
  }
}

/**
 * Extract and validate images from README
 */
async function extractImagesFromReadme(
  readmeContent: string,
  repoUrl: string
): Promise<ImageItem[]> {
  const images: ImageItem[] = [];

  try {
    // Match markdown images: ![alt](url)
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = markdownImageRegex.exec(readmeContent)) !== null) {
      const imageUrl = match[2];
      const imageItem = await processImageUrl(imageUrl, repoUrl, "readme");
      if (imageItem) {
        images.push(imageItem);
      }
    }

    // Also extract images from HTML img tags
    const imgTagRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;

    while ((match = imgTagRegex.exec(readmeContent)) !== null) {
      const imageUrl = match[1];
      const imageItem = await processImageUrl(imageUrl, repoUrl, "html");
      if (imageItem) {
        images.push(imageItem);
      }
    }
  } catch (error) {
    console.error("Error parsing README for images:", error);
  }

  // Remove duplicates based on URL
  const uniqueImages = images.filter(
    (image, index, self) => index === self.findIndex((i) => i.url === image.url)
  );

  return uniqueImages;
}

/**
 * Process and validate image URL
 */
async function processImageUrl(
  imageUrl: string,
  repoUrl: string,
  type: string
): Promise<ImageItem | null> {
  try {
    // Skip obviously invalid URLs
    if (!imageUrl || imageUrl.trim() === "" || imageUrl === "#") {
      return null;
    }

    // Convert relative URLs to absolute
    let absoluteUrl = imageUrl;
    if (imageUrl.startsWith("./") || imageUrl.startsWith("../")) {
      absoluteUrl = `${repoUrl}/raw/main/${imageUrl.replace("./", "")}`;
    } else if (imageUrl.startsWith("/")) {
      absoluteUrl = `${repoUrl}${imageUrl}`;
    } else if (!imageUrl.startsWith("http")) {
      absoluteUrl = `${repoUrl}/raw/main/${imageUrl}`;
    }

    // Validate URL format
    try {
      new URL(absoluteUrl);
    } catch {
      console.log(`Invalid URL format: ${absoluteUrl}`);
      return null;
    }

    // Skip common non-image URLs
    const skipPatterns = [
      /\.svg$/i, // SVGs often cause issues
      /badge/i, // Badge images
      /shield/i, // Shield badges
      /star-history/i, // Star history images
      /githubusercontent\.com.*\?.*size/, // GitHub avatar with size param
    ];

    if (skipPatterns.some((pattern) => pattern.test(absoluteUrl))) {
      return null;
    }

    const dimensions = await getImageDimensions(absoluteUrl);

    if (dimensions && isValidImage(dimensions.width, dimensions.height)) {
      return {
        url: absoluteUrl,
        width: dimensions.width,
        height: dimensions.height,
        type: type,
      };
    }

    return null;
  } catch (error) {
    console.error("Error processing image URL:", imageUrl, error);
    return null;
  }
}

/**
 * Get image dimensions from URL
 */
async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();

    // Check if buffer has content
    if (buffer.byteLength === 0) {
      console.log(`Empty buffer for image: ${imageUrl}`);
      return null;
    }

    // Check content type from response headers
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      console.log(
        `Invalid content type for image: ${contentType} - ${imageUrl}`
      );
      return null;
    }

    // Simple dimension extraction from image headers
    // For production, consider using a library like image-size
    // For now, return default dimensions for valid images
    return {
      width: 800,
      height: 600,
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return null;
  }
}

/**
 * Validate image dimensions
 */
function isValidImage(width: number, height: number): boolean {
  const minWidth = 200;
  const minHeight = 150;
  return width >= minWidth && height >= minHeight;
}

/**
 * Take screenshot of URL using Browserless API
 */
async function takeScreenshot(
  url: string,
  maxRetries: number = 3
): Promise<Buffer | null> {
  if (!BROWSERLESS_API_KEY) {
    console.warn("BROWSERLESS_API_KEY not set, skipping screenshot generation");
    return null;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📸 Taking screenshot of: ${url} (attempt ${attempt}/${maxRetries})`
      );

      const response = await fetch(
        `https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url,
            options: {
              fullPage: false,
              type: "png",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Browserless API error: ${response.status} - ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(
        `✅ Screenshot captured successfully (${buffer.length} bytes)`
      );
      return buffer;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Screenshot attempt ${attempt} failed:`, error);

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000; // Progressive backoff
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(
    `❌ All ${maxRetries} screenshot attempts failed for ${url}. Last error:`,
    lastError
  );
  return null;
}

/**
 * Upload screenshot to Supabase storage
 */
async function uploadToSupabaseStorage(
  buffer: Buffer,
  fileName: string
): Promise<string | null> {
  try {
    console.log(`📤 Uploading screenshot to Supabase storage: ${fileName}`);

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { error } = await supabaseClient.storage
      .from("images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("❌ Error uploading to Supabase:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from("images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ Error uploading screenshot:", error);
    return null;
  }
}

async function ingestHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository ingestion...");

    let totalNewRepos = 0;
    let addedCount = 0;
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const sources = [
      { name: "ossinsight", fetcher: fetchOSSInsightRepositories },
      { name: "paper", fetcher: fetchPaperRepositories },
      { name: "trending", fetcher: fetchTrendingRepositories },
    ];
    const MAX_REPOS_PER_HOUR = 20;

    // Collect all new repositories from all sources first
    const allNewRepos: any[] = [];

    // Fetch new repositories from all scraping services directly
    for (const { name: source, fetcher } of sources) {
      try {
        console.log(`� Fetching repositories from ${source}...`);

        // Call service directly instead of making HTTP request
        const repositories = await fetcher();

        // Handle different response formats from different services
        let newRepos = [];
        if (source === "paper") {
          // Paper service returns papers with different structure
          newRepos = repositories
            .filter((paper: any) => !paper.existsInDB)
            .map((paper: any) => ({
              href: paper.url, // Paper uses 'url' as the repository identifier
              url: paper.url,
              name: paper.url,
              title: paper.title,
              authors: paper.authors,
              thumbnail: paper.thumbnail,
              source: source,
            }));
        } else {
          // OSS Insight and Trending services return repositories array
          newRepos = repositories
            .filter((repo: any) => !repo.existsInDB)
            .map((repo: any) => ({
              ...repo,
              source: source,
            }));
        }

        console.log(
          `📋 Found ${newRepos.length} new repositories from ${source}`
        );
        totalNewRepos += newRepos.length;
        allNewRepos.push(...newRepos);

        // Add delay between different sources
        if (source !== sources[sources.length - 1].name) {
          console.log(`⏳ Waiting before fetching from next source...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error fetching from ${source}:`, error);
        errors.push(
          `${source}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        continue;
      }
    }

    // Limit to MAX_REPOS_PER_HOUR and prioritize by source
    const limitedRepos = allNewRepos.slice(0, MAX_REPOS_PER_HOUR);
    console.log(
      `🎯 Processing ${limitedRepos.length} repositories (limited from ${totalNewRepos} total)`
    );

    // Add repositories to database and process them with full GitHub data
    for (let i = 0; i < limitedRepos.length; i++) {
      const repo = limitedRepos[i];

      try {
        console.log(
          `➕ Adding & Processing ${i + 1}/${limitedRepos.length}: ${
            repo.name || repo.href
          } (from ${repo.source})`
        );

        const repositoryPath = repo.href || repo.name;

        // Parse repository path
        const parsed = parseRepositoryPath(repositoryPath);

        if (!parsed) {
          console.warn(`Could not parse repository path: ${repositoryPath}`);
          // Create minimal record without GitHub data
          const repoRecord = {
            id: crypto.randomUUID(),
            repository: repositoryPath,
            summary: repo.description || repo.title || null,
            content: null,
            languages: null,
            experience: null,
            usability: null,
            deployment: null,
            stars: repo.stars ? parseInt(repo.stars) : null,
            forks: repo.forks ? parseInt(repo.forks) : null,
            watching: null,
            license: null,
            homepage: repo.url || null,
            images: [],
            created_at: new Date(),
            updated_at: new Date(),
            archived: false,
            disabled: false,
            open_issues: null,
            default_branch: "main",
            network_count: null,
            tags: null,
            arxiv_url: null,
            huggingface_url: repo.source === "paper" ? repo.url : null,
            paper_authors: repo.authors ? JSON.stringify(repo.authors) : null,
            paper_abstract: null,
            paper_scraped_at: repo.source === "paper" ? new Date() : null,
            readme: null,
            publish: false,
            ingested: true,
            enriched: false,
          };

          await db
            .insert(repositoriesTable)
            .values(repoRecord)
            .onConflictDoNothing();
          addedCount++;
          continue;
        }

        const { owner, repo: repoName } = parsed;

        // Fetch GitHub data
        const [githubRepo, readme, languages] = await Promise.all([
          fetchGitHubRepository(owner, repoName),
          fetchGitHubReadme(owner, repoName),
          fetchGitHubLanguages(owner, repoName),
        ]);

        if (!githubRepo) {
          console.warn(`GitHub repository not found: ${owner}/${repoName}`);
          // Create minimal record without GitHub data
          const repoRecord = {
            id: crypto.randomUUID(),
            repository: repositoryPath,
            summary: repo.description || repo.title || null,
            content: null,
            languages: null,
            experience: null,
            usability: null,
            deployment: null,
            stars: repo.stars ? parseInt(repo.stars) : null,
            forks: repo.forks ? parseInt(repo.forks) : null,
            watching: null,
            license: null,
            homepage: repo.url || null,
            images: [],
            created_at: new Date(),
            updated_at: new Date(),
            archived: false,
            disabled: false,
            open_issues: null,
            default_branch: "main",
            network_count: null,
            tags: null,
            arxiv_url: null,
            huggingface_url: repo.source === "paper" ? repo.url : null,
            paper_authors: repo.authors ? JSON.stringify(repo.authors) : null,
            paper_abstract: null,
            paper_scraped_at: repo.source === "paper" ? new Date() : null,
            readme: null,
            publish: false,
            ingested: true,
            enriched: false,
          };

          await db
            .insert(repositoriesTable)
            .values(repoRecord)
            .onConflictDoNothing();
          addedCount++;
          continue;
        }

        // Extract images from README if available
        let readmeImages: ImageItem[] = [];
        if (readme) {
          try {
            const repoUrl = `https://github.com/${repositoryPath}`;
            readmeImages = await extractImagesFromReadme(readme, repoUrl);
            console.log(`🖼️  Found ${readmeImages.length} images in README`);
          } catch (imageError) {
            console.log(
              `⚠️  Image extraction failed for ${repositoryPath}, continuing without images`,
              imageError
            );
          }
        }

        // Determine homepage URL
        let homepageUrl = githubRepo.homepage || null;

        // If no homepage in GitHub data, try to extract from README
        if (!homepageUrl && readme) {
          homepageUrl = extractHomepageFromReadme(readme);
        }

        // Take screenshot of homepage if available
        let screenshotUrl: string | null = null;
        if (homepageUrl) {
          try {
            const screenshot = await takeScreenshot(homepageUrl);
            if (screenshot) {
              const fileName = `images/${repositoryPath.replace(
                "/",
                "-"
              )}-${Date.now()}.png`;
              screenshotUrl = await uploadToSupabaseStorage(
                screenshot,
                fileName
              );
              if (screenshotUrl) {
                console.log(`✅ Screenshot uploaded: ${screenshotUrl}`);
              }
            }
          } catch (screenshotError) {
            console.log(
              `⚠️  Screenshot failed for ${homepageUrl}, continuing without screenshot`,
              screenshotError
            );
          }
        }

        // Prepare images array
        const allImages: ImageItem[] = [...readmeImages];
        if (screenshotUrl) {
          allImages.push({
            url: screenshotUrl,
            type: "screenshot",
            width: 1280,
            height: 720,
          });
        }

        // Filter out star-history images
        const filteredImages = allImages.filter(
          (img) => !img.url.includes("star-history.com")
        );

        // Create full repository record with GitHub data
        const repoRecord = {
          id: crypto.randomUUID(),
          repository: repositoryPath,
          summary:
            githubRepo.description || repo.description || repo.title || null,
          content: null,
          languages: languages ? languages.join(", ") : null,
          experience: null,
          usability: null,
          deployment: null,
          stars: githubRepo.stargazers_count,
          forks: githubRepo.forks_count,
          watching: githubRepo.watchers_count,
          license: githubRepo.license?.name || null,
          homepage: homepageUrl,
          images: filteredImages,
          created_at: new Date(),
          updated_at: new Date(),
          archived: githubRepo.archived,
          disabled: githubRepo.disabled,
          open_issues: githubRepo.open_issues_count,
          default_branch: githubRepo.default_branch,
          network_count: githubRepo.network_count,
          tags: githubRepo.topics?.join(", ") || null,
          arxiv_url: null,
          huggingface_url: repo.source === "paper" ? repo.url : null,
          paper_authors: repo.authors ? JSON.stringify(repo.authors) : null,
          paper_abstract: null,
          paper_scraped_at: repo.source === "paper" ? new Date() : null,
          readme: readme,
          publish: false,
          ingested: true,
          enriched: false,
        };

        // Insert into database
        try {
          await db
            .insert(repositoriesTable)
            .values(repoRecord)
            .onConflictDoNothing();
          addedCount++;
          processedCount++;

          console.log(`✅ Added & Processed: ${repositoryPath}`);
          console.log(`   🌟 Stars: ${githubRepo.stargazers_count}`);
          console.log(`   🍴 Forks: ${githubRepo.forks_count}`);
          console.log(`   📄 License: ${githubRepo.license?.name || "None"}`);
          console.log(`   🏠 Homepage: ${homepageUrl || "None"}`);
          console.log(`   🖼️  Images: ${filteredImages.length}`);
        } catch (insertError) {
          console.warn(`Insert skipped for ${repositoryPath}:`, insertError);
        }

        // Add delay between repositories (GitHub API + Browserless rate limiting)
        if (i < limitedRepos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repo.name || repo.href}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error processing ${repo.name || repo.href}:`, error);
        continue;
      }
    }

    const result = {
      success: true,
      message: `Repository ingestion completed - added ${addedCount} new repositories`,
      totalFound: totalNewRepos,
      added: addedCount,
      processed: processedCount,
      limited: totalNewRepos > MAX_REPOS_PER_HOUR,
      maxPerHour: MAX_REPOS_PER_HOUR,
      errors: errorCount,
      errorDetails: errors.slice(0, 10),
      sources: sources.map((s) => s.name),
      note: BROWSERLESS_API_KEY
        ? "Repositories fetched from external sources, processed with GitHub data, README, images, and screenshots (via Browserless). Ready for enrichment."
        : "Repositories fetched from external sources and processed with GitHub data, README, and images. Screenshots skipped (no Browserless API key). Ready for enrichment.",
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Ingestion completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Ingestion automation error:", error);
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
  ingestHandler,
  middlewareConfigs.scraping
);
