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

const Index = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <AboutSection />
        <TentsSection />
        <TestimonialSection />
        <BookingSection />
        <GallerySection />
        <ActivitiesSection />
        <CTASection />
        <FAQSection />
        <ManageBookingSection />
        <MapSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
