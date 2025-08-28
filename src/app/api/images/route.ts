import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import sizeOf from 'image-size';

interface ImageInfo {
	url: string;
	width: number;
	height: number;
	type: 'readme';
}

// Helper function to get image dimensions
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
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

// Helper function to check if image is not an icon/logo (minimum size threshold)
function isValidImage(width: number, height: number): boolean {
	const minWidth = 200;
	const minHeight = 150;
	return width >= minWidth && height >= minHeight;
}

// Helper function to parse README and extract images
async function extractImagesFromReadme(readmeContent: string, repoUrl: string): Promise<ImageInfo[]> {
	const images: ImageInfo[] = [];

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

			const promise = getImageDimensions(absoluteUrl).then(dimensions => {
				if (dimensions && isValidImage(dimensions.width, dimensions.height)) {
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

export async function GET() {
	try {
		// Step 1: Fetch repositories where images is NULL, then pick random one
		const { data: allRepos, error: fetchError } = await supabaseAdmin
			.from('repositories')
			.select('*')
			.is('images', null)
			.limit(100); // Limit to prevent memory issues

		if (fetchError) {
			throw new Error(`Database fetch error: ${fetchError.message}`);
		}

		if (!allRepos || allRepos.length === 0) {
			return NextResponse.json({
				success: true,
				message: 'No repositories found with null images',
			});
		}

		// Pick a random repository from the results
		const randomIndex = Math.floor(Math.random() * allRepos.length);
		const repository = allRepos[randomIndex];
		const images: ImageInfo[] = [];

		// Step 2: Process README images if repository exists
		if (repository.repository) {
			try {
				const repoPath = repository.repository.replace('https://github.com/', '');
				const readmeApiUrl = `https://api.github.com/repos/${repoPath}/readme`;

				const readmeResponse = await fetch(readmeApiUrl, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Accept': 'application/vnd.github.v3+json'
					}
				});

				if (readmeResponse.ok) {
					const readmeData = await readmeResponse.json();
					const readmeContent = await fetch(readmeData.download_url).then(r => r.text());

					const repoUrl = `https://github.com/${repoPath}`;
					const readmeImages = await extractImagesFromReadme(readmeContent, repoUrl);
					images.push(...readmeImages);
				}
			} catch (error) {
				console.error('Error processing README:', error);
			}
		}

		// Step 3: Update repository with images
		if (images.length > 0) {
			const { error: updateError } = await supabaseAdmin
				.from('repositories')
				.update({ images: images, updated_at: new Date().toISOString() })
				.eq('id', repository.id)
				.select();

			if (updateError) {
				throw new Error(`Database update error: ${updateError.message}`);
			}
		}

		return NextResponse.json({
			success: true,
			repository: repository.repository,
			imagesFound: images.length,
			images: images,
			homepage: repository.homepage,
		});

	} catch (error) {
		console.error('Cron job error:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		}, { status: 500 });
	}
}