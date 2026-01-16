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
  extractImagesFromReadme,
} from "@/services/github-service";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL || "gpt-5.2-nano";

/**
 * Clean README content by removing HTML/markdown formatting
 */
function cleanReadmeContent(content: string): string {
  try {
    let cleaned = content;

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    // Remove markdown image syntax ![alt](url)
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, "");

    // Convert markdown links [text](url) to just text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove markdown headers formatting but keep the text
    cleaned = cleaned.replace(/^#+\s*/gm, "");

    // Remove emphasis markers
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2"); // Bold
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2"); // Italic

    // Remove code block markers
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "[Code block removed]");
    cleaned = cleaned.replace(/`([^`]+)`/g, "$1"); // Inline code

    // Remove markdown list markers
    cleaned = cleaned.replace(/^[\s]*[-\*\+]\s+/gm, "");
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, "");

    // Remove excessive whitespace and empty lines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n"); // Multiple empty lines
    cleaned = cleaned.replace(/^\s+|\s+$/g, ""); // Leading/trailing whitespace
    cleaned = cleaned.replace(/[ \t]+/g, " "); // Multiple spaces

    // Remove common markdown artifacts
    cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, ""); // Horizontal rules
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ""); // HTML comments

    // Limit content to 100K characters to prevent token limit issues
    const maxLength = 100000;
    if (cleaned.length > maxLength) {
      console.log(
        `📏 Content too long (${cleaned.length} chars), truncating to ${maxLength} chars`
      );
      // Try to truncate at a sentence boundary
      let truncated = cleaned.substring(0, maxLength);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf(". "),
        truncated.lastIndexOf("! "),
        truncated.lastIndexOf("? ")
      );

      if (lastSentenceEnd > maxLength * 0.8) {
        // If we can keep 80% of the limit
        truncated = truncated.substring(0, lastSentenceEnd + 1);
      }

      cleaned = truncated + "\n\n[Content truncated for length]";
    }

    console.log(
      `🧹 Cleaned README content: ${content.length} → ${cleaned.length} characters`
    );
    return cleaned;
  } catch (error) {
    console.error("❌ Error cleaning README content:", error);
    // Return original content if cleaning fails
    return content.substring(0, 100000);
  }
}

/**
 * Generate AI-enhanced content using natural article-style approach
 */
async function generateAIContent(repository: any): Promise<{
  enhancedSummary: string;
  enhancedContent: string;
  experienceLevel: string;
  usabilityLevel: string;
  deploymentLevel: string;
}> {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, skipping AI content generation");
    return {
      enhancedSummary: "",
      enhancedContent: "",
      experienceLevel: "",
      usabilityLevel: "",
      deploymentLevel: "",
    };
  }

  try {
    if (!repository.readme) {
      console.log(`⚠️  No README content for ${repository.repository}`);
      return {
        enhancedSummary: "",
        enhancedContent: "",
        experienceLevel: "",
        usabilityLevel: "",
        deploymentLevel: "",
      };
    }

    // Clean the README content to remove HTML/markdown formatting and limit length
    const cleanedReadme = cleanReadmeContent(repository.readme);

    if (!cleanedReadme || cleanedReadme.trim().length < 100) {
      console.log(
        `⚠️  README content too short or empty after cleaning for ${repository.repository}`
      );
      return {
        enhancedSummary: "",
        enhancedContent: "",
        experienceLevel: "",
        usabilityLevel: "",
        deploymentLevel: "",
      };
    }

    const prompt = `Based on the following GitHub repository README content in English, create a human-written article about this project. The article should be engaging, informative, and written in a natural, conversational style.

README Content:
${cleanedReadme}

Please generate:
1. A brief summary/excerpt (2-3 sentences)
2. The full article content in markdown format
3. Experience Level: beginner, intermediate, or advanced
4. Usability Level: easy, intermediate, or difficult
5. Deployment Difficulty: easy, intermediate, advanced, or expert

Format your response exactly in proper JSON format based on provided response format. Make the article comprehensive but not too long. Focus on what makes this project interesting, its features, use cases, and value proposition.`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_API_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "repository_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description:
                    "A concise 2-3 sentence summary of the repository",
                },
                content: {
                  type: "string",
                  description:
                    "A detailed 3-4 paragraph description of the repository",
                },
                experience: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  description:
                    "Required experience level to use this repository",
                },
                usability: {
                  type: "string",
                  enum: ["easy", "intermediate", "difficult"],
                  description: "How easy it is to use this repository",
                },
                deployment: {
                  type: "string",
                  enum: ["easy", "intermediate", "advanced", "expert"],
                  description: "Deployment difficulty level",
                },
              },
              required: [
                "summary",
                "content",
                "experience",
                "usability",
                "deployment",
              ],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error: ${response.status} - ${errorText}`);
      return {
        enhancedSummary: "",
        enhancedContent: "",
        experienceLevel: "",
        usabilityLevel: "",
        deploymentLevel: "",
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn("No content in AI response");
      return {
        enhancedSummary: "",
        enhancedContent: "",
        experienceLevel: "",
        usabilityLevel: "",
        deploymentLevel: "",
      };
    }

    console.log(`🤖 Generated content for ${repository.repository}`);
    // Parse structured JSON response
    try {
      const parsed = JSON.parse(content);

      // Ensure all values are strings
      return {
        enhancedSummary: String(parsed.summary || ""),
        enhancedContent: String(parsed.content || ""),
        experienceLevel: String(parsed.experience || ""),
        usabilityLevel: String(parsed.usability || ""),
        deploymentLevel: String(parsed.deployment || ""),
      };
    } catch (parseError) {
      console.error("Failed to parse AI structured response:", parseError);
      console.error("Raw content:", content);
      return {
        enhancedSummary: "",
        enhancedContent: "",
        experienceLevel: "",
        usabilityLevel: "",
        deploymentLevel: "",
      };
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    return {
      enhancedSummary: "",
      enhancedContent: "",
      experienceLevel: "",
      usabilityLevel: "",
      deploymentLevel: "",
    };
  }
}

