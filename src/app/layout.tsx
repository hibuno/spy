import "./globals.css";
import type { Metadata } from "next";
import { Urbanist, Fira_Mono } from "next/font/google";
import { Databuddy } from "@databuddy/sdk/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";

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
   <body className={`${urbanist.variable} ${firaMono.variable} font-sans`}>
    <ThemeProvider defaultTheme="system">
     {/* Header Section */}
     <Header />
     {children}
    </ThemeProvider>
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
