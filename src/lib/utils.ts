import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Utility function to validate and clean repository paths
export function validateRepositoryPath(repoPath: string): string | null {
	if (!repoPath) return null;

	let cleanPath = repoPath;

	// Remove domain if present
	if (cleanPath.includes('github.com/')) {
		cleanPath = cleanPath.replace('github.com/', '');
	}

	// Remove leading slash
	cleanPath = cleanPath.replace(/^\//, '');

	// Validate format: should contain exactly one slash and no additional slashes or domains
	const parts = cleanPath.split('/');
	if (parts.length !== 2) return null;
	if (!parts[0] || !parts[1]) return null;
	if (cleanPath.includes('http') || cleanPath.includes('://')) return null;

	return cleanPath;
}
