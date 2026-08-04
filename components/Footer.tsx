import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

const COLLECTION_LINKS = [
  { label: 'All Books', href: '/shop?type=book' },
  { label: 'Best Sellers', href: '/shop?tag=best-seller' },
  { label: 'Appeared in Films', href: '/shop?tag=film-appeared' },
  { label: 'Bookmarks', href: '/shop?type=bookmark' },
  { label: 'Iconic Bookmarks', href: '/shop?tag=iconic' },
];

const POLICY_LINKS = [
  { label: 'Refund & Return Policy', href: '/#accordion-panel-1' },
  { label: 'Privacy Policy', href: '/#accordion-panel-2' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--paper-deep)] text-[var(--ink)] mt-auto font-[family-name:var(--sans)] border-t border-[var(--hairline)]" role="contentinfo">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="text-2xl font-normal tracking-tight text-[var(--ink)] hover:text-[var(--accent)] transition-colors font-[family-name:var(--serif)]"
              aria-label="Authors Book – Home"
            >
              authorsbook
            </Link>
            <p className="mt-4 text-sm text-[var(--ink-soft)] leading-relaxed max-w-xs font-[family-name:var(--serif)] italic">
              Curated books and premium handcrafted bookmarks for readers who love
              stories. Fill your shelves and your mind.
            </p>

            {/* Contact — verbatim from collapsible_row_7K7a7f */}
            <address className="mt-6 not-italic text-sm text-[var(--ink-soft)] space-y-2 font-[family-name:var(--serif)]">
              <p>
                📧{' '}
                <a
                  href="mailto:authorsbook01@gmail.com"
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  authorsbook01@gmail.com
                </a>
              </p>
              <p>
                📞{' '}
                <a
                  href="tel:+919265795380"
                  className="hover:text-[var(--ink)] transition-colors font-[family-name:var(--sans)] text-xs font-semibold tracking-wider"
                >
                  +91 9265795380
                </a>
              </p>
              <p className="text-[var(--ink-soft)]/70 text-[9px] font-semibold uppercase tracking-widest font-[family-name:var(--sans)]">
                Mon – Sat &nbsp;|&nbsp; 10:00 AM – 6:00 PM IST
              </p>
            </address>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-4 font-[family-name:var(--sans)]">
              Quick Links
            </h3>
            <ul className="space-y-3 list-none" role="list">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors font-[family-name:var(--serif)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-4 font-[family-name:var(--sans)]">
              Collections
            </h3>
            <ul className="space-y-3 list-none" role="list">
              {COLLECTION_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors font-[family-name:var(--serif)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-4 font-[family-name:var(--sans)]">
              Policies
            </h3>
            <ul className="space-y-3 list-none" role="list">
              {POLICY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors font-[family-name:var(--serif)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--hairline)] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)]">
            © {year} Authors Book. All rights reserved.
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] font-[family-name:var(--sans)]">
            Made with ❤️ for book lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
