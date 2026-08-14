import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/inter";
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
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        <input type="hidden" value="authorsbook.vercel.app" id="sellerDomain" />
        {children}
        <Script
          src="https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

