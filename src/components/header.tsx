"use client";

import {
 HatGlasses,
 Search,
 TrendingUp,
 Star,
 Home,
 Github,
 Filter,
 Clock,
 Code,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
 CommandDialog,
 CommandInput,
 CommandList,
 CommandEmpty,
 CommandGroup,
 CommandItem,
} from "@/components/ui/command";
import { supabase, Repository } from "@/lib/supabase";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
 const [debouncedValue, setDebouncedValue] = useState<T>(value);

 useEffect(() => {
  const handler = setTimeout(() => {
   setDebouncedValue(value);
  }, delay);

  return () => {
   clearTimeout(handler);
  };
 }, [value, delay]);

 return debouncedValue;
}

export function Header() {
 const [open, setOpen] = useState(false);
 const [searchValue, setSearchValue] = useState("");
 const [searchResults, setSearchResults] = useState<Repository[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [searchHistory, setSearchHistory] = useState<string[]>([]);
 const [showFilters, setShowFilters] = useState(false);
 const [languageFilter, setLanguageFilter] = useState("");
 const [minStars, setMinStars] = useState<number | null>(null);

 const debouncedSearchValue = useDebounce(searchValue, 300);

 useEffect(() => {
  const down = (e: KeyboardEvent) => {
   if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    setOpen((open) => !open);
   }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
 }, []);

 const handleNavigation = (path: string) => {
  setOpen(false);
  window.location.href = path;
 };

 const handleOpenChange = (newOpen: boolean) => {
  setOpen(newOpen);
  if (!newOpen) {
   setSearchValue("");
   setSearchResults([]);
   setShowFilters(false);
   setLanguageFilter("");
   setMinStars(null);
  }
 };

 const clearFilters = () => {
  setLanguageFilter("");
  setMinStars(null);
 };

 const hasActiveFilters = languageFilter || minStars !== null;

 const popularLanguages = useMemo(
  () => [
   "JavaScript",
   "TypeScript",
   "Python",
   "Java",
   "Go",
   "Rust",
   "C++",
   "C#",
   "PHP",
   "Ruby",
  ],
  []
 );

 const searchRepositories = useCallback(
  async (
   query: string,
   language?: string,
   minStarsFilter: number | null = null
  ) => {
   if (!query.trim()) {
    setSearchResults([]);
    return;
   }

   setIsSearching(true);
   try {
    let queryBuilder = supabase
     .from("repositories")
     .select("*")
     .or(
      `title.ilike.%${query}%,summary.ilike.%${query}%,repository.ilike.%${query}%,languages.ilike.%${query}%`
     );

    // Apply language filter
    if (language && language.trim()) {
     queryBuilder = queryBuilder.ilike("languages", `%${language}%`);
    }

    // Apply minimum stars filter
    if (minStarsFilter !== null && minStarsFilter > 0) {
     queryBuilder = queryBuilder.gte("stars", minStarsFilter);
    }

    // Order by relevance (exact title matches first, then by stars)
    const { data, error } = await queryBuilder
     .order("stars", { ascending: false })
     .limit(15);

    if (error) {
     console.error("Search error:", error);
     setSearchResults([]);
    } else {
     // Custom ranking: prioritize exact matches and higher stars
     const rankedResults = (data || []).sort((a, b) => {
      const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase())
       ? 1
       : 0;
      const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase())
       ? 1
       : 0;

      if (aExactMatch !== bExactMatch) {
       return bExactMatch - aExactMatch;
      }

      return b.stars - a.stars;
     });

     setSearchResults(rankedResults);

     // Add to search history if query is meaningful
     if (query.length > 2 && !searchHistory.includes(query)) {
      setSearchHistory((prev) => [query, ...prev.slice(0, 4)]);
     }
    }
   } catch (error) {
    console.error("Search error:", error);
    setSearchResults([]);
   } finally {
    setIsSearching(false);
   }
  },
  [searchHistory]
 );

 const handleSearchValueChange = (value: string) => {
  setSearchValue(value);
 };

 // Effect to trigger search when debounced value changes
 useEffect(() => {
  searchRepositories(debouncedSearchValue, languageFilter, minStars);
 }, [debouncedSearchValue, languageFilter, minStars, searchRepositories]);

 return (
  <>
   <div className="flex items-center justify-between border-b p-6 sticky top-0 z-50 max-w-6xl mx-auto border-x bg-background">
    <div className="flex items-center gap-4">
     <Link href="/" className="flex items-center gap-2">
      <HatGlasses className="w-10 h-10 p-1.5 rounded-sm bg-muted" />
      <div>
       <h1 className="text-lg font-serif font-bold text-foreground">
        <span>The Spy Project</span>
       </h1>
       <p className="text-muted-foreground text-xs">
        Discover rising stars and popular repositories
       </p>
      </div>
     </Link>
    </div>
    <button
     onClick={() => setOpen(true)}
     className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
    >
     <Search className="w-4 h-4" />
     <span className="hidden sm:inline">Search...</span>
     <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
      <span className="text-xs">⌘</span>K
     </kbd>
    </button>
   </div>

   <CommandDialog open={open} onOpenChange={handleOpenChange}>
    <CommandInput
     placeholder="Search repositories, navigate, or explore..."
     value={searchValue}
     onValueChange={handleSearchValueChange}
    />

    {(languageFilter || minStars !== null || hasActiveFilters) && (
     <div className="flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-1">
       {languageFilter && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
         <Code className="w-3 h-3 mr-1" />
         {languageFilter}
         <button
          onClick={() => setLanguageFilter("")}
          className="ml-1 hover:text-blue-600"
         >
          ×
         </button>
        </span>
       )}
       {minStars !== null && (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
         <Star className="w-3 h-3 mr-1" />
         {minStars}+ stars
         <button
          onClick={() => setMinStars(null)}
          className="ml-1 hover:text-yellow-600"
         >
          ×
         </button>
        </span>
       )}
      </div>
      <button
       onClick={() => setShowFilters(!showFilters)}
       className={`p-1 rounded hover:bg-accent ${
        hasActiveFilters ? "text-blue-600" : "text-muted-foreground"
       }`}
      >
       <Filter className="h-4 w-4" />
      </button>
     </div>
    )}

    {!hasActiveFilters && (
     <div className="flex items-center justify-end border-b px-3 py-2">
      <button
       onClick={() => setShowFilters(!showFilters)}
       className={`p-1 rounded hover:bg-accent ${
        hasActiveFilters ? "text-blue-600" : "text-muted-foreground"
       }`}
      >
       <Filter className="h-4 w-4" />
      </button>
     </div>
    )}

    {showFilters && (
     <div className="border-b p-3 space-y-3">
      <div className="space-y-2">
       <label className="text-sm font-medium">Language</label>
       <div className="flex flex-wrap gap-1">
        {popularLanguages.map((lang) => (
         <button
          key={lang}
          onClick={() => setLanguageFilter(languageFilter === lang ? "" : lang)}
          className={`px-2 py-1 text-xs rounded-full border ${
           languageFilter === lang
            ? "bg-blue-100 border-blue-300 text-blue-800"
            : "bg-background border-border hover:bg-accent"
          }`}
         >
          {lang}
         </button>
        ))}
       </div>
      </div>
      <div className="space-y-2">
       <label className="text-sm font-medium">Minimum Stars</label>
       <div className="flex gap-1">
        {[100, 500, 1000, 5000].map((stars) => (
         <button
          key={stars}
          onClick={() => setMinStars(minStars === stars ? null : stars)}
          className={`px-2 py-1 text-xs rounded-full border ${
           minStars === stars
            ? "bg-yellow-100 border-yellow-300 text-yellow-800"
            : "bg-background border-border hover:bg-accent"
          }`}
         >
          {stars}+
         </button>
        ))}
       </div>
      </div>
      {hasActiveFilters && (
       <button
        onClick={clearFilters}
        className="text-xs text-muted-foreground hover:text-foreground"
       >
        Clear all filters
       </button>
      )}
     </div>
    )}

    <CommandList>
     {searchResults.length > 0 && (
      <CommandGroup heading={`Repositories (${searchResults.length})`}>
       {searchResults.map((repo) => (
        <CommandItem
         key={repo.id}
         onSelect={() => handleNavigation(`/${repo.repository}`)}
        >
         <div className="flex items-start gap-3 w-full">
          <Github className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
           <div className="font-medium truncate">{repo.title}</div>
           <div className="text-xs text-muted-foreground truncate mb-1">
            {repo.repository}
           </div>
           <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
             <Star className="w-3 h-3" />
             {repo.stars.toLocaleString()}
            </span>
            {repo.languages && (
             <span className="flex items-center gap-1">
              <Code className="w-3 h-3" />
              {repo.languages.split(",")[0]?.trim()}
             </span>
            )}
           </div>
          </div>
         </div>
        </CommandItem>
       ))}
      </CommandGroup>
     )}

     {searchHistory.length > 0 && !searchValue && (
      <CommandGroup heading="Recent Searches">
       {searchHistory.map((query, index) => (
        <CommandItem
         key={index}
         onSelect={() => {
          setSearchValue(query);
         }}
        >
         <Clock className="w-4 h-4 mr-2" />
         {query}
        </CommandItem>
       ))}
      </CommandGroup>
     )}

     {(!searchValue || searchResults.length === 0) && (
      <>
       <CommandGroup heading="Navigation">
        <CommandItem onSelect={() => handleNavigation("/")}>
         <Home className="w-4 h-4 mr-2" />
         Go to homepage
        </CommandItem>
        <CommandItem onSelect={() => handleNavigation("/?filter=trending")}>
         <TrendingUp className="w-4 h-4 mr-2" />
         View trending repositories
        </CommandItem>
        <CommandItem onSelect={() => handleNavigation("/?filter=popular")}>
         <Star className="w-4 h-4 mr-2" />
         View popular projects
        </CommandItem>
       </CommandGroup>
       <CommandGroup heading="Search & Discover">
        <CommandItem onSelect={() => setOpen(false)}>
         <Search className="w-4 h-4 mr-2" />
         Search all repositories
        </CommandItem>
        <CommandItem onSelect={() => handleNavigation("/?filter=beginner")}>
         <Star className="w-4 h-4 mr-2" />
         Find beginner-friendly projects
        </CommandItem>
        <CommandItem onSelect={() => handleNavigation("/?filter=advanced")}>
         <TrendingUp className="w-4 h-4 mr-2" />
         Discover advanced projects
        </CommandItem>
       </CommandGroup>
       <CommandGroup heading="External Links">
        <CommandItem
         onSelect={() => window.open("https://github.com/trending", "_blank")}
        >
         <Github className="w-4 h-4 mr-2" />
         GitHub Trending
        </CommandItem>
        <CommandItem
         onSelect={() => window.open("https://github.com", "_blank")}
        >
         <Github className="w-4 h-4 mr-2" />
         GitHub Homepage
        </CommandItem>
       </CommandGroup>
      </>
     )}

     <CommandEmpty>
      {isSearching
       ? "Searching..."
       : searchValue
       ? "No repositories found."
       : "No results found."}
     </CommandEmpty>
    </CommandList>
   </CommandDialog>
  </>
 );
}
