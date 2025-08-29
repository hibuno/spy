import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Privacy Policy - The Spy Project",
 description:
  "Privacy Policy for The Spy Project. Learn how we collect, use, and protect your personal information when you use our platform.",
 keywords: [
  "privacy policy",
  "data protection",
  "privacy",
  "the spy project",
  "data collection",
  "cookies",
  "analytics",
 ],
 authors: [{ name: "Muhibbudin Suretno" }],
 creator: "Muhibbudin Suretno",
 publisher: "Muhibbudin Suretno",
 metadataBase: new URL("https://spy.hibuno.com"),
 alternates: {
  canonical: "/privacy-policy",
 },
 openGraph: {
  title: "Privacy Policy - The Spy Project",
  description:
   "Privacy Policy for The Spy Project. Learn how we collect, use, and protect your personal information.",
  url: "/privacy-policy",
  siteName: "The Spy Project",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/banner.webp",
    width: 1200,
    height: 630,
    alt: "Privacy Policy - The Spy Project",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "Privacy Policy - The Spy Project",
  description:
   "Privacy Policy for The Spy Project. Learn how we collect, use, and protect your personal information.",
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

export default function PrivacyPolicyPage() {
 return (
  <div className="max-w-6xl mx-auto border-x bg-background">
   <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto">
     <h1 className="font-serif text-4xl font-bold mb-8 text-center">
      Privacy Policy
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
        Introduction
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Welcome to The Spy Project (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
        &ldquo;us&rdquo;). We are committed to protecting your privacy and
        ensuring the security of your personal information. This Privacy Policy
        explains how we collect, use, disclose, and safeguard your information
        when you visit our website and use our services.
       </p>
       <p className="text-muted-foreground leading-relaxed mt-4">
        By using our services, you agree to the collection and use of
        information in accordance with this policy.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Information We Collect
       </h2>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Information You Provide
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We may collect information you directly provide to us, including:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>Contact information when you reach out to us</li>
        <li>Feedback, suggestions, or other communications you send us</li>
        <li>
         Information provided when participating in surveys or promotions
        </li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Automatically Collected Information
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        When you visit our website, we automatically collect certain
        information, including:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>
         <strong className="text-foreground">Usage Data:</strong> Pages visited,
         time spent on pages, click patterns, and navigation paths
        </li>
        <li>
         <strong className="text-foreground">Device Information:</strong> IP
         address, browser type, operating system, screen resolution
        </li>
        <li>
         <strong className="text-foreground">Location Data:</strong> General
         geographic location based on IP address
        </li>
        <li>
         <strong className="text-foreground">
          Cookies and Tracking Technologies:
         </strong>{" "}
         Information collected through cookies and similar technologies
        </li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Third-Party Data
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        We aggregate and display public information from third-party sources
        including GitHub, OSS Insight, and Hugging Face. This data is publicly
        available and does not include personal information about individual
        users.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        How We Use Your Information
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We use the collected information for the following purposes:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">Provide Services:</strong> To
         operate and maintain our website and services
        </li>
        <li>
         <strong className="text-foreground">Improve User Experience:</strong>{" "}
         To analyze usage patterns and improve our platform
        </li>
        <li>
         <strong className="text-foreground">Analytics:</strong> To understand
         how visitors interact with our website
        </li>
        <li>
         <strong className="text-foreground">Communication:</strong> To respond
         to your inquiries and provide customer support
        </li>
        <li>
         <strong className="text-foreground">Legal Compliance:</strong> To
         comply with legal obligations and protect our rights
        </li>
        <li>
         <strong className="text-foreground">Security:</strong> To detect and
         prevent fraud, abuse, and security incidents
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Cookies and Tracking Technologies
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We use cookies and similar tracking technologies to enhance your
        experience on our website:
       </p>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Essential Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        Required for the website to function properly. These cannot be disabled.
       </p>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Analytics Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We use DataBuddy analytics to understand how visitors interact with our
        website. This helps us improve our services and user experience.
        DataBuddy collects information about:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>Pages visited and time spent on each page</li>
        <li>Click patterns and user interactions</li>
        <li>Device and browser information</li>
        <li>Geographic location (general)</li>
        <li>Referral sources</li>
       </ul>

       <h3 className="font-serif text-lg font-medium mb-2 text-foreground">
        Managing Cookies
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        You can control cookies through your browser settings. However,
        disabling certain cookies may affect the functionality of our website.
        For more information about DataBuddy and how to opt out, please visit
        their privacy policy.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Information Sharing and Disclosure
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We do not sell, trade, or rent your personal information to third
        parties. We may share your information only in the following
        circumstances:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">Service Providers:</strong> With
         trusted third-party service providers who assist us in operating our
         website (e.g., hosting, analytics)
        </li>
        <li>
         <strong className="text-foreground">Legal Requirements:</strong> When
         required by law or to protect our rights and safety
        </li>
        <li>
         <strong className="text-foreground">Business Transfers:</strong> In
         connection with a merger, acquisition, or sale of assets
        </li>
        <li>
         <strong className="text-foreground">Consent:</strong> With your
         explicit consent
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Data Security
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We implement appropriate technical and organizational measures to
        protect your personal information against unauthorized access,
        alteration, disclosure, or destruction. However, no method of
        transmission over the internet is 100% secure, and we cannot guarantee
        absolute security.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Data Retention
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We retain your personal information only as long as necessary for the
        purposes outlined in this Privacy Policy, unless a longer retention
        period is required by law. Analytics data collected through DataBuddy is
        retained according to their retention policies.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Your Rights
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        Depending on your location, you may have the following rights regarding
        your personal information:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>
         <strong className="text-foreground">Access:</strong> Request access to
         your personal information
        </li>
        <li>
         <strong className="text-foreground">Correction:</strong> Request
         correction of inaccurate information
        </li>
        <li>
         <strong className="text-foreground">Deletion:</strong> Request deletion
         of your personal information
        </li>
        <li>
         <strong className="text-foreground">Portability:</strong> Request
         transfer of your data
        </li>
        <li>
         <strong className="text-foreground">Opt-out:</strong> Opt out of
         certain data processing activities
        </li>
       </ul>
       <p className="text-muted-foreground leading-relaxed mt-4">
        To exercise these rights, please contact us using the information
        provided below.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Third-Party Links
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Our website may contain links to third-party websites. We are not
        responsible for the privacy practices or content of these external
        sites. We encourage you to review the privacy policies of any
        third-party websites you visit.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Children&apos;s Privacy
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Our services are not intended for children under 13 years of age. We do
        not knowingly collect personal information from children under 13. If we
        become aware that we have collected personal information from a child
        under 13, we will take steps to delete such information.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Changes to This Privacy Policy
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page and
        updating the &ldquo;Last updated&rdquo; date. We encourage you to review
        this Privacy Policy periodically.
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
