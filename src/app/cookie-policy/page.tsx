import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Cookie Policy - The Spy Project",
 description:
  "Cookie Policy for The Spy Project. Learn about how we use cookies and similar technologies on our platform.",
 keywords: [
  "cookie policy",
  "cookies",
  "privacy",
  "the spy project",
  "data collection",
  "analytics",
  "tracking",
 ],
 authors: [{ name: "Muhibbudin Suretno" }],
 creator: "Muhibbudin Suretno",
 publisher: "Muhibbudin Suretno",
 metadataBase: new URL("https://spy.hibuno.com"),
 alternates: {
  canonical: "/cookie-policy",
 },
 openGraph: {
  title: "Cookie Policy - The Spy Project",
  description:
   "Cookie Policy for The Spy Project. Learn about how we use cookies and similar technologies.",
  url: "/cookie-policy",
  siteName: "The Spy Project",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "Cookie Policy - The Spy Project",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "Cookie Policy - The Spy Project",
  description:
   "Cookie Policy for The Spy Project. Learn about how we use cookies and similar technologies.",
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

export default function CookiePolicyPage() {
 return (
  <div className="max-w-6xl mx-auto border-x bg-background">
   <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto">
     <h1 className="font-serif text-4xl font-bold mb-8 text-center">
      Cookie Policy
     </h1>

     <div className="prose prose-lg max-w-none">
      <p className="text-muted-foreground mb-8">
       <strong className="text-foreground">Last updated:</strong>{" "}
       {new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
       })}
      </p>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        What Are Cookies?
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Cookies are small text files that are stored on your device when you
        visit a website. They help websites remember your preferences, improve
        user experience, and provide analytics about how the site is used.
        Cookies can be set by the website you&apos;re visiting (first-party
        cookies) or by third-party services integrated into the website
        (third-party cookies).
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        How We Use Cookies
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        The Spy Project uses cookies and similar technologies to:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>Ensure the website functions properly</li>
        <li>Remember your preferences and settings</li>
        <li>Analyze website usage and performance</li>
        <li>Improve user experience and content relevance</li>
        <li>Provide personalized features and recommendations</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Types of Cookies We Use
       </h2>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Essential Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        These cookies are necessary for the website to function and cannot be
        switched off in our systems. They are usually only set in response to
        actions made by you which amount to a request for services.
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>
         <strong className="text-foreground">Session Cookies:</strong> Temporary
         cookies that expire when you close your browser
        </li>
        <li>
         <strong className="text-foreground">Authentication Cookies:</strong>{" "}
         Help us verify your identity and maintain secure sessions
        </li>
        <li>
         <strong className="text-foreground">Security Cookies:</strong> Protect
         against cross-site request forgery and other security threats
        </li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Analytics Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We use DataBuddy, a privacy-focused analytics service, to understand how
        visitors interact with our website. These cookies collect information
        about:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>Pages visited and time spent on each page</li>
        <li>Click patterns and user interactions</li>
        <li>Device and browser information</li>
        <li>Geographic location (general, based on IP address)</li>
        <li>Referral sources and traffic patterns</li>
        <li>Scroll depth and engagement metrics</li>
       </ul>
       <p className="text-muted-foreground leading-relaxed">
        DataBuddy is designed with privacy in mind and does not collect
        personally identifiable information. The data is aggregated and
        anonymized to protect user privacy.
       </p>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Functional Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        These cookies enable the website to provide enhanced functionality and
        personalization:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>
         <strong className="text-foreground">Preference Cookies:</strong>{" "}
         Remember your language, theme, and display preferences
        </li>
        <li>
         <strong className="text-foreground">Feature Cookies:</strong> Enable
         specific website features you&apos;ve requested
        </li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Third-Party Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        We may integrate third-party services that set their own cookies. These
        include:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">DataBuddy:</strong> Privacy-focused
         analytics platform
        </li>
        <li>
         <strong className="text-foreground">Vercel:</strong> Our hosting
         platform may set performance and security cookies
        </li>
        <li>
         <strong className="text-foreground">Supabase:</strong> Database and
         authentication services
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Cookie Retention
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        Different types of cookies have different lifespans:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">Session Cookies:</strong> Deleted
         when you close your browser
        </li>
        <li>
         <strong className="text-foreground">Persistent Cookies:</strong> Remain
         until deleted or expired (typically 30 days to 2 years)
        </li>
        <li>
         <strong className="text-foreground">Analytics Data:</strong> Retained
         according to DataBuddy&apos;s retention policies
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Managing Cookies
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        You have several options for managing cookies:
       </p>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Browser Settings
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        Most web browsers allow you to control cookies through their settings
        preferences. You can:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>Block all cookies</li>
        <li>Block third-party cookies</li>
        <li>Delete existing cookies</li>
        <li>Receive notifications when cookies are set</li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Browser-Specific Instructions
       </h3>
       <div className="bg-muted p-4 rounded-lg mb-4">
        <p className="text-muted-foreground text-sm">
         <strong className="text-foreground">Chrome:</strong> Settings → Privacy
         and security → Cookies and other site data
         <br />
         <strong className="text-foreground">Firefox:</strong> Settings →
         Privacy & Security → Cookies and Site Data
         <br />
         <strong className="text-foreground">Safari:</strong> Preferences →
         Privacy → Manage Website Data
         <br />
         <strong className="text-foreground">Edge:</strong> Settings → Cookies
         and site permissions → Cookies and site data
        </p>
       </div>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Opting Out of Analytics
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        You can opt out of DataBuddy analytics tracking by visiting their
        privacy settings or by using browser extensions that block analytics
        cookies. Please note that opting out may affect the functionality of
        some website features.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Impact of Disabling Cookies
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        While you can browse our website without cookies, disabling them may
        affect your experience:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>Some features may not work properly</li>
        <li>Your preferences may not be saved</li>
        <li>You may see less relevant content</li>
        <li>Analytics data will not be collected</li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Other Tracking Technologies
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        In addition to cookies, we may use other tracking technologies:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">Web Beacons:</strong> Small graphic
         images that track page views and email opens
        </li>
        <li>
         <strong className="text-foreground">Local Storage:</strong> Browser
         storage for saving user preferences
        </li>
        <li>
         <strong className="text-foreground">Session Storage:</strong> Temporary
         browser storage for session data
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Data Sharing and Third Parties
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We may share cookie data with trusted third-party service providers who
        assist us in operating our website and analyzing usage. These partners
        are contractually obligated to maintain the confidentiality and security
        of your data. We do not sell cookie data to third parties for marketing
        purposes.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Children&apos;s Privacy
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Our website is not intended for children under 13 years of age. We do
        not knowingly collect personal information through cookies from children
        under 13. If we become aware that we have collected cookie data from a
        child under 13, we will take steps to delete such data.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Updates to This Policy
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We may update this Cookie Policy from time to time to reflect changes in
        our practices or for other operational, legal, or regulatory reasons. We
        will notify you of any material changes by posting the updated policy on
        this page and updating the &ldquo;Last updated&rdquo; date.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Contact Us
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        If you have any questions about these Terms, please contact us:{" "}
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
