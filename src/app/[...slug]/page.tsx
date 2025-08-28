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
 Code,
 Zap,
 Activity,
 Award,
 Globe,
 BookOpen,
 Shield,
 Clock,
 GitBranch,
 Heart,
 Share2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
 params: {
  slug: string[];
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
   return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700";
  case "intermediate":
   return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700";
  case "advanced":
   return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700";
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

 return (
  <div className="w-full max-w-6xl mx-auto border-x">
   <div className="flex items-center justify-between px-6 py-2.5 sticky top-[93px] z-50 bg-background border-b">
    <Link
     href="/"
     className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
     <ArrowLeft className="w-4 h-4" />
     Back to Trending
    </Link>
    <div className="flex items-center gap-3">
     <Button variant="outline" size="sm" className="border-border">
      <Share2 className="w-4 h-4 mr-2" />
      Share
     </Button>
     <Button variant="outline" size="sm" className="border-border">
      <Heart className="w-4 h-4 mr-2" />
      Save
     </Button>
    </div>
   </div>

   <div className="">
    {/* Header */}
    <div className="border-b p-6">
     {/* Repository Header */}
     <div className="">
      <div className="flex items-start justify-between gap-6">
       <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
         <div className="p-3 bg-muted rounded-xl border border-border">
          <Github className="w-8 h-8 text-muted-foreground" />
         </div>
         <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
           {getOwnerRepo()}
          </h1>
          <div className="flex items-center gap-1.5">
           {repository.experience && (
            <Badge
             className={`${getExperienceColor(
              repository.experience
             )} border font-medium`}
            >
             <Award className="w-3 h-3 mr-1" />
             {repository.experience}
            </Badge>
           )}
           {isTrending && (
            <Badge className="bg-muted text-muted-foreground border-border border font-medium">
             <Activity className="w-3 h-3 mr-1" />
             Trending
            </Badge>
           )}
           {isPopular && (
            <Badge className="bg-muted text-muted-foreground border-border border font-medium">
             <Star className="w-3 h-3 mr-1" />
             Popular
            </Badge>
           )}
          </div>
         </div>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-3xl">
         {repository.summary}
        </p>
       </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
       <Button
        asChild
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
       >
        <Link
         href={`https://github.com/${slug}`}
         target="_blank"
         rel="noopener noreferrer"
        >
         <Github className="w-5 h-5 mr-2" />
         View on GitHub
        </Link>
       </Button>
       {repository.homepage && (
        <Button asChild variant="outline" size="lg" className="border-border">
         <Link
          href={repository.homepage}
          target="_blank"
          rel="noopener noreferrer"
         >
          <Globe className="w-5 h-5 mr-2" />
          Visit Website
         </Link>
        </Button>
       )}
      </div>
     </div>
    </div>
   </div>

   {/* Main Content */}
   <div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-border">
     {/* Main Content */}
     <div className="lg:col-span-2 space-y-[1px]">
      {/* About Section */}
      {repository.content && (
       <div className="p-8 bg-background">
        <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-muted rounded-lg border border-border">
          <BookOpen className="w-5 h-5 text-blue-600" />
         </div>
         <h2 className="text-2xl font-serif font-bold text-foreground">
          About This Project
         </h2>
        </div>
        <div className="prose max-w-none">
         <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-base font-mono">
          {repository.content}
         </div>
        </div>
       </div>
      )}

      {/* Languages & Technologies */}
      {languages.length > 0 && (
       <div className="p-8 bg-background">
        <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-muted rounded-lg border border-border">
          <Code className="w-5 h-5 text-purple-600" />
         </div>
         <h2 className="text-2xl font-serif font-bold text-foreground">
          Languages & Technologies
         </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
         {languages.map((lang, index) => (
          <div
           key={index}
           className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border"
          >
           <div
            className={`w-4 h-4 rounded-full ${
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
           <span className="font-medium text-foreground">{lang}</span>
          </div>
         ))}
        </div>
       </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
       <div className="p-8 bg-background">
        <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-muted rounded-lg border border-border">
          <Zap className="w-5 h-5 text-pink-600" />
         </div>
         <h2 className="text-2xl font-serif font-bold text-foreground">
          Tags & Categories
         </h2>
        </div>
        <div className="flex flex-wrap gap-3">
         {tags.map((tag, index) => (
          <Badge
           key={index}
           className="text-sm px-4 py-2 bg-muted text-muted-foreground border-border border font-medium"
          >
           #{tag}
          </Badge>
         ))}
        </div>
       </div>
      )}
     </div>

     {/* Sidebar */}
     <div className="space-y-[1px]">
      {/* Project Details */}
      <div className="p-6 bg-background">
       <h3 className="text-lg font-serif font-bold text-foreground mb-4">
        Project Details
       </h3>
       <div className="space-y-2">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-sm">License</span>
         </div>
         <Badge variant="outline" className="text-xs border-border">
          {repository.license || "Not specified"}
         </Badge>
        </div>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Created</span>
         </div>
         <span className="text-sm text-foreground font-medium">
          {formatDate(repository.created_at)}
         </span>
        </div>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Updated</span>
         </div>
         <span className="text-sm text-foreground font-medium">
          {formatDate(repository.updated_at || repository.created_at)}
         </span>
        </div>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-muted-foreground">
          <GitBranch className="w-4 h-4" />
          <span className="text-sm">Default Branch</span>
         </div>
         <Badge variant="outline" className="text-xs border-border">
          {repository.default_branch || "main"}
         </Badge>
        </div>
       </div>
      </div>

      {/* Repository Stats */}
      <div className="p-6 bg-background">
       <h3 className="text-lg font-serif font-bold text-foreground mb-4">
        Repository Statistics
       </h3>
       <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
         <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">Stars</span>
         </div>
         <span className="text-lg font-serif font-bold text-foreground">
          {formatNumber(repository.stars)}
         </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
         <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">Forks</span>
         </div>
         <span className="text-lg font-serif font-bold text-foreground">
          {formatNumber(repository.forks)}
         </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
         <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-foreground">Watchers</span>
         </div>
         <span className="text-lg font-serif font-bold text-foreground">
          {formatNumber(repository.watching)}
         </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
         <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">
           Open Issues
          </span>
         </div>
         <span className="text-lg font-serif font-bold text-foreground">
          {formatNumber(repository.open_issues)}
         </span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Related Repositories */}
    {relatedRepos.length > 0 && (
     <>
      <div className="flex items-center justify-between px-6 py-4 border-y">
       <h2 className="font-serif font-bold text-foreground">
        Related Projects
       </h2>
       <p className="text-sm text-muted-foreground">
        Discover more amazing projects similar to this one
       </p>
      </div>
      <RepositoryGrid repositories={relatedRepos} />
     </>
    )}
   </div>
  </div>
 );
}
