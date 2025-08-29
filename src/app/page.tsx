import { supabase, Repository } from "@/lib/supabase";
import { HomeClient } from "@/app/page-client";
import type { Metadata } from "next";

const ITEMS_PER_PAGE = 12;

export const metadata: Metadata = {
 title: "The Spy Project - Discover Trending Repositories & Rising Stars",
 description:
  "Explore trending GitHub repositories, rising star projects, and cutting-edge research papers. Stay updated with the latest open source innovations, AI projects, and developer tools from across the web.",
 keywords: [
  "trending repositories",
  "github trending",
  "open source projects",
  "rising stars",
  "developer tools",
  "programming",
  "software development",
  "research papers",
  "arxiv",
  "machine learning",
  "AI projects",
  "popular repositories",
  "coding projects",
 ],
 authors: [{ name: "The Spy Project" }],
 creator: "The Spy Project",
 publisher: "The Spy Project",
 metadataBase: new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com"
 ),
 alternates: {
  canonical: "/",
 },
 openGraph: {
  title: "The Spy Project - Discover Trending Repositories & Rising Stars",
  description:
   "Explore trending GitHub repositories, rising star projects, and cutting-edge research papers. Stay updated with the latest open source innovations.",
  url: "/",
  siteName: "The Spy Project",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "The Spy Project - Discover Trending Repositories & Rising Stars",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "The Spy Project - Discover Trending Repositories & Rising Stars",
  description:
   "Explore trending GitHub repositories, rising star projects, and cutting-edge research papers.",
  images: ["/og-image.png"],
  creator: "@thespyproject",
  site: "@thespyproject",
 },
 robots: {
  index: true,
  follow: true,
  googleBot: {
   index: true,
   follow: true,
   "max-video-preview": -1,
   "max-image-preview": "large",
   "max-snippet": -1,
  },
 },
};

async function getInitialData(): Promise<{
 repositories: Repository[];
 recommendedRepos: Repository[];
 totalCount: number;
}> {
 try {
  // Get total count of repositories
  const { count: totalCount, error: countError } = await supabase
   .from("repositories")
   .select("*", { count: "exact", head: true })
   .not("updated_at", "is", null);

  if (countError) throw countError;

  // Get recommended repositories (high stars + recent activity)
  const { data: recommendedData, error: recommendedError } = await supabase
   .from("repositories")
   .select("*")
   .not("updated_at", "is", null)
   .gte("stars", 1000) // At least 1k stars
   .lte("stars", 10000) // Less than 10K stars
   .order("created_at", { ascending: false }) // Order by forks for diversity
   .limit(6);

  if (recommendedError) throw recommendedError;
  const recommendedRepos = recommendedData || [];

  // Get initial repositories for infinite scroll
  const { data: initialData, error: initialError } = await supabase
   .from("repositories")
   .select("*")
   .not("updated_at", "is", null)
   .order("created_at", { ascending: false })
   .limit(ITEMS_PER_PAGE);

  if (initialError) throw initialError;
  const repositories = initialData || [];

  return {
   repositories,
   recommendedRepos,
   totalCount: totalCount || 0,
  };
 } catch (err) {
  console.error("Error fetching initial data:", err);
  return {
   repositories: [],
   recommendedRepos: [],
   totalCount: 0,
  };
 }
}

export default async function Home() {
 const { repositories, recommendedRepos, totalCount } = await getInitialData();

 const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "The Spy Project - Trending Repositories",
  description:
   "Explore trending GitHub repositories, rising star projects, and cutting-edge research papers.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com",
  mainEntity: {
   "@type": "ItemList",
   name: "Trending Repositories",
   description: "A curated list of trending and popular repositories",
   numberOfItems: totalCount,
   itemListElement: repositories.slice(0, 10).map((repo, index) => ({
    "@type": "SoftwareSourceCode",
    position: index + 1,
    name: repo.repository,
    description: repo.summary,
    url: repo.repository,
    programmingLanguage: repo.languages?.split(",")[0]?.trim(),
    author: {
     "@type": "Organization",
     name: repo.repository?.match(/github\.com\/([^\/]+)/)?.[1] || "Unknown",
    },
    aggregateRating:
     repo.stars > 0
      ? {
         "@type": "AggregateRating",
         ratingValue: Math.min(5, Math.log10(repo.stars + 1) * 1.5),
         ratingCount: repo.stars,
         bestRating: 5,
         worstRating: 1,
        }
      : undefined,
   })),
  },
  breadcrumb: {
   "@type": "BreadcrumbList",
   itemListElement: [
    {
     "@type": "ListItem",
     position: 1,
     name: "Home",
     item: process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com",
    },
   ],
  },
  publisher: {
   "@type": "Organization",
   name: "The Spy Project",
   url: process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com",
  },
 };

 return (
  <>
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
   />
   <div className="max-w-6xl mx-auto border-x">
    {/* Main Content */}
    <HomeClient
     initialRepositories={repositories}
     recommendedRepos={recommendedRepos}
     initialTotalCount={totalCount}
    />
   </div>
  </>
 );
}
