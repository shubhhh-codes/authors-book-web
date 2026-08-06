import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, findBookIndexBySlug } from "@/app/catalog";
import ShelfPage from "@/app/ShelfPage";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates per-book SSR metadata so social links and search engines receive
 * the correct <title>, <meta description>, and og: tags for each volume.
 */
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const idx = findBookIndexBySlug(slug);
  if (idx === -1) {
    return { title: "Book Not Found | Authors Book" };
  }
  const book = catalog[idx];
  const title = `${book.title} — ${book.author} | Authors Book`;
  const image = book.coverImage ?? undefined;

  return {
    title,
    description: book.description,
    openGraph: {
      title,
      description: book.description,
      siteName: "Authors Book",
      type: "book",
      ...(image ? { images: [{ url: image, width: 600, height: 900 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: book.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * /book/[slug] — Server Component.
 *
 * Handles direct navigation and browser refresh of any volume deep-link URL
 * (e.g. https://yoursite.com/book/think-like-a-monk).
 *
 * Returns HTTP 200 with the full bookshelf experience pre-scoped to the
 * requested volume.  The ShelfPage client component boots the 3D canvas
 * and immediately opens the matching book in inspection mode via initialSlug.
 */
export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  if (findBookIndexBySlug(slug) === -1) {
    notFound();
  }
  return null;
}
