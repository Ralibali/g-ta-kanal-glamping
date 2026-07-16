import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Auto-detects browser language on first visit and redirects accordingly.
 * - Swedish browser → stays on /
 * - German browser → redirects to /de
 * - Other non-Swedish → redirects to /en
 * - Respects manual language choice (stored in localStorage)
 * - Only runs on /, /en and /de (not blog, checkin etc.)
 * - Googlebot/crawlers are never redirected (they follow hreflang)
 */
const LanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path !== "/" && path !== "/en" && path !== "/de") return;

    // Respect manual choice
    const choice = localStorage.getItem("lang-choice");
    if (choice) {
      if (choice === "sv" && path !== "/") navigate("/", { replace: true });
      if (choice === "en" && path !== "/en") navigate("/en", { replace: true });
      if (choice === "de" && path !== "/de") navigate("/de", { replace: true });
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("bot") || ua.includes("crawl") || ua.includes("spider") || ua.includes("google")) return;

    const browserLang = (navigator.language || (navigator as any).userLanguage || "sv").toLowerCase();
    const target = browserLang.startsWith("sv") ? "/"
      : browserLang.startsWith("de") ? "/de"
      : "/en";

    if (path !== target) navigate(target, { replace: true });
  }, [location.pathname, navigate]);

  return null;
};

export default LanguageRedirect;
