import Link from 'next/link';
import type { CategoryCard } from '@/lib/types';

// ─── Static data extracted verbatim from templates/index.json ──────────────
// Shopify CDN image paths are replaced with public/images/ paths.
// Drop your actual images into authorsbook-web/public/images/categories/
// and rename them to match, OR leave src blank to show the coloured-card fallback.

const CATEGORIES: CategoryCard[] = [
  {
    heading: 'All Books',
    textColor: '#ffffff',
    buttonLabel: 'View all',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#000000',
    link: '/shop?type=book',
    bgColor: '#111111',
    borderColor: '#ffffff',
  },
  {
    heading: 'Best Seller',
    textColor: '#ffffff',
    buttonLabel: 'View all',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#000000',
    link: '/shop?tag=best-seller',
    bgColor: '#222222',
    borderColor: '#ffffff',
  },
  {
    heading: 'Adapted & Appeared in Films',
    textColor: '#000000',
    buttonLabel: 'View all',
    buttonBgColor: '#000000',
    buttonTextColor: '#ffffff',
    link: '/shop?tag=film-appeared',
    bgColor: '#f0f0f0',
    borderColor: '#000000',
  },
  {
    heading: 'Bookmarks',
    textColor: '#000000',
    buttonLabel: 'View all',
    buttonBgColor: '#000000',
    buttonTextColor: '#ffffff',
    link: '/shop?type=bookmark',
    bgColor: '#f0f0f0',
    borderColor: '#000000',
  },
  {
    heading: 'Iconic Bookmarks',
    textColor: '#ffffff',
    buttonLabel: 'View all',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#000000',
    link: '/shop?tag=iconic',
    bgColor: '#222222',
    borderColor: '#ffffff',
  },
  {
    heading: 'Adventure',
    textColor: '#ffffff',
    buttonLabel: 'View all',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#000000',
    link: '/shop?tag=adventure',
    bgColor: '#111111',
    borderColor: '#ffffff',
  },
];

// Decorative book SVG used when no image is available (mirrors placeholder_svg_tag)
function BookPlaceholder({ textColor }: { textColor: string }) {
  return (
    <svg
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <rect x="20" y="10" width="120" height="180" rx="6" fill={textColor} fillOpacity="0.12" />
      <rect x="30" y="25" width="80" height="8" rx="4" fill={textColor} fillOpacity="0.35" />
      <rect x="30" y="42" width="60" height="6" rx="3" fill={textColor} fillOpacity="0.25" />
      <rect x="30" y="70" width="100" height="80" rx="4" fill={textColor} fillOpacity="0.08" />
      <rect x="30" y="165" width="55" height="6" rx="3" fill={textColor} fillOpacity="0.2" />
    </svg>
  );
}

export default function CategoryGrid() {
  return (
    <section
      className="book-grid-section"
      aria-labelledby="category-grid-heading"
    >
      {/* Screen-reader-only heading for accessibility */}
      <h2 id="category-grid-heading" className="sr-only">
        Browse by Category
      </h2>

      <div className="book-grid-container">
        {CATEGORIES.map((cat, idx) => (
          <Link
            key={idx}
            href={cat.link}
            className="book-grid-item"
            style={{
              backgroundColor: cat.bgColor,
              color: cat.textColor,
              border: `2px solid ${cat.borderColor}`,
            }}
            aria-label={`${cat.heading} – ${cat.buttonLabel}`}
          >
            {/* Text content */}
            <div className="book-grid-content">
              <h2
                className="book-grid-title"
                style={{ color: cat.textColor }}
              >
                {cat.heading}
              </h2>

              {cat.buttonLabel && (
                <span
                  className="book-grid-btn"
                  style={{
                    backgroundColor: cat.buttonBgColor,
                    color: cat.buttonTextColor,
                  }}
                >
                  {cat.buttonLabel}
                </span>
              )}
            </div>

            {/* Decorative image overlay */}
            <div className="book-grid-image-wrapper" aria-hidden="true">
              <BookPlaceholder textColor={cat.textColor} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
