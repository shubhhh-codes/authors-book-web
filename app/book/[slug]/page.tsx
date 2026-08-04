"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * /book/[slug] is a shareable deep-link URL used only for URL bar display
 * via window.history.pushState while the SPA is running on the home page.
 *
 * If someone opens /book/[slug] directly (e.g. shared link, page refresh),
 * redirect them to the home page with an ?open= query param so
 * ProgressLibrary can auto-focus that book without a separate full mount.
 */
export default function BookSlugPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  useEffect(() => {
    // Redirect to home page with a query param so ProgressLibrary's
    // getSlugFromLocation reads it and focuses the correct book.
    if (slug) {
      window.location.replace(`/?book=${encodeURIComponent(slug)}`);
    } else {
      window.location.replace("/");
    }
  }, [slug]);

  // Show nothing while redirecting — home page handles the experience.
  return null;
}
