import { Client } from 'pg';
import { chromium } from 'playwright';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import sizeOf from 'image-size';

// Load environment variables
dotenv.config();

interface ImageItem {
	url: string;
	type?: string;
	width?: number;
	height?: number;
}

interface Repository {
	id: string;
	repository: string;
	created_at?: string;
	readme?: string;
	license?: string;
	images?: ImageItem[];
	homepage?: string;
	stars?: number;
	forks?: number;
}

interface GitHubRepository {
	name: string;
	full_name: string;
	created_at: string;
	description: string | null;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	license?: {
		name: string;
		spdx_id: string;
	};
	homepage?: string | null;
}

interface GitHubReadme {
	content: string;
	download_url: string;
}

class RepositoryFetcher {
	private dbClient: Client;
	private supabaseClient: SupabaseClient;

	constructor() {
		// Initialize PostgreSQL client with environment variables
		this.dbClient = new Client({
			host: process.env.SUPABASE_DATABASE_HOST,
			database: process.env.SUPABASE_DATABASE_NAME,
			user: process.env.SUPABASE_DATABASE_USER,
			password: process.env.SUPABASE_DATABASE_PASSWORD,
			port: parseInt(process.env.SUPABASE_DATABASE_PORT || '5432'),
			ssl: {
				rejectUnauthorized: false // Required for Supabase connections
			}
		});

		// Initialize Supabase client for storage
		this.supabaseClient = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL || '',
			process.env.SUPABASE_SERVICE_ROLE_KEY || ''
		);
	}

	async connect(): Promise<void> {
		try {
			await this.dbClient.connect();
			console.log('✅ Connected to Supabase database');
		} catch (error) {
			console.error('❌ Failed to connect to database:', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.dbClient.end();
			console.log('📤 Disconnected from database');
		} catch (error) {
			console.error('❌ Error disconnecting from database:', error);
		}
	}

	async getAllRepositoriesWithEmptyImages(): Promise<Repository[]> {
		try {
			const query = `
				SELECT * FROM repositories
				WHERE ingested = false
				LIMIT 50
			`;

			const result = await this.dbClient.query(query);

			if (result.rows.length === 0) {
				console.log('✅ All repositories have images or have been processed');
				return [];
			}

			console.log(`📋 Found ${result.rows.length} repositories with empty/null images or unprocessed`);
			return result.rows as Repository[];
		} catch (error) {
			console.error('❌ Error fetching repositories with empty images:', error);
			throw error;
		}
	}

	async getGitHubRepositoryInfo(repositoryPath: string): Promise<GitHubRepository> {
		try {
			console.log(`🔍 Fetching GitHub info for: ${repositoryPath}`);

			const headers: Record<string, string> = {
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'Repository-Creation-Fetcher/1.0'
			};

			// Add GitHub token if available for higher rate limits
			if (process.env.GITHUB_TOKEN) {
				headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
			}

			const response = await fetch(`https://api.github.com/repos/${repositoryPath}`, {
				headers
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error(`Repository ${repositoryPath} not found on GitHub`);
				} else if (response.status === 403) {
					throw new Error('GitHub API rate limit exceeded. Consider adding a GITHUB_TOKEN to your .env file');
				} else {
					throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
				}
			}

			const repoData = await response.json();
			return repoData as GitHubRepository;
		} catch (error) {
			console.error('❌ Error fetching GitHub repository info:', error);
			throw error;
		}
	}

	async getGitHubReadme(repositoryPath: string): Promise<string | null> {
		try {
			console.log(`📖 Fetching README for: ${repositoryPath}`);

			const headers: Record<string, string> = {
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'Repository-Creation-Fetcher/1.0'
			};

			if (process.env.GITHUB_TOKEN) {
				headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
			}

			const response = await fetch(`https://api.github.com/repos/${repositoryPath}/readme`, {
				headers
			});

			if (!response.ok) {
				if (response.status === 404) {
					console.log(`⚠️  No README found for ${repositoryPath}`);
					return null;
				}
				throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
			}

			const readmeData: GitHubReadme = await response.json();
			const readmeContent = await fetch(readmeData.download_url).then(r => r.text());
			return readmeContent;
		} catch (error) {
			console.error('❌ Error fetching GitHub README:', error);
			return null;
		}
	}

	extractHomepageFromReadme(readmeContent: string): string | null {
		try {
			// Keywords to search for homepage links
			const homepageKeywords = [
				'website', 'demo', 'live demo', 'preview', 'live preview',
				'deployed', 'production', 'app', 'application', 'site',
				'view live', 'see live', 'check it out', 'visit', 'homepage'
			];

			// Split content into lines for analysis
			const lines = readmeContent.split('\n');

			for (const line of lines) {
				const lowerLine = line.toLowerCase();

				// Check if line contains any homepage keywords
				const hasHomepageKeyword = homepageKeywords.some(keyword =>
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
							const cleanUrl = url.replace(/[.,;:!\?\)]+$/, '');

							// Skip GitHub URLs and other common non-homepage URLs
							if (!cleanUrl.includes('github.com') &&
								!cleanUrl.includes('linkedin.com') &&
								!cleanUrl.includes('twitter.com') &&
								!cleanUrl.includes('facebook.com') &&
								!cleanUrl.includes('instagram.com')) {

								console.log(`🔗 Found potential homepage in README: ${cleanUrl}`);
								return cleanUrl;
							}
						}
					}
				}
			}

			// Also check for markdown link patterns like [Demo](url) or [Website](url)
			const markdownLinkRegex = /\[([^\]]*(?:website|demo|live|preview|app|site|deployed)[^\]]*)\]\(([^)]+)\)/gi;
			let match;

			while ((match = markdownLinkRegex.exec(readmeContent)) !== null) {
				const url = match[2].trim();

				// Skip GitHub URLs
				if (!url.includes('github.com')) {
					console.log(`🔗 Found homepage via markdown link: ${url}`);
					return url;
				}
			}

			return null;
		} catch (error) {
			console.error('❌ Error extracting homepage from README:', error);
			return null;
		}
	}

	async extractImagesFromReadme(readmeContent: string, repoUrl: string): Promise<ImageItem[]> {
		const images: ImageItem[] = [];

		try {
			// Parse markdown content
			const processor = unified().use(remarkParse);
			const tree = processor.parse(readmeContent);

			const imagePromises: Promise<void>[] = [];

			// Extract images from markdown image nodes
			visit(tree, 'image', (node: { url: string }) => {
				const imageUrl = node.url;
				const promise = this.processImageUrl(imageUrl, repoUrl, 'readme').then(imageItem => {
					if (imageItem) {
						images.push(imageItem);
					}
				});
				imagePromises.push(promise);
			});

			// Also extract images from HTML img tags
			const imgTagRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
			let match;

			while ((match = imgTagRegex.exec(readmeContent)) !== null) {
				const imageUrl = match[1];
				const promise = this.processImageUrl(imageUrl, repoUrl, 'html').then(imageItem => {
					if (imageItem) {
						images.push(imageItem);
					}
				});
				imagePromises.push(promise);
			}

			await Promise.all(imagePromises);
		} catch (error) {
			console.error('Error parsing README for images:', error);
		}

		// Remove duplicates based on URL
		const uniqueImages = images.filter((image, index, self) =>
			index === self.findIndex(i => i.url === image.url)
		);

		return uniqueImages;
	}

	async processImageUrl(imageUrl: string, repoUrl: string, type: string): Promise<ImageItem | null> {
		try {
			// Skip obviously invalid URLs
			if (!imageUrl || imageUrl.trim() === '' || imageUrl === '#') {
				return null;
			}

			// Convert relative URLs to absolute
			let absoluteUrl = imageUrl;
			if (imageUrl.startsWith('./') || imageUrl.startsWith('../')) {
				absoluteUrl = `${repoUrl}/raw/main/${imageUrl.replace('./', '')}`;
			} else if (imageUrl.startsWith('/')) {
				absoluteUrl = `${repoUrl}${imageUrl}`;
			} else if (!imageUrl.startsWith('http')) {
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
				/\.svg$/i,  // SVGs often cause issues with sizeOf
				/badge/i,   // Badge images
				/shield/i,  // Shield badges
				/star-history/i, // Star history images
				/githubusercontent\.com.*\?.*size/, // GitHub avatar with size param
			];

			if (skipPatterns.some(pattern => pattern.test(absoluteUrl))) {
				return null;
			}

			const dimensions = await this.getImageDimensions(absoluteUrl);

			if (dimensions && this.isValidImage(dimensions.width, dimensions.height)) {
				return {
					url: absoluteUrl,
					width: dimensions.width,
					height: dimensions.height,
					type: type
				};
			}

			return null;
		} catch (error) {
			console.error('Error processing image URL:', imageUrl, error);
			return null;
		}
	}

	async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
		try {
			const response = await fetch(imageUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
				}
			});

			if (!response.ok) return null;

			const buffer = await response.arrayBuffer();

			// Check if buffer has content
			if (buffer.byteLength === 0) {
				console.log(`Empty buffer for image: ${imageUrl}`);
				return null;
			}

			// Check content type from response headers
			const contentType = response.headers.get('content-type');
			if (contentType && !contentType.startsWith('image/')) {
				console.log(`Invalid content type for image: ${contentType} - ${imageUrl}`);
				return null;
			}

			const dimensions = sizeOf(Buffer.from(buffer));

			// Check if dimensions object has required properties
			if (!dimensions || typeof dimensions.width !== 'number' || typeof dimensions.height !== 'number') {
				console.log(`Invalid image dimensions for: ${imageUrl}`);
				return null;
			}

			if (dimensions.width <= 0 || dimensions.height <= 0) {
				console.log(`Invalid image dimensions (zero or negative): ${dimensions.width}x${dimensions.height} for ${imageUrl}`);
				return null;
			}

			return {
				width: dimensions.width,
				height: dimensions.height
			};
		} catch (error) {
			console.error('Error getting image dimensions:', error);
			return null;
		}
	}

	isValidImage(width: number, height: number): boolean {
		const minWidth = 200;
		const minHeight = 150;
		return width >= minWidth && height >= minHeight;
	}

	async takeScreenshot(url: string, maxRetries: number = 3): Promise<Buffer | null> {
		let browser;
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`📸 Taking screenshot of: ${url} (attempt ${attempt}/${maxRetries})`);
				browser = await chromium.launch({
					args: [
						'--no-sandbox',
						'--disable-setuid-sandbox',
						'--disable-dev-shm-usage',
						'--disable-accelerated-2d-canvas',
						'--no-first-run',
						'--no-zygote',
						'--single-process',
						'--disable-gpu'
					]
				});

				const context = await browser.newContext({
					userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				});

				const page = await context.newPage();

				// Set viewport size
				await page.setViewportSize({ width: 1280, height: 720 });

				// Set longer timeout for navigation
				const timeout = attempt === 1 ? 45000 : 30000; // Longer timeout for first attempt

				// Navigate to the page with error handling
				try {
					await page.goto(url, {
						waitUntil: 'domcontentloaded', // Less strict than networkidle
						timeout: timeout
					});
				} catch (navError) {
					// If navigation fails, try with load event
					console.log(`Navigation failed with domcontentloaded, trying with load event...`);
					await page.goto(url, {
						waitUntil: 'load',
						timeout: timeout
					});
				}

				// Wait for page to stabilize
				await page.waitForTimeout(3000);

				// Check if page has content
				const content = await page.content();
				if (!content || content.length < 100) {
					throw new Error('Page appears to be empty or blocked');
				}

				// Take screenshot
				const screenshot = await page.screenshot({
					fullPage: false,
					type: 'png'
				});

				await context.close();
				return screenshot as Buffer;

			} catch (error) {
				lastError = error as Error;
				console.error(`❌ Screenshot attempt ${attempt} failed:`, error);

				// Clean up browser instance
				if (browser) {
					try {
						await browser.close();
					} catch (closeError) {
						console.error('Error closing browser:', closeError);
					}
					browser = null;
				}

				// If this is not the last attempt, wait before retrying
				if (attempt < maxRetries) {
					const waitTime = attempt * 2000; // Progressive backoff
					console.log(`⏳ Waiting ${waitTime}ms before retry...`);
					await new Promise(resolve => setTimeout(resolve, waitTime));
				}
			}
		}

		console.error(`❌ All ${maxRetries} screenshot attempts failed for ${url}. Last error:`, lastError);
		return null;
	}

	async uploadToSupabaseStorage(buffer: Buffer, fileName: string): Promise<string | null> {
		try {
			console.log(`📤 Uploading screenshot to Supabase storage: ${fileName}`);

			const { error } = await this.supabaseClient.storage
				.from('images')
				.upload(fileName, buffer, {
					contentType: 'image/png',
					upsert: true
				});

			if (error) {
				console.error('❌ Error uploading to Supabase:', error);
				return null;
			}

			// Get public URL
			const { data: urlData } = this.supabaseClient.storage
				.from('images')
				.getPublicUrl(fileName);

			return urlData.publicUrl;
		} catch (error) {
			console.error('❌ Error uploading screenshot:', error);
			return null;
		}
	}

	formatCreationDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short'
		});
	}

	async processRepository(repository: Repository): Promise<void> {
		let githubInfo: GitHubRepository | null = null;
		let readmeContent: string | null = null;
		let homepageUrl: string | null = null;

		try {
			console.log(`\n📦 Processing repository: ${repository.repository}`);

			// Get GitHub information
			githubInfo = await this.getGitHubRepositoryInfo(repository.repository);

			// Get README content
			readmeContent = await this.getGitHubReadme(repository.repository);

			// Extract images from README if available
			let readmeImages: ImageItem[] = [];
			if (readmeContent) {
				const repoUrl = `https://github.com/${repository.repository}`;
				readmeImages = await this.extractImagesFromReadme(readmeContent, repoUrl);
				console.log(`🖼️  Found ${readmeImages.length} images in README`);
			}

			// Determine homepage URL
			homepageUrl = githubInfo.homepage || null;

			// If no homepage in GitHub data, try to extract from README
			if (!homepageUrl && readmeContent) {
				homepageUrl = this.extractHomepageFromReadme(readmeContent);
			}

			// Take screenshot of homepage if available
			let screenshotUrl: string | null = null;
			if (homepageUrl) {
				const screenshot = await this.takeScreenshot(homepageUrl);
				if (screenshot) {
					const fileName = `images/${repository.repository.replace('/', '-')}-${Date.now()}.png`;
					screenshotUrl = await this.uploadToSupabaseStorage(screenshot, fileName);
					if (screenshotUrl) {
						console.log(`✅ Screenshot uploaded: ${screenshotUrl}`);
					}
				}
			}

			// Prepare images array
			const allImages: ImageItem[] = [...readmeImages];
			if (screenshotUrl) {
				allImages.push({
					url: screenshotUrl,
					type: 'screenshot',
					width: 1280,
					height: 720
				});
			}

			// Update repository information in database
			const updateQuery = `
				UPDATE repositories
				SET
					created_at = $1,
					readme = $2,
					license = $3,
					images = $4,
					homepage = $5,
					stars = $6,
					forks = $7,
					ingested = true
				WHERE id = $8
			`;

			const licenseName = githubInfo.license?.name || null;
			const filteredImages = allImages.filter(img => !img.url.includes('star-history.com'));

			await this.dbClient.query(updateQuery, [
				githubInfo.created_at,
				readmeContent,
				licenseName,
				JSON.stringify(filteredImages),
				homepageUrl,
				githubInfo.stargazers_count,
				githubInfo.forks_count,
				repository.id
			]);

			// Display results
			console.log('\n🎉 Repository Information:');
			console.log('─'.repeat(60));
			console.log(`📛 Name: ${githubInfo.full_name}`);
			console.log(`🗓️  Created: ${this.formatCreationDate(githubInfo.created_at)}`);
			console.log(`🌟 Stars: ${githubInfo.stargazers_count.toLocaleString()}`);
			console.log(`🍴 Forks: ${githubInfo.forks_count.toLocaleString()}`);
			console.log(`📄 License: ${licenseName || 'Not specified'}`);
			console.log(`🏠 Homepage: ${homepageUrl || 'Not found'}`);
			if (homepageUrl && !githubInfo.homepage) {
				console.log(`   📝 Homepage source: README extraction`);
			} else if (githubInfo.homepage) {
				console.log(`   📝 Homepage source: GitHub repository data`);
			}
			console.log(`📖 README: ${readmeContent ? '✅ Found' : '❌ Not found'}`);
			console.log(`🖼️  Images: ${allImages.length} found`);
			if (readmeImages.length > 0) {
				console.log(`   📄 README images: ${readmeImages.length}`);
				console.log(`   🎨 Image types: ${[...new Set(readmeImages.map(img => img.type))].join(', ')}`);
			}
			if (screenshotUrl) {
				console.log(`📸 Screenshot: ✅ Taken and uploaded`);
			}
			console.log('─'.repeat(60));

		} catch (error) {
			console.error(`❌ Error processing repository ${repository.repository}:`, error);

			// Try to update the repository with partial information if we have GitHub data
			try {
				if (githubInfo) {
					const updateQuery = `
						UPDATE repositories
						SET
							created_at = $1,
							readme = $2,
							license = $3,
							homepage = $4,
							stars = $5,
							forks = $6
						WHERE id = $7
					`;

					const licenseName = githubInfo.license?.name || null;

					await this.dbClient.query(updateQuery, [
						githubInfo.created_at,
						readmeContent || null,
						licenseName,
						homepageUrl || null,
						githubInfo.stargazers_count,
						githubInfo.forks_count,
						repository.id
					]);

					console.log(`📝 Updated repository with partial information due to error`);
				}
			} catch (updateError) {
				console.error('❌ Error updating repository with partial data:', updateError);
			}

			// Continue with next repository instead of exiting
		}
	}

	async run(): Promise<void> {
		try {
			// Connect to database
			await this.connect();

			// Get all repositories with empty/null images
			console.log('📋 Fetching repositories with empty/null images...');
			const repositoriesToProcess = await this.getAllRepositoriesWithEmptyImages();

			if (repositoriesToProcess.length === 0) {
				console.log('✅ No repositories to process');
				return;
			}

			console.log(`🚀 Starting batch processing of ${repositoriesToProcess.length} repositories...\n`);

			// Process each repository with 3-second delay between API calls
			for (let i = 0; i < repositoriesToProcess.length; i++) {
				const repository = repositoriesToProcess[i];
				console.log(`\n📊 Progress: ${i + 1}/${repositoriesToProcess.length} repositories processed`);

				await this.processRepository(repository);

				// Add 3-second delay between API calls (GitHub rate limit: 60 req/min)
				if (i < repositoriesToProcess.length - 1) {
					console.log(`⏳ Waiting 3 seconds before next API call...`);
					await new Promise(resolve => setTimeout(resolve, 3000));
				}
			}

			console.log(`\n🎉 Batch processing completed! Processed ${repositoriesToProcess.length} repositories.`);

		} catch (error) {
			console.error('💥 Application error:', error);
			process.exit(1);
		} finally {
			await this.disconnect();
		}
	}
}

// Main execution
async function main() {
	console.log('🚀 Starting Enhanced Repository Fetcher...\n');

	// Validate required environment variables
	const requiredEnvVars = [
		'SUPABASE_DATABASE_HOST',
		'SUPABASE_DATABASE_NAME',
		'SUPABASE_DATABASE_USER',
		'SUPABASE_DATABASE_PASSWORD',
		'SUPABASE_DATABASE_PORT'
	];

	const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

	if (missingVars.length > 0) {
		console.error('❌ Missing required environment variables:');
		missingVars.forEach(varName => console.error(`   - ${varName}`));
		process.exit(1);
	}

	const fetcher = new RepositoryFetcher();
	await fetcher.run();
}

// Run the program
if (require.main === module) {
	main().catch(error => {
		console.error('💥 Unhandled error:', error);
		process.exit(1);
	});
}

export { RepositoryFetcher };