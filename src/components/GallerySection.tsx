import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { useLang } from "@/i18n/LanguageContext";
import img1 from "@/assets/glamping-interior-cozy.jpg";
import img2 from "@/assets/glamping-exterior-deck.jpg";
import img3 from "@/assets/glamping-night-lights.jpg";
import img4 from "@/assets/glamping-view-field.jpg";
import img5 from "@/assets/glamping-person-deck.jpg";
import img6 from "@/assets/glamping-reading.jpg";
import img7 from "@/assets/glamping-nature-kids.jpg";
import img8 from "@/assets/glamping-interior-beds.jpg";

const images = [
  { src: img1, alt: "Cosy glamping interior at Bergs Slussar", span: "col-span-1 row-span-2" },
  { src: img2, alt: "Glamping tent with deck by Göta Canal", span: "col-span-1 row-span-1" },
  { src: img3, alt: "Evening lighting glamping Bergs Slussar", span: "col-span-1 row-span-1" },
  { src: img4, alt: "Nature view from glamping near Linköping", span: "col-span-2 row-span-1" },
  { src: img5, alt: "Guest enjoying glamping by Göta Canal Sweden", span: "col-span-1 row-span-1" },
  { src: img6, alt: "Relaxation in glamping tent Bergs Slussar", span: "col-span-1 row-span-1" },
  { src: img7, alt: "Children in nature camping Göta Canal", span: "col-span-1 row-span-1" },
  { src: img8, alt: "Comfortable beds glamping Sweden", span: "col-span-1 row-span-2" },
];

const GallerySection = () => {
  const lang = useLang();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <section id="galleri" className="py-24 md:py-32" style={{ background: "var(--section-gradient)" }}>
      <div className="container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
              {lang === "en" ? "Gallery" : "Galleri"}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {lang === "en" ? "Pictures say more than words" : "Bilder säger mer än ord"}
            </h2>
          </div>
        </ScrollReveal>

        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <button onClick={() => setLightboxIdx(i)} className="block w-full overflow-hidden rounded-2xl break-inside-avoid group cursor-pointer relative">
                <img src={img.src} alt={img.alt} className="w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 rounded-2xl" />
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-6 right-6 text-primary-foreground/80 hover:text-primary-foreground text-3xl font-light transition-colors" onClick={() => setLightboxIdx(null)}>✕</button>
          <img src={images[lightboxIdx].src} alt={images[lightboxIdx].alt} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          {lightboxIdx > 0 && (
            <button className="absolute left-4 md:left-8 text-primary-foreground/60 hover:text-primary-foreground text-5xl transition-colors" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>‹</button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button className="absolute right-4 md:right-8 text-primary-foreground/60 hover:text-primary-foreground text-5xl transition-colors" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>›</button>
          )}
        </div>
      )}
    </section>
  );
};

export default GallerySection;
