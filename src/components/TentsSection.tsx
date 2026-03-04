import tentImg1 from "@/assets/glamping-interior-cozy.jpg";
import tentImg2 from "@/assets/glamping-interior-wide.jpg";
import tentImg3 from "@/assets/glamping-interior-beds.jpg";

const tents = [
  {
    name: "Sjöbrisretreatet",
    image: tentImg1,
    description:
      "En oas av komfort och avkoppling. Rymlig dubbelsäng med mjuka kuddar och sänglinne av högsta kvalitet. Erbjuder även en extrabädd.",
  },
  {
    name: "Naturkärnan",
    image: tentImg2,
    description:
      "Ett äventyr väntar er med rymlig dubbelsäng, högkvalitativt sänglinne och en bäddsoffa. Perfekt för familjer.",
  },
  {
    name: "Kanaldrömmen",
    image: tentImg3,
    description:
      "Vårt mysigaste tält med utsikt mot naturen. Husdjur välkomna. Dubbelsäng och extra bäddmöjligheter.",
  },
];

const TentsSection = () => {
  return (
    <section id="talten" className="py-20 md:py-28 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-accent font-sans text-sm tracking-[0.2em] uppercase mb-3 font-semibold">
            Våra tält
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Välj ditt glampingtält
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tents.map((tent) => (
            <div
              key={tent.name}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={tent.image}
                  alt={tent.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-3">{tent.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {tent.description}
                </p>
                <a
                  href="#boka"
                  className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Se pris & boka
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TentsSection;
