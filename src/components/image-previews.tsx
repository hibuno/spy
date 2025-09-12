"use client";

import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SmartImage from "@/components/smart-image";

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
          <SmartImage
           src={image.url}
           alt={`Preview ${index + 1}`}
           className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-foreground"
           width={image.width || 400}
           height={image.height || 200}
           showLoadingIndicator={true}
           quality={75}
           sizes="400px"
           aspectRatio="auto"
           maxHeight={200}
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
      <div className="relative max-h-[80vh] overflow-hidden">
       <SmartImage
        src={selectedImage.url}
        alt="Full size preview"
        className="bg-foreground"
        width={selectedImage.width || 800}
        height={selectedImage.height || 600}
        quality={90}
        sizes="(max-width: 768px) 100vw, 1200px"
        aspectRatio="auto"
        maxHeight={800}
       />
      </div>
     )}
    </DialogContent>
   </Dialog>
  </>
 );
}
