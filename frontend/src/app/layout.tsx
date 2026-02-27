import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandingProvider } from "@/context/ThemeContext";
import { SocketProvider } from "@/context/SocketContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Protocol Tournaments | Professional Esports Platform",
    template: "%s | Protocol",
  },
  description: "Join the world's leading esports tournament platform. Compete in Valorant, PUBG, BGMI, and Free Fire. Win prizes and build your legacy.",
  keywords: ["esports", "tournament", "gaming", "pubg", "valorant", "bgmi", "free fire", "competitive gaming"],
  authors: [{ name: "Protocol Team" }],
  creator: "Protocol",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://protocol.gg",
    title: "Protocol Tournaments | Professional Esports Platform",
    description: "Compete in top-tier esports tournaments. Win cash prizes. Build your team.",
    siteName: "Protocol",
    images: [
      {
        url: "https://protocol.gg/og-image.jpg", // Ensure this image exists in public folder
        width: 1200,
        height: 630,
        alt: "Protocol Esports Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Protocol Tournaments",
    description: "The ultimate platform for competitive gaming.",
    images: ["https://protocol.gg/og-image.jpg"],
    creator: "@protocolgg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
          <BrandingProvider>
            <SocketProvider>
              <Navbar />
              <main className="min-h-screen flex flex-col pb-20 md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
              <Footer />
            </SocketProvider>
          </BrandingProvider>
        </ThemeProvider>

        {/* Cashfree SDK v3 */}
        <Script id="cashfree-sdk" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
