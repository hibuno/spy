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

	async getAllUnprocessedRepositories(): Promise<Repository[]> {
		try {
			const query = `
	       SELECT * FROM repositories
	       WHERE created_at IS NULL
	     `;

			const result = await this.dbClient.query(query);

			if (result.rows.length === 0) {
				console.log('✅ All repositories have been processed');
				return [];
			}

			console.log(`📋 Found ${result.rows.length} unprocessed repositories`);
			return result.rows as Repository[];
		} catch (error) {
			console.error('❌ Error fetching unprocessed repositories:', error);
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

	async extractImagesFromReadme(readmeContent: string, repoUrl: string): Promise<ImageItem[]> {
		const images: ImageItem[] = [];

		try {
			const processor = unified().use(remarkParse);
			const tree = processor.parse(readmeContent);

			const imagePromises: Promise<void>[] = [];

			visit(tree, 'image', (node: { url: string }) => {
				const imageUrl = node.url;

				// Convert relative URLs to absolute
				let absoluteUrl = imageUrl;
				if (imageUrl.startsWith('./') || imageUrl.startsWith('../')) {
					absoluteUrl = `${repoUrl}/raw/main/${imageUrl.replace('./', '')}`;
				} else if (imageUrl.startsWith('/')) {
					absoluteUrl = `${repoUrl}${imageUrl}`;
				} else if (!imageUrl.startsWith('http')) {
					absoluteUrl = `${repoUrl}/raw/main/${imageUrl}`;
				}

				const promise = this.getImageDimensions(absoluteUrl).then(dimensions => {
					if (dimensions && this.isValidImage(dimensions.width, dimensions.height)) {
						images.push({
							url: absoluteUrl,
							width: dimensions.width,
							height: dimensions.height,
							type: 'readme'
						});
					}
				}).catch(error => {
					console.error('Error processing image:', absoluteUrl, error);
				});

				imagePromises.push(promise);
			});

			await Promise.all(imagePromises);
		} catch (error) {
			console.error('Error parsing README:', error);
		}

		return images;
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
			const dimensions = sizeOf(Buffer.from(buffer));

			if (!dimensions.width || !dimensions.height) return null;

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

	async takeScreenshot(url: string): Promise<Buffer | null> {
		let browser;
		try {
			console.log(`📸 Taking screenshot of: ${url}`);
			browser = await chromium.launch();
			const page = await browser.newPage();

			// Set viewport size
			await page.setViewportSize({ width: 1280, height: 720 });

			// Navigate to the page
			await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

			// Wait a bit for dynamic content to load
			await page.waitForTimeout(2000);

			// Take screenshot
			const screenshot = await page.screenshot({
				fullPage: false,
				type: 'png'
			});

			return screenshot as Buffer;
		} catch (error) {
			console.error('❌ Error taking screenshot:', error);
			return null;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
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
		try {
			console.log(`\n📦 Processing repository: ${repository.repository}`);

			// Get GitHub information
			const githubInfo = await this.getGitHubRepositoryInfo(repository.repository);

			// Get README content
			const readmeContent = await this.getGitHubReadme(repository.repository);

			// Extract images from README if available
			let readmeImages: ImageItem[] = [];
			if (readmeContent) {
				const repoUrl = `https://github.com/${repository.repository}`;
				readmeImages = await this.extractImagesFromReadme(readmeContent, repoUrl);
				console.log(`🖼️  Found ${readmeImages.length} images in README`);
			}

			// Take screenshot of homepage if available
			let screenshotUrl: string | null = null;
			if (githubInfo.homepage) {
				const screenshot = await this.takeScreenshot(githubInfo.homepage);
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
			       forks = $7
			     WHERE id = $8
			   `;

			const licenseName = githubInfo.license?.name || null;

			await this.dbClient.query(updateQuery, [
				githubInfo.created_at,
				readmeContent,
				licenseName,
				JSON.stringify(allImages),
				githubInfo.homepage,
				githubInfo.stargazers_count,
				githubInfo.forks_count,
				repository.id
			]);

			// Display results
			console.log('\n🎉 Repository Information:');
			console.log('─'.repeat(50));
			console.log(`📛 Name: ${githubInfo.full_name}`);
			console.log(`🗓️  Created: ${this.formatCreationDate(githubInfo.created_at)}`);
			console.log(`🌟 Stars: ${githubInfo.stargazers_count.toLocaleString()}`);
			console.log(`🍴 Forks: ${githubInfo.forks_count.toLocaleString()}`);
			console.log(`📄 License: ${licenseName || 'Not specified'}`);
			console.log(`🏠 Homepage: ${githubInfo.homepage || 'Not specified'}`);
			console.log(`📖 README: ${readmeContent ? '✅ Found' : '❌ Not found'}`);
			console.log(`🖼️  Images: ${allImages.length} found`);
			if (screenshotUrl) {
				console.log(`📸 Screenshot: ✅ Taken and uploaded`);
			}
			console.log('─'.repeat(50));

		} catch (error) {
			console.error(`❌ Error processing repository ${repository.repository}:`, error);
			// Continue with next repository instead of exiting
		}
	}

	async run(): Promise<void> {
		try {
			// Connect to database
			await this.connect();

			// Get all unprocessed repositories
			console.log('📋 Fetching all unprocessed repositories...');
			const unprocessedRepos = await this.getAllUnprocessedRepositories();

			if (unprocessedRepos.length === 0) {
				console.log('✅ No repositories to process');
				return;
			}

			console.log(`🚀 Starting batch processing of ${unprocessedRepos.length} repositories...\n`);

			// Process each repository with 3-second delay between API calls
			for (let i = 0; i < unprocessedRepos.length; i++) {
				const repository = unprocessedRepos[i];
				console.log(`\n📊 Progress: ${i + 1}/${unprocessedRepos.length} repositories processed`);

				await this.processRepository(repository);

				// Add 3-second delay between API calls (GitHub rate limit: 60 req/min)
				if (i < unprocessedRepos.length - 1) {
					console.log(`⏳ Waiting 3 seconds before next API call...`);
					await new Promise(resolve => setTimeout(resolve, 3000));
				}
			}

			console.log(`\n🎉 Batch processing completed! Processed ${unprocessedRepos.length} repositories.`);

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
	console.log('🚀 Starting Repository Creation Date Fetcher...\n');

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