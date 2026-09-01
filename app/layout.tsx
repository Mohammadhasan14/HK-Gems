import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SiteShell } from "@/components/dom/SiteShell";
import "./globals.css";

// Display headlines — brief calls for mixing roman and italic across lines,
// so both styles are loaded.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

// Eyebrows and specs — used uppercase with wide tracking, so only the
// weights that read well at that treatment are loaded.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HK Gems — Heritage Stones, Hand-Set in Silver",
  description:
    "HK Gems is an atelier of heritage gemstones — Durr-e-Najaf, Firoza, Aqeeq, Pukhraj, Zamurd and Yaqoot — hand-set in sterling silver.",
  openGraph: {
    title: "HK Gems — Heritage Stones, Hand-Set in Silver",
    description:
      "Heritage gemstones hand-set in sterling silver. Stones of origin, cut and worn.",
    // TODO(design): real OG image, 1200x630, dark ground matching the site
    // (#08080A) with the wordmark and hero stone. Not fabricated here.
    type: "website",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HK Gems",
  description: "Atelier of heritage gemstones hand-set in sterling silver.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-[#08080A] text-white antialiased">
        <script
          type="application/ld+json"
          // JSON-LD is structured data, not executable code — a native
          // <script> tag is correct here, not next/script. `<` is escaped
          // to prevent breaking out of the tag via a crafted field value.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
