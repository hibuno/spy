"use client";

import { useState, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon, Loader2 } from "lucide-react";

interface LazyImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
 fallbackSrc?: string;
 showLoadingIndicator?: boolean;
 blurDataURL?: string;
}

export default function LazyImage({
 src,
 alt,
 fallbackSrc,
 showLoadingIndicator = true,
 blurDataURL,
 className = "",
 ...props
}: LazyImageProps) {
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

 return (
  <div className={`relative ${className}`}>
   <Image
    {...props}
    ref={imgRef}
    src={currentSrc}
    alt={alt}
    className={`transition-opacity duration-300 ${
     isLoading ? "opacity-0" : "opacity-100"
    }`}
    onLoad={handleLoad}
    onError={handleError}
    loading="lazy"
    placeholder={blurDataURL ? "blur" : "empty"}
    blurDataURL={blurDataURL}
   />
   {isLoading && showLoadingIndicator && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
     <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
   )}
  </div>
 );
}
