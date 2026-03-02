import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MaintenanceWatcher } from "@/components/MaintenanceWatcher";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/context/ThemeContext";
import { SocketProvider } from "@/context/SocketContext";
import { CmsEngineProvider } from "@/context/CmsContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let content: Record<string, string> = {};

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/cms/config`, {
      next: { revalidate: 60 }
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.content) {
        content = data.content;
      }
    } else {
      console.warn(`CMS config fetch returned status: ${res.status}`);
    }
  } catch (error) {
    console.error("Failed to fetch global SEO metadata - Backend might be down:", error instanceof Error ? error.message : error);
  }

  const domain = "https://protocols-turnaments.vercel.app";
  const title = content.SEO_META_TITLE || "Protocol Tournaments | Professional Esports Platform";
  const description = content.SEO_META_DESCRIPTION || "Join the world's leading esports tournament platform. Compete in Valorant, PUBG, BGMI, and Free Fire. Win prizes and build your legacy.";
  const keywords = content.SEO_META_KEYWORDS ? content.SEO_META_KEYWORDS.split(',').map(k => k.trim()) : ["esports", "tournament", "gaming", "pubg", "valorant", "bgmi", "free fire", "competitive gaming"];

  // Ensure OG image is an absolute URL
  let ogImage = content.SEO_OG_IMAGE || `${domain}/logo-primary.png`;
  if (ogImage.startsWith('/')) {
    ogImage = `${domain}${ogImage}`;
  }

  const favicon = content.SEO_FAVICON_URL || "/favicon.ico";

  return {
    title: {
      default: title,
      template: "%s | Protocol",
    },
    description,
    keywords,
    metadataBase: new URL(domain),
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    authors: [{ name: "Protocol Team" }],
    creator: "Protocol Tournaments",
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: domain,
      title: title,
      description: description,
      siteName: "Protocol Tournaments",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImage],
      creator: "@ProtocolTournaments",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CmsEngineProvider>
            <BrandingProvider>
              <SocketProvider>
                <MaintenanceWatcher />
                <Navbar />
                <main className="min-h-screen flex flex-col pb-20 md:pb-0">
                  {children}
                </main>
                <MobileBottomNav />
                <Footer />
              </SocketProvider>
            </BrandingProvider>
          </CmsEngineProvider>
        </ThemeProvider>

        {/* Cashfree SDK v3 */}
        <Script id="cashfree-sdk" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
