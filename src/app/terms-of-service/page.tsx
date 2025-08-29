import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Terms of Service - The Spy Project",
 description:
  "Terms of Service for The Spy Project. Please read these terms carefully before using our platform for discovering trending repositories.",
 keywords: [
  "terms of service",
  "terms",
  "legal",
  "the spy project",
  "user agreement",
  "service terms",
 ],
 authors: [{ name: "Muhibbudin Suretno" }],
 creator: "Muhibbudin Suretno",
 publisher: "Muhibbudin Suretno",
 metadataBase: new URL("https://spy.hibuno.com"),
 alternates: {
  canonical: "/terms-of-service",
 },
 openGraph: {
  title: "Terms of Service - The Spy Project",
  description:
   "Terms of Service for The Spy Project. Please read these terms carefully before using our platform.",
  url: "/terms-of-service",
  siteName: "The Spy Project",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/banner.webp",
    width: 1200,
    height: 630,
    alt: "Terms of Service - The Spy Project",
   },
  ],
 },
 twitter: {
  card: "summary_large_image",
  title: "Terms of Service - The Spy Project",
  description:
   "Terms of Service for The Spy Project. Please read these terms carefully before using our platform.",
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

export default function TermsOfServicePage() {
 return (
  <div className="max-w-6xl mx-auto border-x bg-background">
   <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto">
     <h1 className="font-serif text-4xl font-bold mb-8 text-center">
      Terms of Service
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
        Acceptance of Terms
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Welcome to The Spy Project (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
        &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern
        your access to and use of our website, mobile application, and services
        (collectively, the &ldquo;Service&rdquo;). By accessing or using our
        Service, you agree to be bound by these Terms. If you do not agree to
        these Terms, please do not use our Service.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Description of Service
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        The Spy Project is a platform that provides:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>Discovery and exploration of trending GitHub repositories</li>
        <li>Information about rising star projects and developer tools</li>
        <li>Access to research papers and academic content</li>
        <li>Repository analytics and metadata</li>
        <li>Search and filtering capabilities</li>
       </ul>
       <p className="text-muted-foreground leading-relaxed mt-4">
        Our Service aggregates publicly available information from various
        sources including GitHub, OSS Insight, and Hugging Face.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        User Obligations
       </h2>
       <p className="text-muted-foreground leading-relaxed mb-4">
        By using our Service, you agree to:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2">
        <li>Use the Service only for lawful purposes</li>
        <li>Not attempt to interfere with or disrupt the Service</li>
        <li>
         Not use automated tools to access the Service without permission
        </li>
        <li>
         Not reproduce, distribute, or create derivative works from our content
         without authorization
        </li>
        <li>Respect the intellectual property rights of others</li>
        <li>
         Not use the Service to transmit harmful, offensive, or illegal content
        </li>
       </ul>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Intellectual Property
       </h2>
       <h3 className="text-lg font-medium mb-2 font-serif text-foreground">
        Our Content
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        The Service and its original content, features, and functionality are
        owned by The Spy Project and are protected by copyright, trademark, and
        other intellectual property laws. This includes but is not limited to:
       </p>
       <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
        <li>Website design and user interface</li>
        <li>Software and algorithms</li>
        <li>Trademarks and branding</li>
        <li>Original written content and descriptions</li>
       </ul>

       <h3 className="text-lg font-medium mb-2 font-serif text-foreground">
        Third-Party Content
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        The Service displays content from third-party sources (GitHub, OSS
        Insight, Hugging Face). This content is subject to the respective
        owners&apos; intellectual property rights. We do not claim ownership of
        third-party content and are not responsible for its accuracy or
        legality.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        User-Generated Content
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Our Service may allow you to submit feedback, suggestions, or other
        content. By submitting content, you grant us a non-exclusive,
        royalty-free, perpetual, and worldwide license to use, modify, and
        distribute your content in connection with our Service. You represent
        that you own or have the necessary rights to submit such content.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Privacy and Data Collection
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        Your privacy is important to us. Our collection and use of personal
        information is governed by our Privacy Policy, which is incorporated
        into these Terms by reference. By using our Service, you consent to the
        collection and use of information as outlined in our Privacy Policy.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Disclaimers and Limitations
       </h2>
       <h3 className="text-lg font-medium mb-2 font-serif text-foreground">
        Service Availability
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        We strive to provide reliable service but cannot guarantee uninterrupted
        access. The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind.
       </p>

       <h3 className="text-lg font-medium mb-2 font-serif text-foreground">
        Content Accuracy
       </h3>
       <p className="text-muted-foreground leading-relaxed mb-4">
        While we make reasonable efforts to ensure the accuracy of information
        displayed, we do not guarantee that all content is current, complete, or
        error-free. Repository information and statistics may change over time.
       </p>

       <h3 className="text-lg font-medium mb-2 font-serif text-foreground">
        Third-Party Links
       </h3>
       <p className="text-muted-foreground leading-relaxed">
        Our Service may contain links to third-party websites. We are not
        responsible for the content, privacy policies, or practices of these
        external sites.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Limitation of Liability
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        To the maximum extent permitted by law, The Spy Project shall not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages, or any loss of profits or revenues, whether incurred directly
        or indirectly, or any loss of data, use, goodwill, or other intangible
        losses resulting from your use of the Service.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Indemnification
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        You agree to indemnify and hold harmless The Spy Project, its
        affiliates, officers, directors, employees, and agents from any claims,
        damages, losses, liabilities, and expenses arising out of your use of
        the Service or violation of these Terms.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Termination
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We may terminate or suspend your access to the Service immediately,
        without prior notice or liability, for any reason whatsoever, including
        without limitation if you breach these Terms. Upon termination, your
        right to use the Service will cease immediately.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Governing Law
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        These Terms shall be interpreted and governed by the laws of Indonesia,
        without regard to its conflict of law provisions. Any disputes arising
        from these Terms shall be subject to the exclusive jurisdiction of the
        courts in Indonesia.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Changes to Terms
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        We reserve the right to modify these Terms at any time. We will notify
        users of significant changes by posting the updated Terms on this page
        and updating the &ldquo;Last updated&rdquo; date. Your continued use of
        the Service after such modifications constitutes acceptance of the
        updated Terms.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Severability
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        If any provision of these Terms is found to be unenforceable or invalid,
        that provision will be limited or eliminated to the minimum extent
        necessary so that the Terms will otherwise remain in full force and
        effect.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Entire Agreement
       </h2>
       <p className="text-muted-foreground leading-relaxed">
        These Terms constitute the entire agreement between you and The Spy
        Project regarding the use of the Service and supersede all prior
        agreements and understandings.
       </p>
      </section>

      <section className="mb-8">
       <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground">
        Contact Information
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
