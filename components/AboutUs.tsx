// Maps rich-text section from templates/index.json
// heading: "ABOUT US" / text: brand manifesto
// settings: desktop_content_position: "center", content_alignment: "center", full_width: true

export default function AboutUs() {
  return (
    <section
      id="about"
      className="w-full py-16 sm:py-24 bg-[var(--paper)] text-[var(--ink)]"
      aria-labelledby="about-heading"
    >
      {/* page-width inner wrapper, content centred */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center font-[family-name:var(--serif)]">
        {/* Label matching "LIBRARY EDITION" style */}
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-3 font-[family-name:var(--sans)]">
          Our Mission
        </p>

        {/* Heading matching "An Elegant Puzzle" style */}
        <h2
          id="about-heading"
          className="text-4xl sm:text-5xl font-normal tracking-tight mb-8 text-[var(--ink)]"
        >
          About Us
        </h2>

        {/* Decorative divider line */}
        <div className="w-16 h-px bg-[var(--hairline)] mx-auto mb-10" aria-hidden="true" />

        {/* Quote block matching the blockquote from the image */}
        <blockquote className="italic text-lg sm:text-xl text-[var(--ink)] border-l border-[var(--ink)] pl-6 text-left max-w-xl mx-auto my-10 leading-relaxed">
          &ldquo;If you don&rsquo;t like to read, you haven&rsquo;t found the right book yet&rdquo;
          <cite className="block not-italic text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mt-3 font-[family-name:var(--sans)]">
            manifesto
          </cite>
        </blockquote>

        {/* Body paragraphs matching description style */}
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-[var(--ink)] pr-2 pl-2">
          <p>
            Hey beautiful human 👋 Welcome to <strong>Authors Book.</strong>
          </p>

          <p>
            Books made us a little too aware of how important it is to buy, read and
            have one. So, we thought to fill your shelves with books and minds with
            stories too!
          </p>

          <p>
            We aspire and wish that everyone spends their time with books and sees the
            world through an author&rsquo;s eyes.
          </p>
        </div>

        {/* Action links matching "VIEW BOOK ↗" style */}
        <div className="mt-12 flex flex-col sm:flex-row gap-8 justify-center font-[family-name:var(--sans)]">
          <a
            href="/shop"
            className="inline-flex gap-3 items-center uppercase text-[10px] font-bold tracking-widest pb-1 border-b border-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
          >
            Start Shopping <span>↗</span>
          </a>
          <a
            href="/shop?type=bookmark"
            className="inline-flex gap-3 items-center uppercase text-[10px] font-bold tracking-widest pb-1 border-b border-[var(--ink)]/50 hover:border-[var(--ink)] hover:text-[var(--ink)] transition-all text-[var(--ink-soft)]"
          >
            Browse Bookmarks <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
