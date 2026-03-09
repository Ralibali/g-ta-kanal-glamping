import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import AboutSection from "@/components/AboutSection";
import TentsSection from "@/components/TentsSection";
import TestimonialSection from "@/components/TestimonialSection";
import BookingSection from "@/components/BookingSection";
import GallerySection from "@/components/GallerySection";
import ActivitiesSection from "@/components/ActivitiesSection";
import CTASection from "@/components/CTASection";
import FAQSection from "@/components/FAQSection";
import ManageBookingSection from "@/components/ManageBookingSection";
import MapSection from "@/components/MapSection";
import Footer from "@/components/Footer";
import MobileBookingBar from "@/components/MobileBookingBar";
import { LanguageProvider, type Lang } from "@/i18n/LanguageContext";

interface IndexProps {
  lang?: Lang;
}

const Index = ({ lang = "sv" }: IndexProps) => {
  return (
    <LanguageProvider value={lang}>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <AboutSection />
        <TentsSection />
        <GallerySection />
        <ActivitiesSection />
        <TestimonialSection />
        <BookingSection />
        <CTASection />
        <FAQSection />
        <ManageBookingSection />
        <MapSection />
      </main>
      <MobileBookingBar />
      <Footer />
    </LanguageProvider>
  );
};

export default Index;
