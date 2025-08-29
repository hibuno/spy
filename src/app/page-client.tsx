"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Repository } from "@/lib/supabase";
import { RepositoryGrid } from "@/components/repository-grid";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import Lightning from "@/components/lightning";
import { RepositoryColumns } from "@/components/repository-columns";
import {
 SearchFilters,
 type SearchFilters as SearchFiltersType,
} from "@/components/search-filters";
import Galaxy from "@/components/galaxy";

const ITEMS_PER_PAGE = 12;

interface HomeClientProps {
 initialRepositories: Repository[];
 recommendedRepos: Repository[];
 initialTotalCount: number;
}

export function HomeClient({
 initialRepositories,
 recommendedRepos,
 initialTotalCount,
}: HomeClientProps) {
 const [repositories, setRepositories] =
  useState<Repository[]>(initialRepositories);
 const [filteredRepositories, setFilteredRepositories] =
  useState<Repository[]>(initialRepositories);
 const [loading, setLoading] = useState(false);
 const [loadingMore, setLoadingMore] = useState(false);
 const [hasMore, setHasMore] = useState(
  initialRepositories.length === ITEMS_PER_PAGE
 );
 const [page, setPage] = useState(1);
 const [error, setError] = useState<string | null>(null);
 const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
 const [filters, setFilters] = useState<SearchFiltersType>({
  search: "",
  language: "",
  experience: "",
  sortBy: "created_at",
  sortOrder: "desc",
 });

 // Extract unique languages from all repositories
 useEffect(() => {
  const languageSet = new Set<string>();
  [...recommendedRepos, ...repositories].forEach((repo) => {
   if (repo.languages) {
    repo.languages.split(",").forEach((lang) => {
     const trimmedLang = lang.trim();
     if (trimmedLang) languageSet.add(trimmedLang);
    });
   }
  });
  setAvailableLanguages(Array.from(languageSet).sort());
 }, [recommendedRepos, repositories]);

 const fetchRepositories = useCallback(
  async (pageNum = 1, searchFilters = filters) => {
   try {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    setError(null);

    const from = (pageNum - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
     .from("repositories")
     .select("*")
     .not("updated_at", "is", null);

    // Apply search filter
    if (searchFilters.search) {
     query = query.or(
      `summary.ilike.%${searchFilters.search}%,repository.ilike.%${searchFilters.search}%,languages.ilike.%${searchFilters.search}%,tags.ilike.%${searchFilters.search}%`
     );
    }

    // Apply language filter
    if (searchFilters.language) {
     query = query.ilike("languages", `%${searchFilters.language}%`);
    }

    // Apply experience filter
    if (searchFilters.experience) {
     query = query.ilike("experience", `%${searchFilters.experience}%`);
    }

    // Apply sorting
    const ascending = searchFilters.sortOrder === "asc";
    query = query.order(searchFilters.sortBy, { ascending });

    const { data, error } = await query.range(from, to);

    if (error) throw error;

    const newData = data || [];

    if (pageNum === 1) {
     setRepositories(newData);
     setFilteredRepositories(newData);
     setPage(1);
    } else {
     setRepositories((prev) => [...prev, ...newData]);
     setFilteredRepositories((prev) => [...prev, ...newData]);
    }

    setHasMore(newData.length === ITEMS_PER_PAGE);
    if (pageNum > 1) {
     setPage(pageNum);
    }
   } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
   } finally {
    setLoading(false);
    setLoadingMore(false);
   }
  },
  [filters]
 );

 const loadMore = () => {
  if (!loadingMore && hasMore) {
   fetchRepositories(page + 1, filters);
  }
 };

 const handleRefresh = () => {
  setPage(1);
  setHasMore(true);
  fetchRepositories(1, filters);
 };

 const handleFiltersChange = useCallback(
  (newFilters: SearchFiltersType) => {
   setFilters(newFilters);
   setPage(1);
   setHasMore(true);
   fetchRepositories(1, newFilters);
  },
  [fetchRepositories]
 );

 if (error) {
  return (
   <div className="text-center h-screen">
    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
     <RefreshCw className="w-8 h-8 text-destructive" />
    </div>
    <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
     Connection Error
    </h2>
    <p className="text-muted-foreground mb-4">
     Unable to load repositories. Please check your connection.
    </p>
    <Button onClick={handleRefresh} variant="outline" className="border-border">
     <RefreshCw className="w-4 h-4 mr-2" />
     Try Again
    </Button>
   </div>
  );
 }

 return (
  <div>
   {/* Rising Stars Section */}
   {recommendedRepos.length > 0 && (
    <>
     <div className="flex items-center justify-between px-6 py-4 border-b relative bg-black overflow-hidden">
      <h2 className="font-serif font-bold text-foreground z-10">
       The Rising Stars
      </h2>
      <div className="absolute z-0 left-0 right-0 w-full h-full">
       <Galaxy
        mouseRepulsion={false}
        mouseInteraction={false}
        density={0.14}
        glowIntensity={0.4}
        saturation={0.8}
        hueShift={180}
       />
      </div>
      <p className="text-sm text-muted-foreground hidden md:block relative z-10">
       Repositories with the highest star count
      </p>
     </div>
     <RepositoryColumns repositories={recommendedRepos} />
    </>
   )}

   {/* All Repositories Section */}
   <>
    <div className="flex items-center justify-between px-6 py-4 border-y relative bg-black overflow-hidden">
     <h2 className="font-serif font-bold text-foreground z-10">
      All Repositories
     </h2>
     <div className="absolute z-0">
      <Lightning hue={250} xOffset={1} speed={0.8} intensity={0.6} size={1} />
     </div>
     <p className="text-sm text-muted-foreground hidden md:block">
      {initialTotalCount.toLocaleString()}+ total repositories
     </p>
    </div>

    <div className="bg-background border-b px-6 py-4">
     <SearchFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      availableLanguages={availableLanguages}
     />
    </div>

    {loading ? (
     <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
       <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
       <p className="text-muted-foreground">Loading repositories...</p>
      </div>
     </div>
    ) : repositories.length === 0 ? (
     <div className="text-center py-12">
      <p className="text-muted-foreground">
       No repositories found. Add some data to your Supabase database.
      </p>
     </div>
    ) : (
     <InfiniteScroll
      hasMore={hasMore}
      loading={loadingMore}
      onLoadMore={loadMore}
     >
      <RepositoryGrid repositories={filteredRepositories} />
      {loadingMore && (
       <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
         <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
         <p className="text-sm text-muted-foreground">
          Loading more repositories...
         </p>
        </div>
       </div>
      )}
     </InfiniteScroll>
    )}
   </>
  </div>
 );
}
