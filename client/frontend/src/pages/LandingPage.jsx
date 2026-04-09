import React from "react";
import HeroSection from "../components/landing/Hero Section/HeroSections";
import FreeBooksSection from "../components/landing/FreeBooksSection";
import FeaturesSection from "../components/landing/FeatureSections";
import AlgorithmSection from "../components/landing/UpcomingFeatureSection";
import CTASection from "../components/landing/CTASection";
import { HOME_SECTIONS } from "../utils/homeSections";

function LandingPage() {
  return (
    <>
      <div id={HOME_SECTIONS.hero} className="scroll-mt-24">
        <HeroSection />
      </div>
      <div id={HOME_SECTIONS.features} className="scroll-mt-24">
        <FeaturesSection />
      </div>
      <div id={HOME_SECTIONS.upcoming} className="scroll-mt-24">
        <AlgorithmSection />
      </div>
      <div id={HOME_SECTIONS.freeBooks} className="scroll-mt-24">
        <FreeBooksSection />
      </div>
      <div id={HOME_SECTIONS.cta} className="scroll-mt-24">
        <CTASection />
      </div>
    </>
  );
}

export default LandingPage;
