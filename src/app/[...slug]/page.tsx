import { supabase, Repository } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RepositoryGrid } from "@/components/repository-grid";
import {
 ArrowLeft,
 Star,
 GitFork,
 Eye,
 Github,
 Calendar,
 AlertCircle,
 Activity,
 Award,
 Globe,
 BookOpen,
 Shield,
 Clock,
 GitBranch,
 Share2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Lightning from "@/components/lightning";
import type { Metadata } from "next";
import Threads from "@/components/threads";

interface PageProps {
 params: {
  slug: string[];
 };
}

export async function generateMetadata({
 params,
}: PageProps): Promise<Metadata> {
 const resolvedParams = await params;
 const slug = resolvedParams.slug.join("/");
 const { repository } = await getRepository(slug);

 if (!repository) {
  return {
   title: "Repository Not Found - The Spy Project",
   description: "The requested repository could not be found.",
  };
 }

 const ownerRepo = repository.repository
  ? repository.repository.match(/github\.com\/([^\/]+\/[^\/]+)/)?.[1] ||
    repository.title
  : repository.title;

 const description =
  repository.summary ||
  repository.content?.slice(0, 160) ||
  `Explore ${ownerRepo} - a trending repository on The Spy Project.`;
 const stars = repository.stars
  ? ` with ${repository.stars.toLocaleString()} stars`
  : "";
 const languages = repository.languages
  ? repository.languages.split(",").slice(0, 3).join(", ")
  : "";
 const languageText = languages ? ` Built with ${languages}.` : "";

 const fullDescription = `${description}${stars}${languageText} Discover more trending repositories on The Spy Project.`;

 const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trending.hibuno.com";
 const canonicalUrl = `${baseUrl}/${slug}`;

 return {
  title: `${ownerRepo} - The Spy Project`,
  description: fullDescription.slice(0, 160),
  keywords: [
   ownerRepo,
   "github repository",
   "open source",
   "trending",
   ...(repository.languages?.split(",").map((lang) => lang.trim()) || []),
   ...(repository.tags?.split(",").map((tag) => tag.trim()) || []),
  ],
  authors: [{ name: "The Spy Project" }],
  creator: "The Spy Project",
  publisher: "The Spy Project",
  metadataBase: new URL(baseUrl),
  alternates: {
   canonical: canonicalUrl,
  },
  openGraph: {
   title: `${ownerRepo} - The Spy Project`,
   description: fullDescription.slice(0, 160),
   url: canonicalUrl,
   siteName: "The Spy Project",
   locale: "en_US",
   type: "article",
   publishedTime: repository.created_at,
   modifiedTime: repository.updated_at || repository.created_at,
   authors: [repository.paper_authors || "The Spy Project"],
   tags: repository.tags?.split(",").map((tag) => tag.trim()) || [],
   images: [
    {
     url: "/og-image.png",
     width: 1200,
     height: 630,
     alt: `${ownerRepo} - Repository on The Spy Project`,
    },
   ],
  },
  twitter: {
   card: "summary_large_image",
   title: `${ownerRepo} - The Spy Project`,
   description: fullDescription.slice(0, 160),
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
}

async function getRepository(slug: string): Promise<{
 repository: Repository | null;
 relatedRepos: Repository[];
}> {
 try {
  let repository: Repository | null = null;

  // First try GitHub format: owner/repo
  const { data: repos, error: repoError } = await supabase
   .from("repositories")
   .select("*")
   .eq("repository", slug)
   .single();

  if (!repoError) {
   repository = repos;
  } else if (repoError.code === "PGRST116") {
   // If not found by GitHub URL, try to find by title slug
   const titleSlug = slug.replace(/-/g, " ");
   const { data: titleRepos, error: titleError } = await supabase
    .from("repositories")
    .select("*")
    .ilike("title", `%${titleSlug}%`)
    .single();

   if (!titleError) {
    repository = titleRepos;
   }
  }

  if (!repository) {
   return { repository: null, relatedRepos: [] };
  }

  // Fetch related repositories based on language
  let relatedRepos: Repository[] = [];
  if (repository.languages) {
   const { data: related, error: relatedError } = await supabase
    .from("repositories")
    .select("*")
    .neq("id", repository.id)
    .eq("archived", false)
    .eq("disabled", false)
    .order("stars", { ascending: false })
    .limit(6);

   if (!relatedError) {
    relatedRepos = related || [];
   }
  }

  return { repository, relatedRepos };
 } catch (err) {
  console.error("Error fetching repository:", err);
  return { repository: null, relatedRepos: [] };
 }
}

const formatNumber = (num: number) => {
 if (num >= 1000000) {
  return `${(num / 1000000).toFixed(1)}M`;
 }
 if (num >= 1000) {
  return `${(num / 1000).toFixed(1)}k`;
 }
 return (num || 0).toString();
};

const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
 });
};

