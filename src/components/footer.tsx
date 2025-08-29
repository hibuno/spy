import Link from "next/link";

export function Footer() {
 return (
  <footer className="border-t border-x bg-background max-w-6xl mx-auto">
   <div className="container mx-auto p-4">
    <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
     <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
      Discover trending GitHub repositories, built by{" "}
      <a
       href="https://hibuno.com"
       className="underline hover:text-primary"
       target="_blank"
       rel="noopener noreferrer"
      >
       Hibuno
      </a>
      .
     </p>
     <p className="text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} The Spy Project. All rights reserved.
     </p>
    </div>
   </div>
   <div className="container mx-auto p-4 border-t">
    <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
     <div className="flex flex-wrap justify-center gap-4 text-xs">
      <Link
       href="/about"
       className="text-muted-foreground hover:text-primary transition-colors"
      >
       About
      </Link>
      <Link
       href="/privacy-policy"
       className="text-muted-foreground hover:text-primary transition-colors"
      >
       Privacy Policy
      </Link>
      <Link
       href="/terms-of-service"
       className="text-muted-foreground hover:text-primary transition-colors"
      >
       Terms of Service
      </Link>
      <Link
       href="/cookie-policy"
       className="text-muted-foreground hover:text-primary transition-colors"
      >
       Cookie Policy
      </Link>
     </div>
     <p className="text-center text-xs leading-loose text-muted-foreground md:text-right">
      Powered by Vercel, N8N, DataBuddy, and Supabase. Source data from GitHub,
      OSS Insight, and Hugging Face.
     </p>
    </div>
   </div>
  </footer>
 );
}
