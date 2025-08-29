import { Metadata } from "next";

export const metadata: Metadata = {
 title: "Offline - The Spy Project",
 description:
  "You are currently offline. Please check your internet connection.",
};

export default function OfflinePage() {
 return (
  <div className="min-h-screen flex items-center justify-center bg-background">
   <div className="text-center p-8 max-w-md">
    <div className="mb-6">
     <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
      <svg
       className="w-12 h-12 text-white"
       fill="none"
       stroke="currentColor"
       viewBox="0 0 24 24"
      >
       <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12"
       />
      </svg>
     </div>
     <h1 className="text-2xl font-bold text-foreground mb-2">
      You&apos;re Offline
     </h1>
     <p className="text-muted-foreground mb-6">
      It looks like you&apos;ve lost your internet connection. Don&apos;t worry,
      you can still browse some cached content.
     </p>
    </div>

    <div className="space-y-4">
     <div className="text-sm text-muted-foreground">
      <p className="mb-2">What you can do offline:</p>
      <ul className="text-left space-y-1">
       <li>• View previously loaded repositories</li>
       <li>• Browse cached pages</li>
       <li>• Access saved data</li>
      </ul>
     </div>
    </div>

    <div className="mt-8 pt-6 border-t border-border">
     <p className="text-xs text-muted-foreground">
      The Spy Project - Discover trending repositories
     </p>
    </div>
   </div>
  </div>
 );
}
