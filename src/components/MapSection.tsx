const MapSection = () => {
  return (
    <section id="kontakt" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
              Hitta hit
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Bergs Slussar, Vreta Kloster
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Vi ligger precis vid Göta kanal i Berg, strax utanför Linköping. Parkering finns på plats
              mot en liten avgift, bara en kort promenad från glampingen.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <p className="font-semibold text-foreground">Adress</p>
                <p className="text-muted-foreground">Bergs Slussar, Vreta Kloster, Linköping</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Kontakt</p>
                <p className="text-muted-foreground">
                  <a href="https://goglampingsweden.se" className="text-accent hover:underline">
                    goglampingsweden.se
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Sociala medier</p>
                <div className="flex gap-4 mt-1">
                  <a href="https://www.instagram.com/bergsslussar.glamping/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                    Instagram
                  </a>
                  <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm">
                    Facebook
                  </a>
                </div>
              </div>
            </div>

            <a
              href="#boka"
              className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Boka ditt tält nu
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2109.8!2d15.5012!3d58.5357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46596f1c5c0b5b5b%3A0x4b5a2d5e5e5e5e5e!2sBergs%20slussar!5e0!3m2!1ssv!2sse!4v1"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Karta till Bergs Slussar Glamping"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
