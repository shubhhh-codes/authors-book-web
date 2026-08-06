"use client";

import { useState } from "react";
import { ProgressLibrary } from "./ProgressLibrary";
import EditorialShowcase from "@/components/EditorialShowcase";
import AboutUs from "@/components/AboutUs";
import AccordionSection from "@/components/AccordionSection";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export default function Home() {
  const [isFocused, setIsFocused] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div
      className={`relative bg-[var(--paper)] ${
        isFocused ? "h-[100dvh] overflow-hidden" : "min-h-screen overflow-y-auto"
      }`}
    >
      {/* 3D bookshelf section takes full screen height */}
      <div className="w-full h-[100dvh]">
        <ProgressLibrary onFocusChange={setIsFocused} />
      </div>

      {/* Main page content sections appearing below the shelf only when browsing */}
      {!isFocused && (
        <>
          <main id="main-content" className="relative z-30 bg-[var(--paper)]">
            <EditorialShowcase onOpenCart={() => setIsCartOpen(true)} />
            <div className="w-full h-px bg-[var(--hairline)]" aria-hidden="true" />
            <AboutUs />
            {/* Full-width section divider between About Us and Miscellaneous Points */}
            <div className="w-full h-px bg-[var(--hairline)]" aria-hidden="true" />
            <AccordionSection />
          </main>

          <Footer />
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
      )}
    </div>
  );
}
