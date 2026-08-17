import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@fontsource-variable/newsreader";
// @fontsource-variable/inter removed — next/font/google Inter already handles this font
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Authors Book | Books & Bookmarks",
  description:
    "Discover curated books and premium handcrafted bookmarks. We aspire that everyone spends their time with books and sees the world through an author's eyes.",
  keywords: "books, bookmarks, buy books online, reading, Indian authors, fiction, non-fiction",
  openGraph: {
    title: "Authors Book | Books & Bookmarks",
    description:
      "Discover curated books and premium handcrafted bookmarks for readers who love stories.",
    siteName: "Authors Book",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Authors Book | Books & Bookmarks",
    description:
      "Discover curated books and premium handcrafted bookmarks for readers who love stories.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Strip protocol from APP_URL so sellerDomain works in both staging & production
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.vercel.app';
  const sellerDomain = appUrl.replace(/^https?:\/\//, '');

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <head>
        {/* Shiprocket Checkout CSS – required by the integration guide */}
        <link rel="stylesheet" href="https://checkout-ui.shiprocket.com/assets/styles/shopify.css" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        <input type="hidden" value={sellerDomain} id="sellerDomain" />
        {children}
        <Script
          src="https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

