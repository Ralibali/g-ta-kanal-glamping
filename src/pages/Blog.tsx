import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";

const SITE = "https://goglampingsweden.se";

const Blog = () => {
  useEffect(() => {
    document.title = "Blogg | Bergs Slussar Glamping";

    const setMeta = (selector: string, attr: string, name: string, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", "Inspiration, tips och berättelser från vår glamping vid Göta kanal och Bergs Slussar i Östergötland.");
    setMeta('meta[property="og:title"]', "property", "og:title", "Blogg | Bergs Slussar Glamping");
    setMeta('meta[property="og:description"]', "property", "og:description", "Inspiration, tips och berättelser från vår glamping vid Göta kanal.");
    setMeta('meta[property="og:url"]', "property", "og:url", `${SITE}/blogg`);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", `${SITE}/blogg`);

    const bcId = "blog-breadcrumb-jsonld";
    let bc = document.getElementById(bcId) as HTMLScriptElement | null;
    if (!bc) {
      bc = document.createElement("script");
      bc.type = "application/ld+json";
      bc.id = bcId;
      document.head.appendChild(bc);
    }
    bc.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hem", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blogg", item: `${SITE}/blogg` },
      ],
    });

    return () => {
      bc?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground/80 text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Tillbaka till startsidan
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Bloggen
          </h1>
          <p className="text-primary-foreground/60 text-lg max-w-xl">
            Inspiration, tips och berättelser från vår glamping vid Göta kanal.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="container max-w-4xl py-16 md:py-24">
        <div className="flex flex-col gap-12">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blogg/${post.slug}`}
              className="group"
            >
              <article className="grid md:grid-cols-5 gap-6 md:gap-8">
                <div className="md:col-span-2 aspect-[4/3] rounded-2xl overflow-hidden">
                  <img
                    src={post.heroImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="md:col-span-3 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("sv-SE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.excerpt}
                  </p>
                  <span className="text-accent font-medium text-sm mt-4 group-hover:underline">
                    Läs mer →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-secondary py-16">
        <div className="container max-w-2xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
            Redo att uppleva det själv?
          </h2>
          <p className="text-muted-foreground mb-8">
            Boka din glampingvistelse vid Göta kanal och skapa egna minnen.
          </p>
          <Link
            to="/#boka"
            className="inline-block bg-accent text-accent-foreground px-10 py-4 rounded-full font-semibold hover:scale-105 transition-transform shadow-md"
          >
            Boka nu →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
