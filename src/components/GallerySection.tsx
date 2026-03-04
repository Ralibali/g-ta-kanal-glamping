import { useState } from "react";
import img1 from "@/assets/glamping-interior-cozy.jpg";
import img2 from "@/assets/glamping-exterior-deck.jpg";
import img3 from "@/assets/glamping-night-lights.jpg";
import img4 from "@/assets/glamping-view-field.jpg";
import img5 from "@/assets/glamping-person-deck.jpg";
import img6 from "@/assets/glamping-reading.jpg";
import img7 from "@/assets/glamping-nature-kids.jpg";
import img8 from "@/assets/glamping-interior-beds.jpg";

const images = [
  { src: img1, alt: "Mysig inredning i glampingtält" },
  { src: img2, alt: "Utemöbler på altanen" },
  { src: img3, alt: "Kvällsbelysning i tältet" },
  { src: img4, alt: "Utsikt över fälten" },
  { src: img5, alt: "Gäst på altanen" },
  { src: img6, alt: "Läsa i tältet" },
  { src: img7, alt: "Barn i naturen vid Göta kanal" },
  { src: img8, alt: "Sängar i glampingtält" },
];

const GallerySection = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <section id="galleri" className="py-20 md:py-28" style={{ background: "var(--section-gradient)" }}>
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
            Galleri
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Bilder från vår glamping
          </h2>
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="block w-full overflow-hidden rounded-xl break-inside-avoid group cursor-pointer"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-6 right-6 text-primary-foreground text-3xl font-light"
            onClick={() => setLightboxIdx(null)}
          >
            ✕
          </button>
          <img
            src={images[lightboxIdx].src}
            alt={images[lightboxIdx].alt}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 md:left-8 text-primary-foreground text-4xl"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button
              className="absolute right-4 md:right-8 text-primary-foreground text-4xl"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default GallerySection;
