import { Client } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Repository {
  id: string;
  repository: string;
  readme?: string;
  summary?: string;
  content?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GeneratedContent {
  summary: string;
  content: string;
}

class ContentEnricher {
  private dbClient: Client;
  private apiKey: string;
  private apiUrl: string;
  private apiModel: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor() {
    // Initialize PostgreSQL client with environment variables
    this.dbClient = new Client({
      host: process.env.SUPABASE_DATABASE_HOST,
      database: process.env.SUPABASE_DATABASE_NAME,
      user: process.env.SUPABASE_DATABASE_USER,
      password: process.env.SUPABASE_DATABASE_PASSWORD,
      port: parseInt(process.env.SUPABASE_DATABASE_PORT || "5432"),
      ssl: {
        rejectUnauthorized: false, // Required for Supabase connections
      },
    });

    // Initialize OpenAI API key and URL
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.apiUrl =
      process.env.OPENAI_API_URL ||
      "https://api.openai.com/v1/chat/completions";
    this.apiModel = process.env.OPENAI_API_MODEL || "gpt-4.1-nano";

    if (!this.apiKey) {
      throw new Error(
        "No OpenAI API key found. Please set OPENAI_API_KEY in your .env file"
      );
    }

    console.log("✅ Initialized with OpenAI API key");
    console.log(`🔗 Using API URL: ${this.apiUrl}`);
    console.log(`🤖 Using model: ${this.apiModel}`);
  }

  async connect(): Promise<void> {
    try {
      await this.dbClient.connect();
      console.log("✅ Connected to Supabase database");
    } catch (error) {
      console.error("❌ Failed to connect to database:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.dbClient.end();
      console.log("📤 Disconnected from database");
    } catch (error) {
      console.error("❌ Error disconnecting from database:", error);
    }
  }

  private cleanReadmeContent(content: string): string {
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

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // OpenAI rate limits: ~50 requests per minute for GPT-4, ~350 for GPT-3.5-turbo
    // Using conservative 30 requests per minute to be safe
    const minInterval = 60000 / 30; // ~2000ms between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(
        `⏳ Rate limiting: waiting ${Math.ceil(
          waitTime / 1000
        )}s before next request`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  async getRepositoriesNeedingEnrichment(): Promise<Repository[]> {
    try {
      const query = `
				SELECT id, repository, readme
				FROM repositories
				WHERE ingested = true AND enriched = false
				LIMIT 50
			`;

      const result = await this.dbClient.query(query);

      if (result.rows.length === 0) {
        console.log("✅ All repositories have been enriched");
        return [];
      }

      console.log(
        `📋 Found ${result.rows.length} repositories needing content enrichment`
      );
      return result.rows as Repository[];
    } catch (error) {
      console.error(
        "❌ Error fetching repositories needing enrichment:",
        error
      );
      throw error;
    }
  }

  async generateContent(
    repository: Repository
  ): Promise<GeneratedContent | null> {
    try {
      if (!repository.readme) {
        console.log(`⚠️  No README content for ${repository.repository}`);
        return null;
      }

      // Clean the README content to remove HTML/markdown formatting and limit length
      const cleanedReadme = this.cleanReadmeContent(repository.readme);

      if (!cleanedReadme || cleanedReadme.trim().length < 100) {
        console.log(
          `⚠️  README content too short or empty after cleaning for ${repository.repository}`
        );
        return null;
      }

      await this.waitForRateLimit();

      const prompt = `Based on the following GitHub repository README content in English, create a human-written article about this project. The article should be engaging, informative, and written in a natural, conversational style.

README Content:
${cleanedReadme}

Please generate:
1. A brief summary/excerpt (2-3 sentences)
2. The full article content in markdown format

Format your response exactly like this:
summary: [Your summary here]
content: [Your full article content in markdown]

Make the article comprehensive but not too long. Focus on what makes this project interesting, its features, use cases, and value proposition.`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.apiModel,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000, // Limit response length
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`🚦 Rate limit hit, waiting before retry`);
          await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute
          return this.generateContent(repository);
        }
        throw new Error(
          `OpenAI API error: ${response.status} - ${response.statusText}`
        );
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      const content = data.choices[0].message.content;
      console.log(`🤖 Generated content for ${repository.repository}`);

      // Parse the response
      return this.parseGeneratedContent(content);
    } catch (error) {
      console.error(
        `❌ Error generating content for ${repository.repository}:`,
        error
      );
      return null;
    }
  }

  private parseGeneratedContent(content: string): GeneratedContent | null {
    try {
      // Split content into lines for easier parsing
      const lines = content.split("\n");
      let summary = "";
      let articleContent = "";
      let currentSection = "";

      for (const line of lines) {
        if (line.toLowerCase().startsWith("summary:")) {
          currentSection = "summary";
          summary = line.substring(8).trim();
        } else if (line.toLowerCase().startsWith("content:")) {
          currentSection = "content";
          articleContent = line.substring(8).trim();
        } else if (currentSection && line.trim()) {
          // Continue adding to current section
          if (currentSection === "summary") {
            summary += " " + line.trim();
          } else if (currentSection === "content") {
            articleContent += "\n" + line;
          }
        }
      }

      if (!summary || !articleContent) {
        console.error("❌ Failed to parse generated content format");
        return null;
      }

      return {
        summary: summary.trim(),
        content: articleContent.trim(),
      };
    } catch (error) {
      console.error("❌ Error parsing generated content:", error);
      return null;
    }
  }

  async updateRepositoryContent(
    repositoryId: string,
    generatedContent: GeneratedContent
  ): Promise<void> {
    try {
      const updateQuery = `
				UPDATE repositories
				SET
					summary = $1,
					content = $2,
					updated_at = $3,
					enriched = true
				WHERE id = $4
			`;

      await this.dbClient.query(updateQuery, [
        generatedContent.summary,
        generatedContent.content,
        new Date().toISOString(),
        repositoryId,
      ]);

      console.log(
        `✅ Updated repository ${repositoryId} with generated content`
      );
    } catch (error) {
      console.error(`❌ Error updating repository ${repositoryId}:`, error);
      throw error;
    }
  }

  async processRepository(repository: Repository): Promise<void> {
    try {
      console.log(`\n📝 Processing repository: ${repository.repository}`);

      const generatedContent = await this.generateContent(repository);

      if (generatedContent) {
        await this.updateRepositoryContent(repository.id, generatedContent);

        console.log(
          `✅ Successfully enriched content for ${repository.repository}`
        );
        console.log(
          `   📄 Summary: ${generatedContent.summary.substring(0, 60)}...`
        );
      } else {
        console.log(
          `⚠️  Failed to generate content for ${repository.repository}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing repository ${repository.repository}:`,
        error
      );
    }
  }

  async run(): Promise<void> {
    try {
      // Connect to database
      await this.connect();

      // Get repositories needing enrichment
      console.log("📋 Fetching repositories needing content enrichment...");
      const repositoriesToEnrich =
        await this.getRepositoriesNeedingEnrichment();

      if (repositoriesToEnrich.length === 0) {
        console.log("✅ No repositories need content enrichment");
        return;
      }

      console.log(
        `🚀 Starting content enrichment for ${repositoriesToEnrich.length} repositories...\n`
      );

      // Process each repository with rate limiting
      for (let i = 0; i < repositoriesToEnrich.length; i++) {
        const repository = repositoriesToEnrich[i];
        console.log(
          `\n📊 Progress: ${i + 1}/${
            repositoriesToEnrich.length
          } repositories processed`
        );

        await this.processRepository(repository);

        // Add delay between repositories to respect rate limits
        if (i < repositoriesToEnrich.length - 1) {
          console.log(`⏳ Waiting 3 seconds before next repository...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      console.log(
        `\n🎉 Content enrichment completed! Processed ${repositoriesToEnrich.length} repositories.`
      );
    } catch (error) {
      console.error("💥 Application error:", error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Repository Content Enricher...\n");

  // Validate required environment variables
  const requiredEnvVars = [
    "SUPABASE_DATABASE_HOST",
    "SUPABASE_DATABASE_NAME",
    "SUPABASE_DATABASE_USER",
    "SUPABASE_DATABASE_PASSWORD",
    "SUPABASE_DATABASE_PORT",
    "OPENAI_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  const enricher = new ContentEnricher();
  await enricher.run();
}

// Run the program
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

export { ContentEnricher };
