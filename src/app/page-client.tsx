"use client";

import { useState } from "react";
import { supabase, Repository } from "@/lib/supabase";
import { RepositoryGrid } from "@/components/repository-grid";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

const ITEMS_PER_PAGE = 12;

interface HomeClientProps {
 initialRepositories: Repository[];
 popularRepos: Repository[];
 recommendedRepos: Repository[];
 initialTotalCount: number;
}

export function HomeClient({
 initialRepositories,
 popularRepos,
 recommendedRepos,
 initialTotalCount,
}: HomeClientProps) {
 const [repositories, setRepositories] =
  useState<Repository[]>(initialRepositories);
 const [loading, setLoading] = useState(false);
 const [refreshing, setRefreshing] = useState(false);
 const [loadingMore, setLoadingMore] = useState(false);
 const [hasMore, setHasMore] = useState(
  initialRepositories.length === ITEMS_PER_PAGE
 );
 const [page, setPage] = useState(1);
 const [error, setError] = useState<string | null>(null);
 const [totalCount, setTotalCount] = useState(initialTotalCount);

 // Get IDs of repositories already shown in featured sections
 const featuredIds = new Set([
  ...popularRepos.map((repo) => repo.id),
  ...recommendedRepos.map((repo) => repo.id),
 ]);

 const fetchTotalCount = async () => {
  try {
   const { count, error } = await supabase
    .from("repositories")
    .select("*", { count: "exact", head: true })
    .eq("archived", false)
    .eq("disabled", false);

   if (error) throw error;
   setTotalCount(count || 0);
  } catch (err) {
   console.error("Error fetching total count:", err);
  }
 };

 const fetchRepositories = async (isRefresh = false, pageNum = 1) => {
  try {
   if (isRefresh) setRefreshing(true);
   else if (pageNum === 1) setLoading(true);
   else setLoadingMore(true);

   setError(null);

   const from = (pageNum - 1) * ITEMS_PER_PAGE;
   const to = from + ITEMS_PER_PAGE - 1;

   const { data, error } = await supabase
    .from("repositories")
    .select("*")
    .eq("archived", false)
    .eq("disabled", false)
    .not("id", "in", `(${Array.from(featuredIds).join(",")})`)
    .order("stars", { ascending: false })
    .range(from, to);

   if (error) throw error;

   const newData = data || [];

   if (isRefresh || pageNum === 1) {
    setRepositories(newData);
    setPage(1);
   } else {
    setRepositories((prev) => [...prev, ...newData]);
   }

   setHasMore(newData.length === ITEMS_PER_PAGE);
   if (!isRefresh && pageNum > 1) {
    setPage(pageNum);
   }

   if (isRefresh) {
    fetchTotalCount();
   }
  } catch (err) {
   setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
   setLoading(false);
   setRefreshing(false);
   setLoadingMore(false);
  }
 };

 const loadMore = () => {
  if (!loadingMore && hasMore) {
   fetchRepositories(false, page + 1);
  }
 };

 const handleRefresh = () => {
  setPage(1);
  setHasMore(true);
  fetchRepositories(true);
 };

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
   {/* Most Popular Section */}
   {popularRepos.length > 0 && (
    <>
     <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-serif font-bold text-foreground">Most Popular</h2>
      <p className="text-sm text-muted-foreground">
       Repositories with the highest star count
      </p>
     </div>
     <RepositoryGrid repositories={popularRepos} />
    </>
   )}

   {/* All Repositories Section */}
   <>
    <div className="flex items-center justify-between border-y px-6 py-4">
     <div>
      <h2 className="font-serif font-bold text-foreground">All Repositories</h2>
      <p className="text-sm text-muted-foreground">
       {totalCount.toLocaleString()}+ total repositories
      </p>
     </div>
     <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={refreshing}
      className="gap-2 border-border"
     >
      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
      Refresh
     </Button>
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
      <RepositoryGrid repositories={repositories} />
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
