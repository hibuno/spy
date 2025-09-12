"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

export function Header() {
 return (
  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-between border px-6 py-4 sticky top-0 z-50 max-w-6xl mx-auto bg-background">
   <div className="flex items-center gap-4">
    <Link href="/" className="flex items-center gap-1">
     <Image
      src="/logo/logo-dark.svg"
      alt="The Spy Project"
      width={50}
      height={50}
      unoptimized={true}
     />
     <div>
      <h1 className="text-md font-serif font-bold text-foreground">
       <span>The Spy Project</span>
      </h1>
      <p className="text-muted-foreground text-xs">
       Discover rising stars and popular repositories
      </p>
     </div>
    </Link>
   </div>
   <div className="flex flex-wrap justify-center items-center gap-1">
    <a
     href="https://www.producthunt.com/products/the-spy-project?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-the&#0045;spy&#0045;project"
     target="_blank"
    >
     <Image
      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1010730&theme=dark&t=1756463497614"
      alt="The&#0032;Spy&#0032;Project - Discover&#0032;the&#0032;next&#0032;rising&#0032;stars&#0032;with&#0032;AI&#0045;powered&#0032;insights&#0046; | Product Hunt"
      style={{ width: "190px", height: "36px" }}
      width="250"
      height="54"
      unoptimized={true}
     />
    </a>
    <Link href="/bookmarks">
     <Button variant="outline" size="sm">
      My Bookmarks
     </Button>
    </Link>
    <Dialog>
     <DialogTrigger asChild>
      <Button variant="outline" size="sm">
       Contact Us
      </Button>
     </DialogTrigger>
     <DialogContent className="sm:max-w-md">
      <DialogHeader>
       <DialogTitle>Contact Us</DialogTitle>
       <DialogDescription asChild>
        <div className="space-y-2">
         <p>
          Have questions, want to report discrepancies or dislikes, or are you a
          promotion/sponsor looking to get in touch? We&apos;d love to hear from
          you!
         </p>
         <p className="text-sm text-muted-foreground">
          Reach out to us directly at:
         </p>
         <a
          href="mailto:muhibbudins1997@gmail.com"
          className="text-primary hover:underline font-medium"
         >
          muhibbudins1997@gmail.com
         </a>
        </div>
       </DialogDescription>
      </DialogHeader>
     </DialogContent>
    </Dialog>
   </div>
  </div>
 );
}