const getExperienceColor = (experience: string) => {
 switch (experience?.toLowerCase()) {
  case "beginner":
   return "bg-green-900 text-green-100 border-green-700";
  case "intermediate":
   return "bg-blue-900 text-blue-100 border-blue-700";
  case "advanced":
   return "bg-purple-900 text-purple-100 border-purple-700";
  default:
   return "bg-muted text-muted-foreground border-border";
 }
};

export default async function RepositoryDetail({ params }: PageProps) {
 const resolvedParams = await params;
 const slug = resolvedParams.slug.join("/");
 const { repository, relatedRepos } = await getRepository(slug);

 if (!repository) {
  notFound();
 }

 const languages =
  repository.languages?.split(",").map((lang: string) => lang.trim()) || [];
 const tags =
  repository.tags?.split(",").map((tag: string) => tag.trim()) || [];

 // Extract owner/repo from repository URL for display
 const getOwnerRepo = () => {
  if (repository.repository) {
   const match = repository.repository.match(/github\.com\/([^\/]+\/[^\/]+)/);
   if (match) {
    return match[1];
   }
  }
  return repository.title;
 };

 const isPopular = repository.stars > 1000;
 const isTrending = repository.stars > 5000;

 const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: getOwnerRepo(),
  description: repository.summary || repository.content,
  url: repository.repository,
  codeRepository: repository.repository,
  programmingLanguage: repository.languages
   ?.split(",")
   .map((lang) => lang.trim()),
  runtimePlatform: repository.languages?.split(",")[0]?.trim(),
  author: {
   "@type": "Organization",
   name: repository.paper_authors || getOwnerRepo().split("/")[0],
  },
  publisher: {
   "@type": "Organization",
   name: "The Spy Project",
   url: process.env.NEXT_PUBLIC_SITE_URL || "https://trending.hibuno.com",
  },
  dateCreated: repository.created_at,
  dateModified: repository.updated_at || repository.created_at,
  license: repository.license,
  keywords: repository.tags
   ?.split(",")
   .map((tag) => tag.trim())
   .join(", "),
  aggregateRating:
   repository.stars > 0
    ? {
       "@type": "AggregateRating",
       ratingValue: Math.min(5, Math.log10(repository.stars + 1) * 1.5),
       ratingCount: repository.stars,
       bestRating: 5,
       worstRating: 1,
      }
    : undefined,
  interactionStatistic: [
   {
    "@type": "InteractionCounter",
    interactionType: "https://schema.org/LikeAction",
    userInteractionCount: repository.stars,
   },
   {
    "@type": "InteractionCounter",
    interactionType: "https://schema.org/ShareAction",
    userInteractionCount: repository.forks,
   },
   {
    "@type": "InteractionCounter",
    interactionType: "https://schema.org/FollowAction",
    userInteractionCount: repository.watching,
   },
  ],
 };

 return (
  <>
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
   />
   <div className="w-full max-w-6xl mx-auto border-x">
    <div className="flex items-center justify-between px-6 py-2 sticky top-[93px] z-50 bg-background border-b">
     <Link
      href="/"
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
     >
      <ArrowLeft className="w-4 h-4" />
      Back to Trending
     </Link>
     <div className="flex items-center gap-2">
      <Button
       asChild
       className="bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 h-auto"
      >
       <Link
        href={`https://github.com/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
       >
        <Github className="w-3.5 h-3.5" />
        GitHub
       </Link>
      </Button>
      {repository.homepage && (
       <Button asChild variant="outline" size="sm" className="border-border">
        <Link
         href={repository.homepage}
         target="_blank"
         rel="noopener noreferrer"
        >
         <Globe className="w-3.5 h-3.5 mr-1.5" />
         Website
        </Link>
       </Button>
      )}
      <Button variant="outline" size="sm" className="border-border">
       <Share2 className="w-3.5 h-3.5 mr-1.5" />
       Share
      </Button>
     </div>
    </div>

    <div className="relative bg-background border-b p-6">
     <div className="w-1/2 h-[200px] absolute -top-10 right-0 z-0 opacity-35">
      <Threads amplitude={1} distance={0} enableMouseInteraction={true} />
      <div className="bg-gradient-to-r from-background to-transparent absolute top-0 left-0 w-full h-full"></div>
     </div>
     <div className="flex items-start justify-between gap-4 relative z-10">
      <div className="flex items-start gap-3 flex-1 min-w-0">
       <div className="flex-1 min-w-0">
        <h1 className="text-xl font-serif font-bold text-foreground mb-2">
         {getOwnerRepo()}
        </h1>
        <div className="flex items-center gap-1.5 mb-2">
         {repository.experience && (
          <Badge
           className={`${getExperienceColor(
            repository.experience
           )} border font-medium text-xs`}
          >
           <Award className="w-2.5 h-2.5 mr-1" />
           {repository.experience}
          </Badge>
         )}
         {isTrending && (
          <Badge className="bg-muted text-muted-foreground border-border border font-medium text-xs">
           <Activity className="w-2.5 h-2.5 mr-1" />
           Trending
          </Badge>
         )}
         {isPopular && (
          <Badge className="bg-muted text-muted-foreground border-border border font-medium text-xs">
           <Star className="w-2.5 h-2.5 mr-1" />
           Popular
          </Badge>
         )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
         {repository.summary}
        </p>
       </div>
      </div>
     </div>
    </div>

    {/* Main Content */}
    <div className="max-w-6xl mx-auto">
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-[1px] bg-border">
      {/* Main Content */}
      <div className="lg:col-span-2 divide-y bg-background">
       {/* About Section */}
       {repository.content && (
        <div className="p-4 bg-background">
         <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-muted rounded border border-border">
           <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">
           About This Project
          </h2>
         </div>
         <div className="prose max-w-none">
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm prose">
           {repository.content}
          </div>
         </div>
        </div>
       )}

       {/* Paper Information */}
       {(repository.arxiv_url ||
        repository.huggingface_url ||
        repository.paper_authors ||
        repository.paper_abstract) && (
        <div className="p-4 bg-background">
         <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-muted rounded border border-border">
           <BookOpen className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="text-lg font-serif font-bold text-foreground">
           Research Paper
          </h2>
         </div>
         <div className="space-y-3">
          {repository.paper_authors && (
           <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
             Authors
            </h3>
            <p className="text-sm text-muted-foreground">
             {repository.paper_authors}
            </p>
           </div>
          )}
          {repository.paper_abstract && (
           <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
             Abstract
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
             {repository.paper_abstract}
            </p>
           </div>
          )}
          <div className="flex flex-wrap gap-2">
           {repository.arxiv_url && (
            <Button
             asChild
             variant="outline"
             size="sm"
             className="border-border"
            >
             <Link
              href={repository.arxiv_url}
              target="_blank"
              rel="noopener noreferrer"
             >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              View on arXiv
             </Link>
            </Button>
           )}
           {repository.huggingface_url && (
            <Button
             asChild
             variant="outline"
             size="sm"
             className="border-border"
            >
             <Link
              href={repository.huggingface_url}
              target="_blank"
              rel="noopener noreferrer"
             >
              <Github className="w-3.5 h-3.5 mr-1.5" />
              Hugging Face
             </Link>
            </Button>
           )}
          </div>
         </div>
        </div>
       )}
      </div>

      {/* Sidebar */}
      <div className="divide-y bg-background">
       {/* Project Details */}
       <div className="p-4 bg-background">
        <h3 className="text-base font-serif font-bold text-foreground mb-3">
         Project Details
        </h3>
        <div className="space-y-2">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
           <Shield className="w-3.5 h-3.5" />
           <span className="text-xs">License</span>
          </div>
          <Badge variant="outline" className="text-xs border-border">
           {repository.license || "Not specified"}
          </Badge>
         </div>
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
           <Calendar className="w-3.5 h-3.5" />
           <span className="text-xs">Added</span>
          </div>
          <span className="text-xs text-foreground font-medium">
           {formatDate(repository.created_at)}
          </span>
         </div>
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
           <Clock className="w-3.5 h-3.5" />
           <span className="text-xs">Updated</span>
          </div>
          <span className="text-xs text-foreground font-medium">
           {formatDate(repository.updated_at || repository.created_at)}
          </span>
         </div>
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
           <GitBranch className="w-3.5 h-3.5" />
           <span className="text-xs">Default Branch</span>
          </div>
          <Badge variant="outline" className="text-xs border-border">
           {repository.default_branch || "main"}
          </Badge>
         </div>
        </div>
       </div>

       {/* Repository Stats */}
       <div className="p-4 bg-background">
        <h3 className="text-base font-serif font-bold text-foreground mb-3">
         Repository Statistics
        </h3>
        <div className="space-y-3">
         <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
          <div className="flex items-center gap-1.5">
           <Star className="w-3.5 h-3.5 text-yellow-500" />
           <span className="text-xs font-medium text-foreground">Stars</span>
          </div>
          <span className="text-sm font-serif font-bold text-foreground">
           {formatNumber(repository.stars)}
          </span>
         </div>
         <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
          <div className="flex items-center gap-1.5">
           <GitFork className="w-3.5 h-3.5 text-blue-500" />
           <span className="text-xs font-medium text-foreground">Forks</span>
          </div>
          <span className="text-sm font-serif font-bold text-foreground">
           {formatNumber(repository.forks)}
          </span>
         </div>
         <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
          <div className="flex items-center gap-1.5">
           <Eye className="w-3.5 h-3.5 text-green-500" />
           <span className="text-xs font-medium text-foreground">Watchers</span>
          </div>
          <span className="text-sm font-serif font-bold text-foreground">
           {formatNumber(repository.watching)}
          </span>
         </div>
         <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
          <div className="flex items-center gap-1.5">
           <AlertCircle className="w-3.5 h-3.5 text-red-500" />
           <span className="text-xs font-medium text-foreground">
            Open Issues
           </span>
          </div>
          <span className="text-sm font-serif font-bold text-foreground">
           {formatNumber(repository.open_issues)}
          </span>
         </div>
        </div>
       </div>

       {/* Languages & Technologies */}
       {languages.length > 0 && (
        <div className="p-4 bg-background">
         <h3 className="text-base font-serif font-bold text-foreground mb-3">
          Languages
         </h3>
         <div className="space-y-2">
          {languages.map((lang, index) => (
           <div
            key={index}
            className="flex items-center gap-2 p-2 bg-muted rounded border border-border"
           >
            <div
             className={`w-2.5 h-2.5 rounded-full ${
              lang === "JavaScript"
               ? "bg-yellow-400"
               : lang === "TypeScript"
               ? "bg-blue-500"
               : lang === "Python"
               ? "bg-green-500"
               : lang === "Java"
               ? "bg-red-500"
               : lang === "Go"
               ? "bg-cyan-500"
               : "bg-gray-400"
             }`}
            />
            <span className="font-medium text-foreground text-xs">{lang}</span>
           </div>
          ))}
         </div>
        </div>
       )}

       {/* Tags */}
       {tags.length > 0 && (
        <div className="p-4 bg-background">
         <h3 className="text-base font-serif font-bold text-foreground mb-3">
          Tags
         </h3>
         <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
           <Badge
            key={index}
            className="text-xs px-2 py-1 bg-muted text-muted-foreground border-border border font-medium"
           >
            #{tag}
           </Badge>
          ))}
         </div>
        </div>
       )}
      </div>
     </div>

     {repository.homepage && (
      <div className="bg-background overflow-hidden border-y">
       <div className="p-4 border-b">
        <div className="flex items-center gap-1.5">
         <Globe className="w-4 h-4 text-muted-foreground" />
         <span className="text-sm font-medium text-foreground">
          Live Preview
         </span>
         <Badge variant="outline" className="text-xs border-border ml-auto">
          External Link
         </Badge>
        </div>
       </div>
       <iframe
        src={repository.homepage}
        className="w-full h-[calc(100vh-200px)] bg-background"
        title={`${repository.title} preview`}
        sandbox="allow-scripts allow-same-origin allow-forms"
       />
      </div>
     )}

     {/* Related Repositories */}
     {relatedRepos.length > 0 && (
      <>
       <div className="flex items-center justify-between px-4 py-3 border-y relative bg-black overflow-hidden">
        <h2 className="font-serif font-bold text-foreground z-10">
         Related Projects
        </h2>
        <div className="absolute z-0">
         <Lightning hue={0} xOffset={0} speed={1} intensity={1} size={1} />
        </div>
        <p className="text-xs text-muted-foreground">
         Discover more amazing projects similar to this one
        </p>
       </div>
       <RepositoryGrid repositories={relatedRepos} />
      </>
     )}
    </div>
   </div>
  </>
 );
}
