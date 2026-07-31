import Link from 'next/link';

export default function AnnouncementBar() {
  return (
    <div className="bg-[#111111] text-white text-xs font-medium py-2 px-4 border-b border-gray-800">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="tracking-wide">
          ✨ <strong>Special Offer:</strong> Free shipping on orders above ₹500 across India!
        </p>

        <div className="flex items-center gap-4 text-gray-300">
          <a
            href="mailto:authorsbook01@gmail.com"
            className="hover:text-white transition-colors"
          >
            authorsbook01@gmail.com
          </a>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <a
            href="tel:+919265795380"
            className="hidden sm:inline hover:text-white transition-colors"
          >
            +91 9265795380
          </a>
        </div>
      </div>
    </div>
  );
}
