"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { HatGlasses } from "lucide-react";
import Link from "next/link";

export function Header() {
 return (
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
   <ThemeToggle />
  </div>
 );
}