async function enrichHandler(_request: NextRequest) {
  try {
    console.log("🚀 Starting automated repository enrichment...");

    // Get repositories that need enrichment (ingested but not enriched)
    const repositoriesToEnrich = await db
      .select()
      .from(repositoriesTable)
      .where(
        sql`${repositoriesTable.ingested} = true AND ${repositoriesTable.enriched} = false`
      )
      .limit(10); // Process max 10 at a time

    if (repositoriesToEnrich.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No repositories need enrichment",
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📋 Found ${repositoriesToEnrich.length} repositories to enrich`
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process repositories with rate limiting
    for (let i = 0; i < repositoriesToEnrich.length; i++) {
      const repository = repositoriesToEnrich[i];

      try {
        console.log(
          `📝 Enriching ${i + 1}/${repositoriesToEnrich.length}: ${
            repository.repository
          }`
        );

        // Parse repository path
        const parsed = parseRepositoryPath(repository.repository || "");

        if (!parsed) {
          console.warn(
            `Could not parse repository path: ${repository.repository}`
          );
          // Mark as enriched anyway to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              enriched: true,
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
          // Mark as enriched to avoid reprocessing
          await db
            .update(repositoriesTable)
            .set({
              enriched: true,
              updated_at: new Date(),
            })
            .where(eq(repositoriesTable.id, repository.id));
          processedCount++;
          continue;
        }

        // Extract images from README
        const images = readme ? extractImagesFromReadme(readme) : [];

        // Update repository object with fresh data for AI processing
        const enrichedRepo = {
          ...repository,
          readme,
          languages: languages ? languages.join(", ") : null,
          stars: githubRepo.stargazers_count,
          tags: githubRepo.topics?.join(", ") || null,
          images,
        };

        // Generate AI-enhanced content and determine levels
        const {
          enhancedSummary,
          enhancedContent,
          experienceLevel,
          usabilityLevel,
          deploymentLevel,
        } = await generateAIContent(enrichedRepo);

        // Determine if repository should be published
        // Publish if: has images OR has AI-generated content
        const hasImages = images.length > 0;
        const hasAIContent = !!(enhancedSummary && enhancedContent);
        const hasGoodMetadata =
          !!(enhancedSummary || repository.summary) &&
          githubRepo.stargazers_count !== null &&
          !!languages;
        const shouldPublish: boolean =
          hasImages || (hasAIContent && hasGoodMetadata);

        // Ensure content is always a string (never null or undefined)
        const finalContent: string =
          enhancedContent || repository.content || "";
        const finalSummary: string =
          enhancedSummary || repository.summary || "";
        const finalExperience: string | null =
          experienceLevel || repository.experience || null;
        const finalUsability: string | null =
          usabilityLevel || repository.usability || null;
        const finalDeployment: string | null =
          deploymentLevel || repository.deployment || null;

        // Prepare images as JSONB-compatible value
        const finalImages = images.length > 0 ? images : [];

        // Update repository with AI-enriched data
        await db
          .update(repositoriesTable)
          .set({
            summary: finalSummary,
            content: finalContent,
            languages: languages ? languages.join(", ") : null,
            experience: finalExperience,
            usability: finalUsability,
            deployment: finalDeployment,
            stars: githubRepo.stargazers_count,
            forks: githubRepo.forks_count,
            watching: githubRepo.watchers_count,
            license: githubRepo.license?.name || null,
            homepage: githubRepo.homepage || githubRepo.html_url,
            images: finalImages,
            archived: githubRepo.archived,
            disabled: githubRepo.disabled,
            open_issues: githubRepo.open_issues_count,
            default_branch: githubRepo.default_branch,
            network_count: githubRepo.network_count,
            tags: githubRepo.topics?.join(", ") || null,
            readme: readme,
            enriched: true,
            publish: shouldPublish,
            updated_at: new Date(),
          })
          .where(eq(repositoriesTable.id, repository.id));

        processedCount++;
        console.log(
          `✅ Enriched: ${repository.repository} (publish: ${shouldPublish})`
        );
        if (experienceLevel) console.log(`   Experience: ${experienceLevel}`);
        if (usabilityLevel) console.log(`   Usability: ${usabilityLevel}`);
        if (deploymentLevel) console.log(`   Deployment: ${deploymentLevel}`);

        // Add delay between repositories (AI API rate limiting)
        if (i < repositoriesToEnrich.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }
      } catch (error) {
        errorCount++;
        const errorMessage = `${repository.repository}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMessage);
        console.error(`❌ Error enriching ${repository.repository}:`, error);

        // Continue with next repository
        continue;
      }
    }

    const result = {
      success: true,
      message: `Repository enrichment completed`,
      totalFound: repositoriesToEnrich.length,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Limit error details to first 10
      note: OPENAI_API_KEY
        ? "AI-enhanced article-style content generated. Repositories with images or AI content auto-published."
        : "AI content generation skipped (no API key). Set OPENAI_API_KEY to enable.",
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Enrichment completed:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Enrichment automation error:", error);
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
  enrichHandler,
  middlewareConfigs.scraping
);
