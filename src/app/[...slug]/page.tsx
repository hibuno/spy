import { supabase, Repository, ImageItem } from "@/lib/supabase";
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
 Users,
 Network,
 Gauge,
 Rocket,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ShareDialog from "@/components/share-dialog";
import ReactMarkdown from "react-markdown";
import LazyIframe from "@/components/lazy-iframe";
import LazyImage from "@/components/lazy-image";

interface PageProps {
 params: {
  slug: string[];
 };
}

const Lightning = dynamic(() => import("@/components/lightning"), {
 loading: () => <div className="absolute inset-0 bg-muted/10 rounded" />,
});

const Threads = dynamic(() => import("@/components/threads"), {
 loading: () => <div className="w-1/2 h-[200px] bg-muted/20 rounded" />,
});

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

 const ownerRepo = repository.repository.split("/")[1];

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

 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com";
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
    .not("updated_at", "is", null)
    .eq("languages", repository.languages)
    .order("created_at", { ascending: false })
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

const getDifficultyColor = (difficulty: string) => {
 switch (difficulty?.toLowerCase()) {
  case "beginner":
   return "bg-green-900 text-green-100 border-green-700";
  case "intermediate":
   return "bg-yellow-900 text-yellow-100 border-yellow-700";
  case "advanced":
   return "bg-red-900 text-red-100 border-red-700";
  default:
   return "bg-muted text-muted-foreground border-border";
 }
};

const parseImages = (imagesString: string | null): ImageItem[] => {
 if (!imagesString) return [];
 try {
  const parsed = JSON.parse(imagesString);
  return Array.isArray(parsed) ? parsed : [];
 } catch {
  return [];
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
  return repository.repository.split("/")[1];
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
   name: repository.paper_authors || "N/A",
  },
  publisher: {
   "@type": "Organization",
   name: "The Spy Project",
   url: process.env.NEXT_PUBLIC_SITE_URL || "https://spy.hibuno.com",
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
      Back to Home
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

      {repository.arxiv_url && (
       <Button asChild variant="outline" size="sm" className="border-border">
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
       <Button asChild variant="outline" size="sm" className="border-border">
        <Link
         href={repository.huggingface_url}
         target="_blank"
         rel="noopener noreferrer"
        >
         Hugging Face
        </Link>
       </Button>
      )}
      <ShareDialog
       slug={slug}
       ownerRepo={getOwnerRepo()}
       summary={repository.summary}
      />
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
         {repository.repository}
        </h1>
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
         {repository.experience && (
          <Badge
           className={`${getExperienceColor(
            repository.experience
           )} border font-medium text-xs`}
          >
           <Award className="w-2.5 h-2.5 mr-1" />
           {repository.experience} level needed
          </Badge>
         )}
         {repository.usability && (
          <Badge
           className={`${getDifficultyColor(
            repository.usability
           )} border font-medium text-xs`}
          >
           <Gauge className="w-2.5 h-2.5 mr-1" />
           {repository.usability} on how to use
          </Badge>
         )}
         {repository.deployment && (
          <Badge
           className={`${getDifficultyColor(
            repository.deployment
           )} border font-medium text-xs`}
          >
           <Rocket className="w-2.5 h-2.5 mr-1" />
           {repository.deployment} on deployment
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
           Introduction
          </h2>
         </div>
         <div className="prose max-w-none">
          <div className="text-muted-foreground leading-relaxed text-sm prose prose-sm max-w-none">
           <ReactMarkdown
            components={{
             h1: ({ children }) => (
              <h1 className="text-lg font-bold text-foreground mt-4 mb-2">
               {children}
              </h1>
             ),
             h2: ({ children }) => (
              <h2 className="text-base font-bold text-foreground mt-3 mb-2">
               {children}
              </h2>
             ),
             h3: ({ children }) => (
              <h3 className="text-sm font-bold text-foreground mt-2 mb-1">
               {children}
              </h3>
             ),
             p: ({ children }) => (
              <p className="mb-2 leading-relaxed">{children}</p>
             ),
             code: ({ children }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
               {children}
              </code>
             ),
             pre: ({ children }) => (
              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
               {children}
              </pre>
             ),
             blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-muted pl-3 italic text-muted-foreground">
               {children}
              </blockquote>
             ),
             strong: ({ children }) => (
              <strong className="font-bold text-foreground">{children}</strong>
             ),
             em: ({ children }) => <em className="italic">{children}</em>,
             a: ({ href, children }) => (
              <a
               href={href}
               className="text-blue-600 hover:text-blue-800 underline"
               target="_blank"
               rel="noopener noreferrer"
              >
               {children}
              </a>
             ),
            }}
           >
            {repository.content}
           </ReactMarkdown>
          </div>
         </div>
        </div>
       )}

       {/* Paper Information */}
       {(repository.paper_authors || repository.paper_abstract) && (
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
          {repository.paper_scraped_at && (
           <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
             Paper Data Updated
            </h3>
            <p className="text-sm text-muted-foreground">
             {formatDate(repository.paper_scraped_at)}
            </p>
           </div>
          )}
         </div>
        </div>
       )}
      </div>

      {/* Sidebar */}
      <div className="divide-y bg-background">
       {/* Project Previews */}
       {(() => {
        const images = parseImages(repository.images as unknown as string);
        return (
         images.length > 0 && (
          <div className="p-4 bg-background">
           <h3 className="text-base font-serif font-bold text-foreground mb-3">
            Previews
           </h3>
           <ScrollArea>
            <div className="flex gap-2">
             {images.map(
              (image, index) =>
               image.url &&
               image.url !== "" && (
                <div key={index} className="flex-shrink-0">
                 <LazyImage
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="object-cover rounded border border-border"
                  width={image.width || 400}
                  height={image.height || 200}
                  showLoadingIndicator={true}
                 />
                </div>
               )
             )}
            </div>
            <ScrollBar orientation="horizontal" />
           </ScrollArea>
          </div>
         )
        );
       })()}

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
           {repository.license
            ? `${repository.license.substring(0, 28)}${
               repository.license.length > 28 ? "..." : ""
              }`
            : "Not specified"}
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
         {repository.network_count > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
           <div className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-medium text-foreground">Network</span>
           </div>
           <span className="text-sm font-serif font-bold text-foreground">
            {formatNumber(repository.network_count)}
           </span>
          </div>
         )}
         {repository.subscribers_count > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
           <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-foreground">
             Subscribers
            </span>
           </div>
           <span className="text-sm font-serif font-bold text-foreground">
            {formatNumber(repository.subscribers_count)}
           </span>
          </div>
         )}
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
       <LazyIframe
        src={repository.homepage}
        title={`${repository.repository} preview`}
        className="w-full"
        height="h-[calc(100vh-200px)]"
        loading="lazy"
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
