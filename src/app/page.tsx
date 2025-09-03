import { db } from "@/db";
import { repositoriesTable, type SelectRepository } from "@/db/schema";
import { eq, desc, count, and, notInArray } from "drizzle-orm";
import { HomeClient } from "@/app/page-client";
import type { Metadata } from "next";
import { type Repository, type ImageItem, supabase } from "@/lib/supabase";

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
 metadataBase: new URL("https://spy.hibuno.com"),
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
    url: "/banner.webp",
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
  images: ["/banner.webp"],
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

// Revalidate every 10 minutes (600 seconds) since data doesn't change frequently
export const revalidate = 600;

async function getInitialData(): Promise<{
 repositories: Repository[];
 recommendedRepos: Repository[];
 totalCount: number;
}> {
 try {
  // Get total count of repositories
  const totalCountResult = await db
   .select({ count: count() })
   .from(repositoriesTable)
   .where(eq(repositoriesTable.publish, true));

  const totalCount = totalCountResult[0]?.count || 0;

  // Get recommended repositories (high stars + recent activity)
  // Since we don't have the RPC function, we'll simulate it with a query
  const { data: recommendedData } = await supabase.rpc(
   "get_recommended_repos",
   {
    min_stars: 50,
    max_stars: 1000,
    limit_count: 12,
   }
  );
  const normalizeRepo = (r: SelectRepository): Repository => ({
   ...r,
   images: Array.isArray(r.images) ? (r.images as ImageItem[]) : [],
  });
  const recommendedRepos = recommendedData.map(normalizeRepo);

  // Get initial repositories for infinite scroll
  const recommendedIds = recommendedRepos.map((repo: Repository) => repo.id);

  let repositoriesRaw;
  if (recommendedIds.length > 0) {
   repositoriesRaw = await db
    .select()
    .from(repositoriesTable)
    .where(
     and(
      eq(repositoriesTable.publish, true),
      notInArray(repositoriesTable.id, recommendedIds)
     )
    )
    .orderBy(desc(repositoriesTable.created_at))
    .limit(ITEMS_PER_PAGE);
  } else {
   repositoriesRaw = await db
    .select()
    .from(repositoriesTable)
    .where(eq(repositoriesTable.publish, true))
    .orderBy(desc(repositoriesTable.created_at))
    .limit(ITEMS_PER_PAGE);
  }
  const repositories = repositoriesRaw.map(normalizeRepo);

  return {
   repositories,
   recommendedRepos,
   totalCount,
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
  url: "https://spy.hibuno.com",
  mainEntity: {
   "@type": "ItemList",
   name: "Trending Repositories",
   description: "A curated list of trending and popular repositories",
   numberOfItems: totalCount,
   itemListElement: repositories.slice(0, 10).map((repo, index) => ({
    "@type": "SoftwareSourceCode",
    position: index + 1,
    name: repo.repository || "",
    description: repo.summary || "",
    url: repo.repository || "",
    programmingLanguage: repo.languages?.split(",")[0]?.trim(),
    author: {
     "@type": "Organization",
     name: repo.repository?.match(/github\.com\/([^\/]+)/)?.[1] || "Unknown",
    },
    aggregateRating:
     repo.stars && repo.stars > 0
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
     item: "https://spy.hibuno.com",
    },
   ],
  },
  publisher: {
   "@type": "Organization",
   name: "The Spy Project",
   url: "https://spy.hibuno.com",
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
