export default function AboutUs() {
  return (
    <section
      id="about"
      className="w-full py-16 sm:py-24 bg-[var(--paper)] text-[var(--ink)] relative"
      aria-labelledby="about-heading"
    >
      <div className="w-full h-px bg-[var(--hairline)] absolute top-0 left-0" aria-hidden="true" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center font-[family-name:var(--serif)]">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-3 font-[family-name:var(--sans)]">
          Our Mission
        </p>

        <h2
          id="about-heading"
          className="text-4xl sm:text-5xl font-normal tracking-tight mb-8 text-[var(--ink)]"
        >
          About Us
        </h2>

        <div className="w-16 h-px bg-[var(--hairline)] mx-auto mb-10" aria-hidden="true" />

        <blockquote className="italic text-lg sm:text-xl text-[var(--ink)] border-l border-[var(--ink)] pl-6 text-left max-w-xl mx-auto my-10 leading-relaxed">
          &ldquo;If you don&rsquo;t like to read, you haven&rsquo;t found the right book yet&rdquo;
          <cite className="block not-italic text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mt-3 font-[family-name:var(--sans)]">
            manifesto
          </cite>
        </blockquote>

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
      </div>
    </section>
  );
}
