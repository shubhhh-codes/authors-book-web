"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProgressLibrary } from "./ProgressLibrary";
import EditorialShowcase from "@/components/EditorialShowcase";
import AboutUs from "@/components/AboutUs";
import AccordionSection from "@/components/AccordionSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

interface ShelfPageProps {
  initialSlug?: string;
}

export default function ShelfPage({ initialSlug: propSlug }: ShelfPageProps = {}) {
  const pathname = usePathname();
  const initialSlug = propSlug ?? (pathname?.startsWith("/book/") ? pathname.replace("/book/", "") : undefined);
  const [isFocused, setIsFocused] = useState(Boolean(initialSlug));
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (isFocused) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFocused]);

  return (
    <div
      className={`relative bg-[var(--paper)] min-h-screen ${
        isFocused ? "h-[100dvh] overflow-hidden" : ""
      }`}
    >
      {/* 3D bookshelf — full viewport height */}
      <div className="w-full h-[100dvh]">
        <ProgressLibrary initialSlug={initialSlug} onFocusChange={setIsFocused} />
      </div>

      {/*
        Keep the lower page sections permanently in the DOM with CSS visiblity
        toggling instead of conditional mounting.  This prevents React from
        unmounting EditorialShowcase (and its fetched/decoded images) every time
        a book is opened, eliminating the table-image reload flicker on return.
      */}
      <div className={`transition-opacity duration-300 ${isFocused ? "opacity-0 pointer-events-none invisible" : "opacity-100 pointer-events-auto visible"}`}>
        <main id="main-content" className="relative z-30 bg-[var(--paper)]">
          <EditorialShowcase onOpenCart={() => setIsCartOpen(true)} />
          <div className="w-full h-px bg-[var(--hairline)]" aria-hidden="true" />
          <AboutUs />
          <div className="w-full h-px bg-[var(--hairline)]" aria-hidden="true" />
          <AccordionSection />
        </main>
        <Footer />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </div>
  );
}
