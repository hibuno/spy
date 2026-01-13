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
  title: "The Spy Project - Discover Rising Stars & Popular Repositories",
  description:
    "Discover trending repositories and rising star projects from GitHub, GitLab, and other platforms. Stay updated with the latest open source innovations, research papers, and developer tools.",
  keywords: [
    "trending repositories",
    "github trending",
    "open source projects",
    "rising stars",
    "developer tools",
    "programming",
    "software development",
    "research papers",
    "arxiv",
    "machine learning",
    "AI projects",
  ],
  authors: [{ name: "Muhibbudin Suretno" }],
  creator: "Muhibbudin Suretno",
  publisher: "Muhibbudin Suretno",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://spy.hibuno.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The Spy Project - Discover Rising Stars & Popular Repositories",
    description:
      "Discover trending repositories and rising star projects from GitHub, GitLab, and other platforms. Stay updated with the latest open source innovations.",
    url: "/",
    siteName: "The Spy Project",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/banner.webp",
        width: 1200,
        height: 630,
        alt: "The Spy Project - Discover Rising Stars & Popular Repositories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Spy Project - Discover Rising Stars & Popular Repositories",
    description:
      "Discover trending repositories and rising star projects from GitHub, GitLab, and other platforms.",
    images: ["/banner.webp"],
    creator: "@thespyproject",
    site: "@thespyproject",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Spy Project",
              description:
                "Discover trending repositories and rising star projects from GitHub, GitLab, and other platforms.",
              url: "https://spy.hibuno.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${"https://spy.hibuno.com"}?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: "The Spy Project",
                url: "https://spy.hibuno.com",
              },
            }),
          }}
        />
      </head>
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
        {process.env.NODE_ENV === "production" &&
          process.env.NEXT_PUBLIC_DATABUDDY_KEY && (
            <Databuddy
              clientId={process.env.NEXT_PUBLIC_DATABUDDY_KEY}
              trackOutgoingLinks={true}
              trackInteractions={true}
              trackScrollDepth={true}
              trackWebVitals={true}
              trackErrors={true}
              enableBatching={true}
            />
          )}
      </body>
    </html>
  );
}
