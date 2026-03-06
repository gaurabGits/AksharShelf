import React, { useRef } from "react";
import HeroSection from "../components/landing/Hero Section/HeroSections";
import FreeBooksSection from "../components/landing/FreeBooksSection";
import FeaturesSection from "../components/landing/FeatureSections";
import AlgorithmSection from "../components/landing/AlgorithmSection";
import CTASection from "../components/landing/CTASection";

function LandingPage() {
  const freeBooksRef = useRef(null);

  const scrollToFreeBooks = () => {
    if (freeBooksRef.current) {
      freeBooksRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <HeroSection onStartFree={scrollToFreeBooks}/>
      <FeaturesSection />
      <AlgorithmSection />
      <div ref={freeBooksRef}>
        <FreeBooksSection />
      </div>
      <CTASection />
    </>
  );
}

export default LandingPage;