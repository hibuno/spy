import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "About - The Spy Project",
 description:
  "Learn about The Spy Project - a platform for discovering trending GitHub repositories, rising star projects, and cutting-edge research papers. Built by Hibuno.",
 keywords: [
  "about",
  "the spy project",
  "hibuno",
  "trending repositories",
  "open source",
  "github",
  "research papers",
 ],
 authors: [{ name: "Muhibbudin Suretno" }],
 creator: "Muhibbudin Suretno",
 publisher: "Muhibbudin Suretno",
 metadataBase: new URL("https://spy.hibuno.com"),
 alternates: {
  canonical: "/about",
 },
 openGraph: {
  title: "About - The Spy Project",
  description:
   "Learn about The Spy Project - a platform for discovering trending GitHub repositories, rising star projects, and cutting-edge research papers.",
  url: "/about",
  siteName: "The Spy Project",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "About The Spy Project",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "About - The Spy Project",
  description:
   "Learn about The Spy Project - a platform for discovering trending GitHub repositories, rising star projects, and cutting-edge research papers.",
  images: ["/og-image.png"],
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

export default function AboutPage() {
 return (
  <div className="max-w-6xl mx-auto border-x bg-background">
   <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto">
     <h1 className="font-serif text-4xl font-bold mb-8 text-center">
      About Us?
     </h1>

     <div className="prose prose-lg max-w-none">
      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Our Mission
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        The Spy Project is dedicated to helping developers, researchers, and
        technology enthusiasts discover the most innovative and trending
        projects in the open source community. We curate and showcase rising
        star repositories, cutting-edge research papers, and developer tools
        that are shaping the future of technology.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        What We Do
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We aggregate data from multiple sources to provide you with:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         Trending GitHub repositories with real-time star counts and activity
         metrics
        </li>
        <li>Rising star projects that show exceptional growth potential</li>
        <li>
         Cutting-edge research papers from Hugging Face and academic sources
        </li>
        <li>
         Comprehensive repository information including screenshots,
         documentation, and technical details
        </li>
        <li>
         Advanced search and filtering capabilities to find exactly what
         you&apos;re looking for
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Our Technology Stack
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        Built with modern web technologies and powered by reliable cloud
        services:
       </p>
       <div className="grid md:grid-cols-2 gap-6">
        <div>
         <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
          Frontend
         </h3>
         <ul className="text-muted-foreground space-y-1">
          <li>Next.js 14 with App Router</li>
          <li>React with TypeScript</li>
          <li>Tailwind CSS for styling</li>
          <li>Shadcn/ui component library</li>
         </ul>
        </div>
        <div>
         <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
          Backend & Services
         </h3>
         <ul className="text-muted-foreground space-y-1">
          <li>Vercel for hosting and deployment</li>
          <li>Supabase for database and storage</li>
          <li>N8N for workflow automation</li>
          <li>DataBuddy for analytics</li>
          <li>Playwright & HTTP for web scraping</li>
          <li>OpenRouter & OpenAI for AI service</li>
         </ul>
        </div>
       </div>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Data Sources
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We gather information from trusted sources to ensure accuracy and
        relevance:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">GitHub API:</strong> Official
         GitHub API for repository data, stars, forks, and metadata
        </li>
        <li>
         <strong className="text-foreground">OSS Insight:</strong>{" "}
         Community-driven analytics platform for open source project insights
        </li>
        <li>
         <strong className="text-foreground">Hugging Face:</strong> Leading
         platform for machine learning models and research papers
        </li>
        <li>
         <strong className="text-foreground">GitHub Trending:</strong> Real-time
         trending repository data
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        About Hibuno
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        The Spy Project is developed and maintained by{" "}
        <a
         href="https://hibuno.com"
         className="underline text-foreground hover:text-primary"
         target="_blank"
         rel="noopener noreferrer"
        >
         Hibuno
        </a>
        , founded by Muhibbudin Suretno. We are passionate about open source
        technology and believe in making information about innovative projects
        more accessible to everyone. Our goal is to bridge the gap between
        developers and the amazing work happening in the global open source
        community.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Get in Touch
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Have questions, want to report discrepancies or dislikes, or are you a
        promotion/sponsor looking to get in touch? We&apos;d love to hear from
        you! Reach out to us directly at:{" "}
        <a
         href="mailto:muhibbudins1997@gmail.com"
         className="underline text-foreground hover:text-primary"
         target="_blank"
         rel="noopener noreferrer"
        >
         muhibbudins1997@gmail.com
        </a>
       </p>
      </section>
     </div>
    </div>
   </div>
  </div>
 );
}
