import type { Metadata } from "next";
import ShelfPage from "./ShelfPage";

export const metadata: Metadata = {
  title: "Authors Book | Books & Bookmarks",
  description:
    "Discover curated books and premium handcrafted bookmarks. Explore our interactive 3D bookshelf and find your next great read.",
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

export default function Home() {
  return null;
}
