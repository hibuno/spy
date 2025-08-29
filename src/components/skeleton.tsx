import { cn } from "@/lib/utils";

interface SkeletonProps {
 className?: string;
 variant?: "default" | "card" | "text" | "avatar";
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
 const baseClasses = "animate-pulse bg-muted rounded";

 const variantClasses = {
  default: "",
  card: "h-32 w-full",
  text: "h-4 w-full",
  avatar: "h-8 w-8 rounded-full",
 };

 return <div className={cn(baseClasses, variantClasses[variant], className)} />;
}

interface SkeletonGridProps {
 rows?: number;
 columns?: number;
 className?: string;
}

export function SkeletonGrid({
 rows = 3,
 columns = 1,
 className,
}: SkeletonGridProps) {
 return (
  <div className={cn("space-y-3", className)}>
   {Array.from({ length: rows }).map((_, rowIndex) => (
    <div key={rowIndex} className="space-y-2">
     {Array.from({ length: columns }).map((_, colIndex) => (
      <Skeleton
       key={colIndex}
       variant="text"
       className={colIndex === columns - 1 ? "w-3/4" : "w-full"}
      />
     ))}
    </div>
   ))}
  </div>
 );
}

interface SkeletonCardProps {
 className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
 return (
  <div
   className={cn(
    "p-4 border border-border rounded-lg bg-background",
    className
   )}
  >
   <div className="space-y-3">
    <Skeleton variant="text" className="h-5 w-3/4" />
    <Skeleton variant="text" className="h-4 w-full" />
    <Skeleton variant="text" className="h-4 w-2/3" />
    <div className="flex space-x-2">
     <Skeleton variant="avatar" />
     <div className="space-y-1 flex-1">
      <Skeleton variant="text" className="h-3 w-1/2" />
      <Skeleton variant="text" className="h-3 w-1/3" />
     </div>
    </div>
   </div>
  </div>
 );
}
