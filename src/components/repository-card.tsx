"use client";

import { ImageItem, Repository } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RepositoryCardProps {
 repository: Repository;
 className?: string;
}

function formatDate(date: string): string {
 return new Date(date).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
 });
}

export function RepositoryCard({ repository, className }: RepositoryCardProps) {
 const [currentImageIndex, setCurrentImageIndex] = useState(0);
 const [imageError, setImageError] = useState(false);

 const languages =
  repository.languages
   ?.split(",")
   .map((lang) => lang.trim())
   .filter(Boolean) || [];

 // Parse images from repository.images field
 const getImages = (): ImageItem[] => {
  if (!repository.images) return [];

  if (typeof repository.images === "string") {
   return JSON.parse(repository.images);
  }
  return Array.isArray(repository.images)
   ? repository.images.map((img) => (typeof img === "string" ? img : img))
   : [];
 };

 const images = getImages();
 const hasImages = images.length > 0 && !imageError;

 const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
 };

 const getExperienceColor = (experience: string) => {
  switch (experience?.toLowerCase()) {
   case "beginner":
    return "bg-green-900 text-green-200 border-green-800";
   case "intermediate":
    return "bg-blue-900 text-blue-200 border-blue-800";
   case "advanced":
    return "bg-purple-900 text-purple-200 border-purple-800";
   default:
    return "bg-gray-900 text-gray-200 border-gray-800";
  }
 };

 const getLanguageColor = (language: string) => {
  const colors: { [key: string]: string } = {
   javascript: "bg-yellow-400",
   typescript: "bg-blue-500",
   python: "bg-green-500",
   java: "bg-red-500",
   go: "bg-cyan-500",
   rust: "bg-orange-600",
   cpp: "bg-blue-600",
   "c++": "bg-blue-600",
   php: "bg-purple-500",
   ruby: "bg-red-600",
   swift: "bg-orange-500",
   kotlin: "bg-purple-600",
   dart: "bg-blue-400",
   shell: "bg-gray-600",
   html: "bg-orange-400",
   css: "bg-blue-300",
  };

  return colors[language.toLowerCase()] || "bg-gray-400";
 };

 return (
  <Link
   href={`/${repository.repository}`}
   className={cn(
    "block w-full md:w-[calc(100%/3-1px)] bg-background overflow-hidden group",
    className
   )}
  >
   <div className="repo-card">
    {/* Preview Image */}
    <div className="relative h-64 bg-muted overflow-hidden">
     {hasImages ? (
      images[currentImageIndex].url !== "" && (
       <Image
        src={images[currentImageIndex].url}
        alt={images[currentImageIndex].url}
        fill
        className="object-cover bg-foreground"
        onError={() => {
         setImageError(true);
         setCurrentImageIndex(
          images.length > currentImageIndex
           ? currentImageIndex + 1
           : currentImageIndex
         );
        }}
       />
      )
     ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
       <ImageIcon className="w-8 h-8" />
      </div>
     )}
    </div>

    {/* Content */}
    <div className="p-4 flex-1 flex flex-col group-hover:bg-muted">
     {/* Header */}
     <div className="flex items-start justify-between gap-2 mb-3">
      <h3 className="font-serif font-semibold text-foreground line-clamp-2 leading-tight text-sm group-hover:text-primary">
       {repository.repository}
      </h3>
      <div className="text-xs text-muted-foreground">
       {formatDate(repository.created_at)}
      </div>
     </div>

     {/* Description */}
     <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3 flex-1">
      {repository.summary || "No description available"}
     </p>

     {/* Stats */}
     <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 text-xs">
       <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-500" />
        <span className="font-medium text-foreground">
         {formatNumber(repository.stars || 0)}
        </span>
       </div>
       <div className="flex items-center gap-1">
        <GitFork className="w-3 h-3 text-blue-500" />
        <span className="font-medium text-foreground">
         {formatNumber(repository.forks || 0)}
        </span>
       </div>
      </div>
      {repository.experience && (
       <Badge
        className={`text-[10px] px-1.5 py-0.5 font-medium border flex-shrink-0 ${getExperienceColor(
         repository.experience
        )}`}
       >
        {repository.experience}
       </Badge>
      )}
     </div>

     {/* Language */}
     <div className="flex items-center gap-2">
      {languages.length > 0 &&
       languages.slice(0, 5).map((language) => (
        <div className="flex items-center gap-1" key={language}>
         <div
          className={`w-2 h-2 rounded-full ${getLanguageColor(language)}`}
         />
         <div className="text-[10px] text-muted-foreground font-medium">
          {language}
         </div>
        </div>
       ))}
      {languages.length > 5 && (
       <div className="text-[10px] text-muted-foreground font-medium">
        +{languages.length - 5}
       </div>
      )}
     </div>
    </div>
   </div>
  </Link>
 );
}
