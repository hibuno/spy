/**
 * GitHub Service
 *
 * Fetches repository data from GitHub API
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  language: string | null;
  languages_url: string;
  archived: boolean;
  disabled: boolean;
  default_branch: string;
  network_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubReadme {
  content: string; // Base64 encoded
  encoding: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string;
}

export interface GitHubLanguages {
  [language: string]: number; // bytes of code
}

/**
 * Fetch repository data from GitHub API
 */
export async function fetchGitHubRepository(
  owner: string,
  repo: string
): Promise<GitHubRepository | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "The-Spy-Project",
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Repository not found: ${owner}/${repo}`);
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching repository ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Fetch README content from GitHub API
 */
export async function fetchGitHubReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "The-Spy-Project",
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`README not found: ${owner}/${repo}`);
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: GitHubReadme = await response.json();

    // Decode base64 content
    if (data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }

    return data.content;
  } catch (error) {
    console.error(`Error fetching README ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Fetch language statistics from GitHub API
 */
export async function fetchGitHubLanguages(
  owner: string,
  repo: string
): Promise<string[] | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "The-Spy-Project",
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
      { headers }
    );

    if (!response.ok) {
      return null;
    }

    const languages: GitHubLanguages = await response.json();

    // Sort by bytes and return language names
    return Object.keys(languages).sort((a, b) => languages[b] - languages[a]);
  } catch (error) {
    console.error(`Error fetching languages ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Parse repository path from various formats
 */
export function parseRepositoryPath(
  repository: string
): { owner: string; repo: string } | null {
  // Remove common prefixes
  let path = repository
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .trim();

  // Split by /
  const parts = path.split("/").filter(Boolean);

  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1],
    };
  }

  return null;
}

/**
 * Extract images from README markdown
 */
export function extractImagesFromReadme(readme: string): string[] {
  const images: string[] = [];

  // Match markdown images: ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownImageRegex.exec(readme)) !== null) {
    const url = match[2];
    if (url && !url.startsWith("data:")) {
      images.push(url);
    }
  }

  // Match HTML images: <img src="url">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;

  while ((match = htmlImageRegex.exec(readme)) !== null) {
    const url = match[1];
    if (url && !url.startsWith("data:") && !images.includes(url)) {
      images.push(url);
    }
  }

  // Limit to first 10 images
  return images.slice(0, 10);
}

/**
 * Determine experience level based on repository characteristics
 */
export function determineExperienceLevel(
  languages: string[],
  topics: string[],
  description: string | null
): string {
  const advancedKeywords = [
    "advanced",
    "expert",
    "professional",
    "enterprise",
    "production",
    "distributed",
    "microservices",
    "kubernetes",
    "docker",
    "cloud",
  ];

  const beginnerKeywords = [
    "beginner",
    "tutorial",
    "learning",
    "starter",
    "simple",
    "basic",
    "intro",
    "getting-started",
  ];

  const text = `${topics.join(" ")} ${description || ""}`.toLowerCase();

  if (advancedKeywords.some((keyword) => text.includes(keyword))) {
    return "advanced";
  }

  if (beginnerKeywords.some((keyword) => text.includes(keyword))) {
    return "beginner";
  }

  // Check language complexity
  const advancedLanguages = ["Rust", "C++", "C", "Assembly", "Haskell"];
  if (languages.some((lang) => advancedLanguages.includes(lang))) {
    return "advanced";
  }

  return "intermediate";
}

/**
 * Determine usability level
 */
export function determineUsabilityLevel(
  hasReadme: boolean,
  hasHomepage: boolean,
  topics: string[]
): string {
  if (!hasReadme) {
    return "difficult";
  }

  const goodDocsKeywords = ["documentation", "docs", "tutorial", "guide"];
  if (
    hasHomepage ||
    topics.some((topic) => goodDocsKeywords.includes(topic.toLowerCase()))
  ) {
    return "easy";
  }

  return "intermediate";
}

/**
 * Determine deployment difficulty
 */
export function determineDeploymentLevel(
  languages: string[],
  topics: string[]
): string {
  const easyDeploy = ["javascript", "typescript", "python", "ruby", "php"];
  const hardDeploy = ["c", "c++", "rust", "assembly"];

  const topicsText = topics.join(" ").toLowerCase();

  if (
    topicsText.includes("docker") ||
    topicsText.includes("kubernetes") ||
    topicsText.includes("serverless")
  ) {
    return "intermediate";
  }

  if (languages.some((lang) => easyDeploy.includes(lang.toLowerCase()))) {
    return "easy";
  }

  if (languages.some((lang) => hardDeploy.includes(lang.toLowerCase()))) {
    return "expert";
  }

  return "advanced";
}
