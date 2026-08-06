'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import SearchModal from '@/components/SearchModal';
import CartDrawer from '@/components/CartDrawer';

export default function Navigation({ showAnnouncement = true }: { showAnnouncement?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('ab_cart') || localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 1), 0));
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cart-updated', updateCartCount);
    return () => window.removeEventListener('cart-updated', updateCartCount);
  }, []);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Books', href: '/shop?type=book' },
    { label: 'Bookmarks', href: '/shop?type=bookmark' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      {showAnnouncement && <AnnouncementBar />}

      {/* Primary Sticky Header */}
      <nav
        id="site-nav"
        className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'border-b border-gray-200'
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold tracking-tight text-black hover:text-gray-700 transition-colors"
            aria-label="Authors Book – Home"
          >
            authorsbook
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-8 list-none" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-black transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="text-gray-600 hover:text-black transition-colors p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Cart Icon Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Cart – ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
              className="relative text-gray-600 hover:text-black transition-colors p-1"
              id="cart-icon-bubble"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="md:hidden p-1 text-gray-600 hover:text-black transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div
          id="mobile-menu"
          aria-hidden={!menuOpen}
          className={`md:hidden overflow-hidden transition-all duration-300 border-t border-gray-100 bg-white ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="flex flex-col px-4 py-4 gap-1 list-none" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 px-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Interactive Overlays */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
