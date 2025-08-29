"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LazyIframeProps {
 src: string;
 title: string;
 className?: string;
 height?: string;
 loading?: "lazy" | "eager";
}

export default function LazyIframe({
 src,
 title,
 className = "",
 height = "h-[calc(100vh-200px)]",
 loading = "lazy",
}: LazyIframeProps) {
 const [isLoading, setIsLoading] = useState(true);
 const [isInView, setIsInView] = useState(loading === "eager");
 const [hasError, setHasError] = useState(false);
 const iframeRef = useRef<HTMLIFrameElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (loading === "eager") {
   setIsInView(true);
   return;
  }

  const observer = new IntersectionObserver(
   (entries) => {
    entries.forEach((entry) => {
     if (entry.isIntersecting) {
      setIsInView(true);
      observer.disconnect();
     }
    });
   },
   {
    rootMargin: "50px", // Start loading 50px before the element comes into view
    threshold: 0.1,
   }
  );

  if (containerRef.current) {
   observer.observe(containerRef.current);
  }

  return () => observer.disconnect();
 }, [loading]);

 const handleLoad = () => {
  setIsLoading(false);
  setHasError(false);
 };

 const handleError = () => {
  setIsLoading(false);
  setHasError(true);
 };

 const handleShowIframe = () => {
  setIsInView(true);
 };

 if (!isInView && loading === "lazy") {
  return (
   <div
    ref={containerRef}
    className={`w-full ${height} bg-muted/50 flex items-center justify-center ${className}`}
   >
    <div className="text-center space-y-3">
     <Globe className="w-8 h-8 text-muted-foreground mx-auto" />
     <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
       Live preview will load when you scroll here
      </p>
      <Button
       onClick={handleShowIframe}
       variant="outline"
       size="sm"
       className="text-xs"
      >
       Load Preview Now
      </Button>
     </div>
    </div>
   </div>
  );
 }

 if (hasError) {
  return (
   <div
    className={`w-full ${height} flex items-center justify-center ${className}`}
   >
    <div className="text-center space-y-2">
     <Globe className="w-8 h-8 text-muted-foreground mx-auto" />
     <p className="text-sm text-muted-foreground">Unable to load preview</p>
     <Button
      onClick={() => {
       setHasError(false);
       setIsLoading(true);
      }}
      variant="outline"
      size="sm"
      className="text-xs"
     >
      Try Again
     </Button>
    </div>
   </div>
  );
 }

 return (
  <div className={`relative w-full ${height} ${className}`}>
   {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center z-10">
     <div className="text-center space-y-2">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
      <p className="text-sm text-muted-foreground">Loading preview...</p>
     </div>
    </div>
   )}
   <iframe
    ref={iframeRef}
    src={src}
    className={`w-full h-full bg-background transition-opacity duration-300 ${
     isLoading ? "opacity-0" : "opacity-100"
    }`}
    title={title}
    sandbox="allow-scripts allow-same-origin allow-forms"
    onLoad={handleLoad}
    onError={handleError}
    loading="lazy"
   />
  </div>
 );
}
