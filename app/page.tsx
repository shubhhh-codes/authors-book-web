"use client";

import { useState } from "react";
import { ProgressLibrary } from "./ProgressLibrary";
import AboutUs from "@/components/AboutUs";
import AccordionSection from "@/components/AccordionSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [isFocused, setIsFocused] = useState(false);

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
            <AboutUs />
            {/* Full-width section divider between About Us and Miscellaneous Points */}
            <div className="w-full h-px bg-[var(--hairline)]" aria-hidden="true" />
            <AccordionSection />
          </main>

          <Footer />
        </>
      )}
    </div>
  );
}
