import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface OSSInsightRepository {
	repo_id: string;
	repo_name: string;
	primary_language: string;
	description: string;
	stars: string;
	forks: string;
	pull_requests: string;
	pushes: string;
	total_score: string;
	contributor_logins: string;
	collection_names: string;
	existsInDB: boolean;
}

export async function GET() {
	try {
		// Fetch OSS Insight trending repositories
		const response = await fetch('https://api.ossinsight.io/v1/trends/repos', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const apiResponse = await response.json();
		const repositories: OSSInsightRepository[] = apiResponse.data.rows;
		const scrapedRepos: Array<{ href: string; url: string; name: string; existsInDB?: boolean }> = [];

		repositories.sort((a, b) => parseInt(b.stars) - parseInt(a.stars));

		repositories.forEach(repo => {
			scrapedRepos.push({
				href: repo.repo_name,
				url: `https://github.com/${repo.repo_name}`,
				name: repo.repo_name
			});
		});

		// Check which repositories already exist in the database
		const existingRepos = await supabase
			.from('repositories')
			.select('repository')
			.in('repository', scrapedRepos.map(repo => repo.href));

		const existingHrefs = new Set(
			existingRepos.data?.map(repo => repo.repository) || []
		);

		// Add database status to each repository
		scrapedRepos.forEach(repo => {
			scrapedRepos.push({
				...repo,
				existsInDB: existingHrefs.has(repo.href)
			});
		});

		return new Response(JSON.stringify({
			success: true,
			count: scrapedRepos.slice(0, 50).filter(repo => !repo.existsInDB).length,
			repositories: scrapedRepos.slice(0, 50).filter(repo => !repo.existsInDB),
			timestamp: new Date().toISOString()
		}), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}
