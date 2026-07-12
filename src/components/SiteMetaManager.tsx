import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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

const PRIVATE_TITLES: Record<string, string> = {
  "/stad": "Personalportal | Bergs Slussar Glamping",
  "/cleaning": "Personalportal | Bergs Slussar Glamping",
  "/jobb": "Personalportal | Bergs Slussar Glamping",
  "/frukost": "Frukosthantering | Bergs Slussar Glamping",
  "/breakfast": "Frukosthantering | Bergs Slussar Glamping",
  "/checkin": "Incheckning | Bergs Slussar Glamping",
  "/checka-in": "Incheckning | Bergs Slussar Glamping",
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

function normalizedPath(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export default function SiteMetaManager() {
  const { pathname } = useLocation();

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

    if (isPrivate) {
      const exactTitle = PRIVATE_TITLES[path];
      document.title = exactTitle ?? "Intern sida | Bergs Slussar Glamping";
    }

    document.head
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
      .forEach((element) => element.remove());

    if (path === "/" || path === "/en") {
      addAlternate("sv", `${SITE_URL}/`);
      addAlternate("en", `${SITE_URL}/en`);
      addAlternate("x-default", `${SITE_URL}/`);
    } else if (path === "/boka" || path === "/en/boka" || path === "/en/book") {
      addAlternate("sv", `${SITE_URL}/boka`);
      addAlternate("en", `${SITE_URL}/en/boka`);
      addAlternate("x-default", `${SITE_URL}/boka`);
    }
  }, [pathname]);

  return null;
}
