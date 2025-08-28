"use client";

export function Radar() {
 return (
  <div className="flex items-center justify-between border-b px-6 py-4">
   <div className="relative flex size-4">
    <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></div>
    <div className="relative inline-flex size-4 rounded-full bg-violet-500"></div>
   </div>
   <div className="text-muted-foreground text-sm">
    Waiting for connection ...
   </div>
  </div>
 );
}
