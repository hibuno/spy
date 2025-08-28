"use client";

import { Repository } from "@/lib/supabase";
import { RepositoryCard } from "./repository-card";

interface RepositoryGridProps {
 repositories: Repository[];
}

export function RepositoryGrid({ repositories }: RepositoryGridProps) {
 if (repositories.length === 0) {
  return (
   <div className="text-center py-12">
    <p className="text-gray-500">No repositories found.</p>
   </div>
  );
 }

 return (
  <div className="flex flex-wrap gap-[1px] bg-border">
   {repositories.map((repo) => (
    <RepositoryCard key={repo.id} repository={repo} />
   ))}
  </div>
 );
}
