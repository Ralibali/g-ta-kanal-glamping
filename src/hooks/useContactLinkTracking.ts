import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Global listener for contact-intent clicks (tel:, mailto:, sms:) and
 * outgoing links to known external booking providers (e.g. Sirvoy hosted
 * booking pages). Uses only low-cardinality props — never a destination
 * that contains a user identifier.
 */
export function useContactLinkTracking() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      if (href.startsWith("tel:")) {
        trackEvent("Contact Click", { product_category: "contact", source: "tel" });
        return;
      }
      if (href.startsWith("mailto:")) {
        trackEvent("Contact Click", { product_category: "contact", source: "mailto" });
        return;
      }
      if (href.startsWith("sms:")) {
        trackEvent("Contact Click", { product_category: "contact", source: "sms" });
        return;
      }

      // Outgoing booking clicks — only track the click, never a completion.
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) return;
        const host = url.hostname.toLowerCase();
        if (host.endsWith("sirvoy.com") || host.endsWith("secured.sirvoy.com")) {
          trackEvent("Booking Started", {
            product_category: "booking",
            source: "outbound_sirvoy",
          });
        }
      } catch {
        /* ignore malformed hrefs */
      }
    };

    document.addEventListener("click", handler, { capture: true, passive: true });
    return () => document.removeEventListener("click", handler, true);
  }, []);
}
