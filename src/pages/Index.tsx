import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import TentsSection from "@/components/TentsSection";
import BookingSection from "@/components/BookingSection";
import GallerySection from "@/components/GallerySection";
import ActivitiesSection from "@/components/ActivitiesSection";
import FAQSection from "@/components/FAQSection";
import MapSection from "@/components/MapSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <TentsSection />
        <BookingSection />
        <GallerySection />
        <ActivitiesSection />
        <FAQSection />
        <MapSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
