import { NextRequest, NextResponse } from "next/server";
import { withApiMiddleware, middlewareConfigs } from "@/lib/api-middleware";
import { db } from "@/db";
import { repositoriesTable } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
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

    // Get repositories that need ingestion (not yet ingested)
    const repositoriesToIngest = await db
      .select()
      .from(repositoriesTable)
      .where(sql`${repositoriesTable.ingested} = false`)
      .limit(10); // Process max 10 at a time

    if (repositoriesToIngest.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No repositories need ingestion",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📋 Found ${repositoriesToIngest.length} repositories to ingest`
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process repositories with rate limiting
    for (let i = 0; i < repositoriesToIngest.length; i++) {
      const repository = repositoriesToIngest[i];

      try {
        console.log(
          `📝 Ingesting ${i + 1}/${repositoriesToIngest.length}: ${
            repository.repository
          }`
        );

        // Parse repository path
        const parsed = parseRepositoryPath(repository.repository || "");

        if (!parsed) {
          console.warn(
            `Could not parse repository path: ${repository.repository}`
          );
          // Mark as ingested anyway to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              ingested: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
          processedCount++;
          continue;
        }

        const { owner, repo } = parsed;

        // Fetch GitHub data
        const [githubRepo, readme, languages] = await Promise.all([
          fetchGitHubRepository(owner, repo),
          fetchGitHubReadme(owner, repo),
          fetchGitHubLanguages(owner, repo),
        ]);

        if (!githubRepo) {
          console.warn(`GitHub repository not found: ${owner}/${repo}`);
          // Mark as ingested to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              ingested: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
          processedCount++;
          continue;
        }

        // Extract images from README if available
        let readmeImages: ImageItem[] = [];
        if (readme) {
          try {
            const repoUrl = `https://github.com/${repository.repository}`;
            readmeImages = await extractImagesFromReadme(readme, repoUrl);
            console.log(`🖼️  Found ${readmeImages.length} images in README`);
          } catch (imageError) {
            console.log(
              `⚠️  Image extraction failed for ${repository.repository}, continuing without images`,
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
              const fileName = `images/${repository.repository?.replace(
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

        // Update repository with fetched data
        await db
          .update(repositoriesTable)
          .set({
            summary: githubRepo.description || repository.summary,
            languages: languages ? languages.join(", ") : null,
            stars: githubRepo.stargazers_count,
            forks: githubRepo.forks_count,
            watching: githubRepo.watchers_count,
            license: githubRepo.license?.name || null,
            homepage: homepageUrl,
            images: filteredImages,
            archived: githubRepo.archived,
            disabled: githubRepo.disabled,
            open_issues: githubRepo.open_issues_count,
            default_branch: githubRepo.default_branch,
            network_count: githubRepo.network_count,
            tags: githubRepo.topics?.join(", ") || null,
            readme: readme,
            ingested: true,
            updated_at: new Date(),
          })
          .where(eq(repositoriesTable.id, repository.id));

        processedCount++;
        console.log(`✅ Ingested: ${repository.repository}`);
        console.log(`   🌟 Stars: ${githubRepo.stargazers_count}`);
        console.log(`   🍴 Forks: ${githubRepo.forks_count}`);
        console.log(`   📄 License: ${githubRepo.license?.name || "None"}`);
        console.log(`   🏠 Homepage: ${homepageUrl || "None"}`);
        console.log(`   🖼️  Images: ${filteredImages.length}`);

        // Add delay between repositories (GitHub API rate limiting)
        if (i < repositoriesToIngest.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repository.repository}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error ingesting ${repository.repository}:`, error);

        // Mark as ingested even on error to avoid infinite retries
        try {
          await db
            .update(repositoriesTable)
            .set({
              ingested: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
        } catch (updateError) {
          console.error("Error marking repository as ingested:", updateError);
        }

        // Continue with next repository
        continue;
      }
    }

    const result = {
      success: true,
      message: `Repository ingestion completed`,
      totalFound: repositoriesToIngest.length,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      note: BROWSERLESS_API_KEY
        ? "Repositories fetched from GitHub with README, images, and screenshots (via Browserless). Ready for enrichment."
        : "Repositories fetched from GitHub with README and images. Screenshots skipped (no Browserless API key). Ready for enrichment.",
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
