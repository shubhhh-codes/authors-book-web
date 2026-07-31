// Maps rich-text section from templates/index.json
// heading: "ABOUT US" / text: brand manifesto
// settings: desktop_content_position: "center", content_alignment: "center", full_width: true

export default function AboutUs() {
  return (
    <section
      id="about"
      className="w-full py-16 sm:py-20 bg-[#111111] text-white"
      aria-labelledby="about-heading"
    >
      {/* page-width inner wrapper, content centred */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Heading block (block.type: "heading", heading_size: "h1") */}
        <h2
          id="about-heading"
          className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-8"
        >
          About Us
        </h2>

        {/* Decorative rule */}
        <div className="w-16 h-1 bg-white mx-auto mb-8 rounded-full opacity-40" aria-hidden="true" />

        {/* Text block (block.type: "text") — content verbatim from index.json */}
        <div className="space-y-6 text-base sm:text-lg leading-relaxed font-medium text-white/90">
          <blockquote className="italic text-white/75 border-l-4 border-white/30 pl-4 text-left sm:text-center sm:border-l-0 sm:pl-0">
            &ldquo;If you don&rsquo;t like to read, you haven&rsquo;t found the right book yet&rdquo;
          </blockquote>

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

        {/* CTA — mirrors button block from rich-text */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/shop"
            className="inline-block bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Start Shopping
          </a>
          <a
            href="/shop?type=bookmark"
            className="inline-block border border-white/50 text-white font-semibold px-8 py-3 rounded-full hover:border-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Browse Bookmarks
          </a>
        </div>
      </div>
    </section>
  );
}
