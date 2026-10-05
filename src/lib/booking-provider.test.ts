import { describe, expect, it } from "vitest";
import { allowedCheckoutUrl, resolveBookingConfig, stayboostBookingUrl } from "./booking-provider";

describe("booking provider cutover", () => {
  it("keeps Sirvoy as default and requires an explicit valid StayBoost configuration", () => {
    expect(resolveBookingConfig()).toEqual({ provider: "sirvoy" });
    expect(resolveBookingConfig("sirvoy", "unused")).toEqual({ provider: "sirvoy" });
    expect(resolveBookingConfig("stayboost", "anlaggning-c96440")).toEqual({ provider: "stayboost", slug: "anlaggning-c96440" });
    for (const [provider, slug] of [["stayboost", undefined], ["stayboost", "../../other"], ["typo", "example"], ["stayboost", "example?x=1"]]) {
      expect(resolveBookingConfig(provider, slug)).toEqual({ provider: "unavailable" });
    }
  });

  it("uses the fixed StayBoost host and the requested language", () => {
    expect(stayboostBookingUrl("example", "de")).toBe("https://stayboost.se/boka/example?lang=de&embed=goglamping");
    expect(stayboostBookingUrl("example", "en", false)).toBe("https://stayboost.se/boka/example?lang=en");
  });

  it("allows only HTTPS Stripe-hosted checkout redirects without credentials", () => {
    const valid = "https://checkout.stripe.com/c/pay/cs_test_example#fidkd";
    expect(allowedCheckoutUrl(valid)).toBe(valid);
    for (const url of [undefined, {}, "/relative", "javascript:alert(1)", "http://checkout.stripe.com/c/pay/example", "https://checkout.stripe.com.evil.example/pay", "https://checkout.stripe.com@evil.example/pay", "https://user:pass@checkout.stripe.com/pay", "https://checkout.stripe.com:444/pay", "https://stripe.com/pay"]) {
      expect(allowedCheckoutUrl(url)).toBeNull();
    }
  });
});
