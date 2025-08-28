import "./globals.css";
import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import { Databuddy } from "@databuddy/sdk/react";

const inter = Inter({
 subsets: ["latin"],
 variable: "--font-sans",
});

const caveat = Caveat({
 subsets: ["latin"],
 weight: ["700"],
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
  <html lang="en">
   <body className={`${inter.variable} ${caveat.variable} font-sans`}>
    {children}
    {process.env.NODE_ENV === "production" && (
     <Databuddy clientId="OohGWURJGFcKN4A5aQ7gT" enableBatching={true} />
    )}
   </body>
  </html>
 );
}
