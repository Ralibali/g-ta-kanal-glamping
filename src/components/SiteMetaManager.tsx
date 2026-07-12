import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { blogPosts } from "@/data/blogPosts";

const SITE_URL = "https://goglampingsweden.se";

const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/stad",
  "/cleaning",
  "/jobb",
  "/frukost",
  "/breakfast",
  "/stay/",
  "/checkin",
  "/checka-in",
  "/chat",
  "/unsubscribe",
  "/under-vistelsen",
  "/during-your-stay",
  "/s/",
];

type Meta = { title: string; description: string; ogType?: string };

const ROUTE_META: Record<string, Meta> = {
  "/": {
    title: "Go Glamping Sweden – glamping vid Göta kanal & Bergs slussar",
    description:
      "Ombonade glampingtält med bäddade sängar, värme och el vid Bergs slussar och Göta kanal. Boka direkt – bekräftelse på minuten, 15 minuter från Linköping.",
    ogType: "website",
  },
  "/en": {
    title: "Go Glamping Sweden – glamping by the Göta Canal",
    description:
      "Cosy glamping tents with made-up beds, heating and electricity by Bergs Locks and the Göta Canal. Instant booking, 15 minutes from Linköping.",
    ogType: "website",
  },
  "/boka": {
    title: "Boka glamping vid Göta kanal | Go Glamping Sweden",
    description:
      "Boka ett ombonat glampingtält vid Bergs slussar och Göta kanal. Direktbekräftelse, bäddade sängar, värme och el – från 1 595 kr/natt.",
    ogType: "website",
  },
  "/en/boka": {
    title: "Book glamping by the Göta Canal | Go Glamping Sweden",
    description:
      "Book a cosy glamping tent by Bergs Locks and the Göta Canal. Instant confirmation, made-up beds, heating and electricity – from 1,595 SEK / night.",
    ogType: "website",
  },
  "/en/book": {
    title: "Book glamping by the Göta Canal | Go Glamping Sweden",
    description:
      "Book a cosy glamping tent by Bergs Locks and the Göta Canal. Instant confirmation, made-up beds, heating and electricity – from 1,595 SEK / night.",
    ogType: "website",
  },
  "/blogg": {
    title: "Glampingbloggen – tips om Göta kanal & Bergs slussar",
    description:
      "Guider och tips om glamping vid Göta kanal, Bergs slussar och Östergötland. Läs om utflykter, säsonger och hur du planerar din vistelse.",
    ogType: "website",
  },
  "/glamping-linkoping": {
    title: "Glamping Linköping – ombonade tält 15 min från staden",
    description:
      "Glamping bara 15 minuter från Linköping. Bäddade tält vid Bergs slussar och Göta kanal – perfekt för en weekend nära naturen.",
  },
  "/glamping-gota-kanal": {
    title: "Glamping vid Göta kanal – bo mitt vid vattnet",
    description:
      "Glampa mitt vid Göta kanal och Bergs slussar. Ombonade tält med värme, el och bäddade sängar. Direktbokning.",
  },
  "/glamping-ostergotland": {
    title: "Glamping i Östergötland – Bergs slussar & Göta kanal",
    description:
      "Upptäck glamping i Östergötland vid Bergs slussar och Göta kanal. Ombonade tält, bäddade sängar och lugn natur – bara 15 minuter från Linköping.",
  },
  "/boende-bergs-slussar": {
    title: "Boende Bergs slussar – glamping vid Göta kanal",
    description:
      "Boende vid Bergs slussar med bäddade sängar, värme och el. Glampa mitt vid Göta kanal – 15 minuter från Linköping.",
  },
  "/overnattning-bergs-slussar": {
    title: "Övernattning Bergs slussar – ombonad glamping",
    description:
      "Övernattning vid Bergs slussar i ombonade glampingtält. Bäddade sängar, värme och el – direktbekräftelse och lugn miljö vid Göta kanal.",
  },
  "/boende-gota-kanal": {
    title: "Boende Göta kanal – glamping vid Bergs slussar",
    description:
      "Boende vid Göta kanal i ombonade glampingtält. Bäddade sängar, värme och el – 15 minuter från Linköping.",
  },
  "/glamping-vreta-kloster": {
    title: "Glamping Vreta kloster – nära Bergs slussar",
    description:
      "Glamping nära Vreta kloster och Bergs slussar. Ombonade tält vid Göta kanal med bäddade sängar och lugn natur.",
  },
  "/romantisk-weekend-ostergotland": {
    title: "Romantisk weekend i Östergötland – glamping vid Göta kanal",
    description:
      "Planera en romantisk weekend i Östergötland med glamping vid Göta kanal. Bäddade tält, egen uteplats och lugn natur nära Linköping.",
  },
  "/bokningsvillkor": {
    title: "Bokningsvillkor | Go Glamping Sweden",
    description: "Läs våra bokningsvillkor för glamping vid Bergs slussar och Göta kanal.",
  },
};

const PRIVATE_TITLES: Record<string, string> = {
  "/stad": "Personalportal | Go Glamping Sweden",
  "/cleaning": "Personalportal | Go Glamping Sweden",
  "/jobb": "Personalportal | Go Glamping Sweden",
  "/frukost": "Frukosthantering | Go Glamping Sweden",
  "/breakfast": "Frukosthantering | Go Glamping Sweden",
  "/checkin": "Incheckning | Go Glamping Sweden",
  "/checka-in": "Incheckning | Go Glamping Sweden",
};

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = href;
}

function addAlternate(hreflang: string, href: string) {
  const link = document.createElement("link");
  link.rel = "alternate";
  link.hreflang = hreflang;
  link.href = href;
  link.dataset.routeHreflang = "true";
  document.head.appendChild(link);
}

