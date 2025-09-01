"use client";

import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LazyImage from "@/components/lazy-image";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";

interface ImagePreviewsProps {
 images: Array<{ url: string; width?: number; height?: number }>;
}

export function ImagePreviews({ images }: ImagePreviewsProps) {
 const [selectedImage, setSelectedImage] = useState<{
  url: string;
  width?: number;
  height?: number;
 } | null>(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const handleImageClick = (image: {
  url: string;
  width?: number;
  height?: number;
 }) => {
  setSelectedImage(image);
  setIsModalOpen(true);
 };

 return (
  <>
   <div className="p-4 bg-background border-b">
    <h3 className="text-base font-serif font-bold text-foreground mb-3">
     Previews
    </h3>
    <ScrollArea>
     <div className="flex gap-2">
      {images.map(
       (image, index) =>
        image.url &&
        image.url !== "" && (
         <div
          key={index}
          className="flex-shrink-0 cursor-pointer"
          onClick={() => handleImageClick(image)}
         >
          <LazyImage
           src={image.url}
           alt={`Preview ${index + 1}`}
           className="object-cover rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-foreground"
           width={image.width || 400}
           height={image.height || 200}
           showLoadingIndicator={true}
          />
         </div>
        )
      )}
     </div>
     <ScrollBar orientation="horizontal" />
    </ScrollArea>
   </div>

   <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
    <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
     <VisuallyHidden>
      <DialogHeader>
       <DialogTitle>Preview</DialogTitle>
      </DialogHeader>
     </VisuallyHidden>
     {selectedImage && (
      <div className="relative">
       <Image
        src={selectedImage.url}
        alt="Full size preview"
        className="w-full h-auto max-h-[80vh] object-contain bg-foreground"
        width={selectedImage.width || 400}
        height={selectedImage.height || 200}
       />
      </div>
     )}
    </DialogContent>
   </Dialog>
  </>
 );
}
