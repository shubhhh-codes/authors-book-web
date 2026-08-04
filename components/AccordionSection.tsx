'use client';

import { useState } from 'react';
import type { AccordionRow } from '@/lib/types';

// ─── Static data verbatim from templates/index.json collapsible_content_LMGzH3 ─

const ACCORDION_ROWS: AccordionRow[] = [
  {
    heading: 'WHY WE HERE',
    content: `<p><strong>"If you don't like to read, you haven't found the right book yet"</strong></p>
<p>Hey beautiful human, welcome to Authors Book. Books made us a little too aware of how important it is to buy, read and have one. So, we thought to fill your shelves with books and minds with stories too!</p>
<p>We aspire and wish that everyone spends their time with books and see the world through author's eyes.</p>`,
  },
  {
    heading: 'REFUND AND RETURN',
    content: `<p>Thank you for shopping with us. We value our readers and want to ensure a smooth and satisfying experience.</p>
<h3>1. Returns Eligibility</h3>
<ul>
  <li>We accept returns <strong>only if the book is received in a damaged, defective, or incorrect condition</strong>.</li>
  <li>The book must be <strong>unused, unread, and in its original condition</strong> with all packaging intact.</li>
  <li>Returns must be requested <strong>within 3 days of delivery</strong>.</li>
</ul>
<h3>2. Non-Returnable Items</h3>
<p>We <strong>do not accept returns or refunds</strong> for:</p>
<ul>
  <li>Change of mind after purchase</li>
  <li>Minor printing variations or cover design differences</li>
  <li>Discounted or sale items</li>
  <li>Personalized or custom-printed books</li>
</ul>
<h3>3. Damaged or Incorrect Orders</h3>
<p>Please contact us within <strong>48 hours of delivery</strong> with your Order ID, clear photos or a short video of the issue, and an unboxing video (mandatory for damage claims).</p>
<p>Email us at: <strong>authorsbook01@gmail.com</strong></p>
<h3>4. Refund Process</h3>
<ul>
  <li>Refunds will be processed to the <strong>original payment method</strong>.</li>
  <li>Refunds may take <strong>5–7 business days</strong> to reflect.</li>
</ul>
<h3>5. Cancellation Policy</h3>
<ul>
  <li>Orders can be cancelled <strong>only before they are shipped</strong>.</li>
  <li>Once dispatched, the order cannot be cancelled.</li>
</ul>`,
  },
  {
    heading: 'PRIVACY POLICY',
    content: `<h3>1. Information We Collect</h3>
<p>When you visit our website or place an order, we may collect: personal details (name, email, phone, address), payment information (processed securely via Razorpay — we do <strong>not</strong> store card details), order history, and device/browser information.</p>
<h3>2. How We Use Your Information</h3>
<ul>
  <li>Process and fulfill orders</li>
  <li>Communicate order updates and support responses</li>
  <li>Improve our website and user experience</li>
  <li>Send promotional emails (only if you opt in)</li>
  <li>Prevent fraud and ensure secure transactions</li>
</ul>
<h3>3. Sharing Your Information</h3>
<p>We do <strong>not sell, rent, or trade</strong> your personal information. Data may be shared only with payment gateways, shipping partners, and service providers necessary for store operation.</p>
<h3>4. Cookies & Tracking</h3>
<p>We use cookies to remember preferences and analyze site traffic. You can disable cookies via browser settings.</p>
<h3>5. Data Security</h3>
<p>We implement SSL encryption and secure servers. No online transmission is 100% secure.</p>
<h3>6. Contact Us</h3>
<p>Email: <strong>authorsbook01@gmail.com</strong></p>`,
  },
  {
    heading: 'CONTACT US',
    content: `<p>We'd love to hear from you! Whether you have a question about an order, need help choosing a book, or just want to share your love for reading — feel free to reach out.</p>
<ul>
  <li>📧 <strong>Email:</strong> authorsbook01@gmail.com</li>
  <li>📞 <strong>Phone / WhatsApp:</strong> 9265795380</li>
  <li>⏰ <strong>Support Hours:</strong> Monday to Saturday, 10:00 AM – 6:00 PM (IST)</li>
</ul>`,
  },
];

function AccordionItem({
  row,
  isOpen,
  onToggle,
  index,
}: {
  row: AccordionRow;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const panelId = `accordion-panel-${index}`;
  const headingId = `accordion-heading-${index}`;

  return (
    <div className="border-b border-[var(--hairline)] last:border-b-0">
      <h3 id={headingId}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between py-5 px-2 text-left text-base sm:text-lg font-normal text-[var(--ink)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 rounded transition-colors font-[family-name:var(--serif)]"
          id={headingId}
        >
          <span className="flex items-center gap-3">
            {/* check_mark icon — mirrors icon: "check_mark" from schema */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--ink-soft)] flex-shrink-0"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {row.heading}
          </span>

          {/* Chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        className={`accordion-content ${isOpen ? 'open' : ''}`}
      >
        <div
          className="px-2 pb-6 pt-1 text-sm sm:text-base text-[var(--ink)] leading-relaxed prose prose-sm max-w-none font-[family-name:var(--serif)]
            [&_h3]:font-normal [&_h3]:text-[var(--ink)] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:font-[family-name:var(--sans)] [&_h3]:text-[9px] [&_h3]:text-[var(--ink-soft)]
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-3
            [&_li]:text-[var(--ink-soft)]
            [&_strong]:text-[var(--ink)] [&_strong]:font-semibold
            [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: row.content }}
        />
      </div>
    </div>
  );
}

export default function AccordionSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section
      id="contact"
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto font-[family-name:var(--serif)] bg-[var(--paper)]"
      aria-labelledby="accordion-section-heading"
    >
      {/* Section heading — mirrors collapsible-content heading: "Miscellaneous Points" */}
      <div className="text-center mb-12">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--ink-soft)] mb-3 font-[family-name:var(--sans)]">
          Information
        </p>
        <h2
          id="accordion-section-heading"
          className="text-3xl sm:text-4xl font-normal tracking-tight uppercase text-[var(--ink)]"
        >
          Miscellaneous Points
        </h2>
        <div className="w-16 h-px bg-[var(--hairline)] mx-auto mt-6" aria-hidden="true" />
      </div>

      {/* Accordion list */}
      <div
        className="max-w-3xl mx-auto bg-[var(--paper-light)] border border-[var(--hairline)] rounded-2xl px-4 sm:px-8 divide-y-0"
        role="list"
      >
        {ACCORDION_ROWS.map((row, i) => (
          <div key={i} role="listitem">
            <AccordionItem
              row={row}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
              index={i}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
