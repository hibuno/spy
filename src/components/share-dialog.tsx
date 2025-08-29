"use client";

import { useState } from "react";
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
import { Share2, Copy, Check, Twitter, Linkedin } from "lucide-react";

interface ShareDialogProps {
 slug: string;
 ownerRepo: string;
 summary?: string | null;
 baseUrl?: string;
}

export default function ShareDialog({
 slug,
 ownerRepo,
 summary,
 baseUrl,
}: ShareDialogProps) {
 const [copied, setCopied] = useState(false);
 const siteUrl = baseUrl || "https://spy.hibuno.com";
 const shareUrl = `${siteUrl}/${slug}`;

 const copyToClipboard = async () => {
  try {
   await navigator.clipboard.writeText(shareUrl);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  } catch (err) {
   console.error("Failed to copy:", err);
  }
 };

 const shareText = `Check out ${ownerRepo} - ${
  summary || "An amazing repository"
 }`;
 const encodedText = encodeURIComponent(shareText);
 const encodedUrl = encodeURIComponent(shareUrl);

 return (
  <Dialog>
   <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="border-border">
     <Share2 className="w-3.5 h-3.5 mr-1.5" />
     Share
    </Button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>Share Project</DialogTitle>
     <DialogDescription>
      Share this amazing project with others
     </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
     <div className="flex items-center space-x-2">
      <div className="grid flex-1 gap-2">
       <label htmlFor="link" className="sr-only">
        Link
       </label>
       <input
        id="link"
        defaultValue={shareUrl}
        readOnly
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
       />
      </div>
      <Button
       type="button"
       size="sm"
       className="px-3"
       onClick={copyToClipboard}
      >
       <span className="sr-only">Copy</span>
       {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
     </div>

     <div className="space-y-2">
      <p className="text-sm font-medium">Share on social media</p>
      <div className="flex gap-2">
       <Button asChild variant="outline" size="sm" className="flex-1">
        <Link
         href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
         target="_blank"
         rel="noopener noreferrer"
        >
         <Twitter className="w-4 h-4 mr-2" />
         Twitter
        </Link>
       </Button>
       <Button asChild variant="outline" size="sm" className="flex-1">
        <Link
         href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
         target="_blank"
         rel="noopener noreferrer"
        >
         <Linkedin className="w-4 h-4 mr-2" />
         LinkedIn
        </Link>
       </Button>
      </div>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
