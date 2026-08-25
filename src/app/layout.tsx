import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prnp-variant-analyzer.space-z.ai"),
  title: "PRNP Variant Analyzer · Open-Source Literature & Variant Mining",
  description:
    "Mine PubMed for PRNP gene mutation papers, extract amino-acid variants (E200K, D178N, P102L…), record them against a curated prion knowledge base, and export clean CSV datasets for the prion research community.",
  keywords: [
    "PRNP",
    "prion disease",
    "variant analyzer",
    "PubMed",
    "E-utilities",
    "E200K",
    "D178N",
    "bioinformatics",
    "open source",
  ],
  authors: [{ name: "PRNP Variant Analyzer Community" }],
  openGraph: {
    title: "PRNP Variant Analyzer",
    description: "Open-source literature & variant mining for prion research",
    siteName: "PRNP Variant Analyzer",
    type: "website",
    images: [
      {
        url: "/screenshots/home-desktop.png",
        width: 1440,
        height: 900,
        alt: "PRNP Variant Analyzer landing page: pipeline, live PubMed abstract, and the structured variant/evidence table it produces",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRNP Variant Analyzer",
    description: "Open-source literature & variant mining for prion research",
    images: ["/screenshots/home-desktop.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