function setJsonLd(id: string, payload: object | null) {
  const existing = document.head.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`);
  if (!payload) { existing?.remove(); return; }
  const script = existing ?? document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.jsonld = id;
  script.text = JSON.stringify(payload);
  if (!existing) document.head.appendChild(script);
}

function normalizedPath(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const LANDING_ROUTES = new Set([
  "/glamping-linkoping",
  "/glamping-gota-kanal",
  "/glamping-ostergotland",
  "/boende-bergs-slussar",
  "/overnattning-bergs-slussar",
  "/boende-gota-kanal",
  "/glamping-vreta-kloster",
  "/romantisk-weekend-ostergotland",
]);

export default function SiteMetaManager() {
  const { pathname } = useLocation();
  const params = useParams();

  useEffect(() => {
    const path = normalizedPath(pathname);
    const isPrivate = PRIVATE_ROUTE_PREFIXES.some((prefix) =>
      prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`),
    );
    const isEnglish = path === "/en" || path.startsWith("/en/");
    document.documentElement.lang = isEnglish ? "en" : "sv";

    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      isPrivate
        ? "noindex, nofollow, noarchive, nosnippet"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    setMeta(
      'meta[name="googlebot"]',
      "name",
      "googlebot",
      isPrivate
        ? "noindex, nofollow, noarchive, nosnippet"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );

    const canonical = `${SITE_URL}${path}`;
    setCanonical(canonical);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Go Glamping Sweden");
    setMeta('meta[property="og:locale"]', "property", "og:locale", isEnglish ? "en_GB" : "sv_SE");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    // Clear per-route hreflang and JSON-LD before setting fresh ones.
    document.head
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
      .forEach((element) => element.remove());
    ["route-primary", "route-breadcrumb", "route-article"].forEach((id) => setJsonLd(id, null));

    // Per-route title, description, og
    if (isPrivate) {
      const exactTitle = PRIVATE_TITLES[path] ?? "Intern sida | Go Glamping Sweden";
      document.title = exactTitle;
      setMeta('meta[property="og:title"]', "property", "og:title", exactTitle);
    } else {
      let meta = ROUTE_META[path];
      let breadcrumb: { name: string; url: string }[] | null = null;

      // Blog post pages
      if (!meta && path.startsWith("/blogg/") && params?.slug) {
        const post = blogPosts.find((p) => p.slug === params.slug);
        if (post) {
          meta = {
            title: `${post.title} | Go Glamping Sweden`,
            description: post.excerpt,
            ogType: "article",
          };
          breadcrumb = [
            { name: "Hem", url: `${SITE_URL}/` },
            { name: "Bloggen", url: `${SITE_URL}/blogg` },
            { name: post.title, url: canonical },
          ];
          setJsonLd("route-article", {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: (post as any).date ?? undefined,
            author: { "@type": "Organization", name: "Go Glamping Sweden" },
            publisher: {
              "@type": "Organization",
              name: "Go Glamping Sweden",
              url: SITE_URL,
            },
            mainEntityOfPage: canonical,
          });
        }
      }

      if (!meta) {
        meta = {
          title: "Go Glamping Sweden – glamping vid Göta kanal & Bergs slussar",
          description:
            "Ombonade glampingtält med bäddade sängar, värme och el vid Bergs slussar och Göta kanal.",
          ogType: "website",
        };
      }

      document.title = meta.title;
      setMeta('meta[name="description"]', "name", "description", meta.description);
      setMeta('meta[property="og:title"]', "property", "og:title", meta.title);
      setMeta('meta[property="og:description"]', "property", "og:description", meta.description);
      setMeta('meta[property="og:type"]', "property", "og:type", meta.ogType ?? "website");
      setMeta('meta[name="twitter:title"]', "name", "twitter:title", meta.title);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.description);

      // Homepage: LodgingBusiness
      if (path === "/" || path === "/en") {
        setJsonLd("route-primary", {
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: "Go Glamping Sweden",
          url: SITE_URL,
          telephone: "+46722254993",
          email: "info@auroramedia.se",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Berg",
            addressRegion: "Östergötland",
            addressCountry: "SE",
          },
          priceRange: "1595 SEK+",
          amenityFeature: [
            { "@type": "LocationFeatureSpecification", name: "Uppvärmda tält", value: true },
            { "@type": "LocationFeatureSpecification", name: "Bäddade sängar", value: true },
            { "@type": "LocationFeatureSpecification", name: "El i tält", value: true },
            { "@type": "LocationFeatureSpecification", name: "Frukost tillgänglig", value: true },
          ],
        });
      }

      // Landing pages: BreadcrumbList
      if (LANDING_ROUTES.has(path)) {
        breadcrumb = [
          { name: "Hem", url: `${SITE_URL}/` },
          { name: meta.title.split(" | ")[0].split(" – ")[0], url: canonical },
        ];
      }

      if (breadcrumb) {
        setJsonLd("route-breadcrumb", {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumb.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        });
      }
    }

    // hreflang for bilingual pages
    if (path === "/" || path === "/en") {
      addAlternate("sv", `${SITE_URL}/`);
      addAlternate("en", `${SITE_URL}/en`);
      addAlternate("x-default", `${SITE_URL}/`);
    } else if (path === "/boka" || path === "/en/boka" || path === "/en/book") {
      addAlternate("sv", `${SITE_URL}/boka`);
      addAlternate("en", `${SITE_URL}/en/boka`);
      addAlternate("x-default", `${SITE_URL}/boka`);
    }
  }, [pathname, params?.slug]);

  return null;
}
