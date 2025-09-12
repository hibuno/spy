"use client";

import { useState, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon, Loader2 } from "lucide-react";

interface SmartImageProps extends Omit<ImageProps, "onLoad"> {
 fallbackSrc?: string;
 showLoadingIndicator?: boolean;
 blurDataURL?: string;
 quality?: number;
 onError?: () => void;
 aspectRatio?: "auto" | "square" | "video" | "wide";
 maxHeight?: number;
}

// List of domains that are configured for optimization in next.config.ts
const OPTIMIZED_DOMAINS = [
 "api.producthunt.com",
 "github.com",
 "raw.githubusercontent.com",
 "avatars.githubusercontent.com",
 "opengraph.githubassets.com",
 "supabase.co", // This covers *.supabase.co
];

// Utility function to determine if image should be unoptimized
function shouldUseUnoptimized(
 src: unknown,
 width?: number | string,
 height?: number | string
): boolean {
 // Convert src to string for analysis
 const srcString =
  typeof src === "string" ? src : (src as { src?: string })?.src || "";

 // SVG files should always be unoptimized
 if (srcString.endsWith(".svg")) return true;

 // GIF files (animated images) should be unoptimized
 if (srcString.endsWith(".gif")) return true;

 // Small images (under 64px) should be unoptimized
 const w = typeof width === "number" ? width : parseInt(String(width) || "0");
 const h =
  typeof height === "number" ? height : parseInt(String(height) || "0");
 if ((w > 0 && w <= 64) || (h > 0 && h <= 64)) return true;

 // Check if domain is in our optimized list
 try {
  const url = new URL(
   srcString.startsWith("http") ? srcString : `https://${srcString}`
  );
  const hostname = url.hostname;

  // Check if hostname matches any of our optimized domains
  const isOptimizedDomain = OPTIMIZED_DOMAINS.some(
   (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  // If not in optimized domains, use unoptimized to avoid errors and costs
  return !isOptimizedDomain;
 } catch {
  // If URL parsing fails, assume it's a local path and allow optimization
  return false;
 }
}

export default function SmartImage({
 src,
 alt,
 fallbackSrc,
 showLoadingIndicator = true,
 blurDataURL,
 className = "",
 quality = 75, // Default to 75% quality to reduce file size
 onError: onErrorProp,
 aspectRatio = "auto",
 maxHeight = 300,
 ...props
}: SmartImageProps) {
 const [isLoading, setIsLoading] = useState(true);
 const [hasError, setHasError] = useState(false);
 const [currentSrc, setCurrentSrc] = useState(src);
 const imgRef = useRef<HTMLImageElement>(null);

 const handleLoad = () => {
  setIsLoading(false);
  setHasError(false);
 };

 const handleError = () => {
  setIsLoading(false);
  if (fallbackSrc && currentSrc !== fallbackSrc) {
   setCurrentSrc(fallbackSrc);
   setHasError(false);
   setIsLoading(true);
  } else {
   setHasError(true);
  }
  // Call the external onError handler if provided
  onErrorProp?.();
 };

 if (hasError) {
  return (
   <div
    className={`flex items-center justify-center bg-muted border border-border rounded ${className}`}
    style={{ width: props.width, height: props.height }}
   >
    <div className="text-center space-y-1">
     <ImageIcon className="w-4 h-4 text-muted-foreground mx-auto" />
     <span className="text-xs text-muted-foreground">Image unavailable</span>
    </div>
   </div>
  );
 }

 const unoptimized = shouldUseUnoptimized(
  currentSrc,
  props.width,
  props.height
 );

 // Determine container styles based on aspect ratio
 const getContainerStyles = () => {
  switch (aspectRatio) {
   case "square":
    return "aspect-square";
   case "video":
    return "aspect-video"; // 16:9
   case "wide":
    return "aspect-[3/2]"; // 3:2 ratio for wide images
   default:
    return `max-h-[${maxHeight}px]`;
  }
 };

 // Determine image styles based on aspect ratio
 const getImageStyles = () => {
  const baseStyles = "transition-opacity duration-300";
  const opacityStyles = isLoading ? "opacity-0" : "opacity-100";

  switch (aspectRatio) {
   case "square":
   case "video":
   case "wide":
    return `${baseStyles} ${opacityStyles} w-full h-full object-cover`;
   default:
    return `${baseStyles} ${opacityStyles} w-full h-auto object-contain`;
  }
 };

 return (
  <div className={`relative ${getContainerStyles()} ${className}`}>
   <Image
    {...props}
    ref={imgRef}
    src={currentSrc}
    alt={alt}
    className={getImageStyles()}
    onLoad={handleLoad}
    onError={handleError}
    loading="lazy"
    placeholder={blurDataURL ? "blur" : "empty"}
    blurDataURL={blurDataURL}
    quality={unoptimized ? undefined : quality}
    unoptimized={unoptimized}
    fill={aspectRatio !== "auto"}
    width={aspectRatio === "auto" ? props.width || 800 : undefined}
    height={aspectRatio === "auto" ? props.height || 400 : undefined}
   />
   {isLoading && showLoadingIndicator && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
     <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
   )}
  </div>
 );
}
