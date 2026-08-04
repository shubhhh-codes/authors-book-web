import { ProgressLibrary } from "./ProgressLibrary";
import AboutUs from "@/components/AboutUs";
import AccordionSection from "@/components/AccordionSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--paper)] overflow-y-auto">
      {/* 3D bookshelf section takes full screen height */}
      <div className="w-full h-[100dvh]">
        <ProgressLibrary />
      </div>

      {/* Main page content sections appearing below the shelf */}
      <main id="main-content" className="relative z-30 bg-[var(--paper)]">
        <AboutUs />
        <AccordionSection />
      </main>

      <Footer />
    </div>
  );
}
