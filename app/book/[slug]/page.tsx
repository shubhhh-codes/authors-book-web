"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProgressLibrary } from "../../ProgressLibrary";
import AboutUs from "@/components/AboutUs";
import AccordionSection from "@/components/AccordionSection";
import Footer from "@/components/Footer";

export default function BookSlugPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug =
    typeof rawSlug === "string"
      ? rawSlug
      : Array.isArray(rawSlug)
      ? rawSlug[0]
      : "";
  const [isFocused, setIsFocused] = useState(true);

  return (
    <div
      className={`relative bg-[var(--paper)] ${
        isFocused ? "h-[100dvh] overflow-hidden" : "min-h-screen overflow-y-auto"
      }`}
    >
      {/* 3D bookshelf section initialized with the book slug */}
      <div className="w-full h-[100dvh]">
        <ProgressLibrary initialSlug={slug} onFocusChange={setIsFocused} />
      </div>

      {/* Main page content sections appearing below the shelf only when browsing */}
      {!isFocused && (
        <>
          <main id="main-content" className="relative z-30 bg-[var(--paper)]">
            <AboutUs />
            <AccordionSection />
          </main>

          <Footer />
        </>
      )}
    </div>
  );
}
