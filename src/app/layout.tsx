import "./globals.css";
import type { Metadata } from "next";
import { Urbanist, Fira_Mono } from "next/font/google";
import { Databuddy } from "@databuddy/sdk/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

const urbanist = Urbanist({
 subsets: ["latin"],
 variable: "--font-sans",
});

const firaMono = Fira_Mono({
 subsets: ["latin"],
 weight: ["500"],
 variable: "--font-serif",
});

export const metadata: Metadata = {
 title: "GitHub Trending - Discover Rising Star Projects",
 description:
  "Discover trending GitHub repositories and rising star projects. Stay updated with the latest and most popular open source projects.",
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
  <html lang="en" suppressHydrationWarning>
   <body
    className={`${urbanist.variable} ${firaMono.variable} font-sans relative`}
   >
    <div
     className={cn(
      "absolute inset-0 z-[-1]",
      "[background-size:40px_40px]",
      "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
     )}
    />
    <div className="pointer-events-none absolute inset-0 z-[-1] flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
    {/* Header Section */}
    <Header />
    {children}
    {/* Footer Section */}
    <Footer />
    {process.env.NODE_ENV === "production" && (
     <Databuddy
      clientId="OohGWURJGFcKN4A5aQ7gT"
      trackOutgoingLinks={true}
      trackInteractions={true}
      trackEngagement={true}
      trackScrollDepth={true}
      trackExitIntent={true}
      trackBounceRate={true}
      trackWebVitals={true}
      trackErrors={true}
      enableBatching={true}
     />
    )}
   </body>
  </html>
 );
}
