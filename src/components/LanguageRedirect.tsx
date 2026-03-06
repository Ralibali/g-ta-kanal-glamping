import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Auto-detects browser language on first visit and redirects accordingly.
 * - Swedish browser → stays on /
 * - Non-Swedish browser → redirects to /en
 * - Respects manual language choice (stored in localStorage)
 * - Only runs on / and /en (not blog, checkin etc.)
 * - Googlebot/crawlers are never redirected (they follow hreflang)
 */
const LanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only auto-detect on the two main pages
    if (location.pathname !== "/" && location.pathname !== "/en") return;

    // If user has manually chosen a language, respect that
    if (localStorage.getItem("lang-choice")) return;

    // Don't redirect bots/crawlers — let hreflang handle it
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("bot") || ua.includes("crawl") || ua.includes("spider") || ua.includes("google")) return;

    const browserLang = navigator.language || (navigator as any).userLanguage || "sv";
    const isSwedish = browserLang.startsWith("sv");

    if (isSwedish && location.pathname === "/en") {
      navigate("/", { replace: true });
    } else if (!isSwedish && location.pathname === "/") {
      navigate("/en", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

export default LanguageRedirect;
