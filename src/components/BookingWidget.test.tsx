import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import BookingWidget from "./BookingWidget";
import BookingSection from "./BookingSection";
import ManageBookingSection from "./ManageBookingSection";

const config = vi.hoisted(() => ({ provider: "stayboost", slug: "example" }));
vi.mock("@/lib/booking-provider", async (original) => ({
  ...await original<typeof import("@/lib/booking-provider")>(), bookingConfig: config,
}));
vi.mock("./SirvoyBookingWidget", () => ({ default: () => <div>Existing Sirvoy booking</div> }));

beforeEach(() => { config.provider = "stayboost"; vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Öppna bokningsformuläret" }));
  return document.querySelector("iframe")!;
}

function send(iframe: HTMLIFrameElement, data: unknown, origin = "https://stayboost.se", source: MessageEventSource | null = iframe.contentWindow) {
  act(() => window.dispatchEvent(new MessageEvent("message", { origin, source, data })));
}

describe("StayBoost website integration", () => {
  it("waits for the visitor before contacting StayBoost and removes every homepage Sirvoy embed", () => {
    const { container } = render(<><BookingSection /><ManageBookingSection /></>);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector('script[src*="sirvoy"]')).toBeNull();
    expect(screen.queryByRole("button", { name: "Visa tillgänglighet" })).not.toBeInTheDocument();
    expect(screen.getByText(/Öppna gästlänken/)).toBeInTheDocument();
    openForm();
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("requires readiness from the exact StayBoost origin and the active frame", () => {
    render(<BookingWidget />);
    const iframe = openForm();
    fireEvent.load(iframe);
    send(iframe, { type: "stayboost:ready" }, "https://stayboost.se.evil.example");
    send(iframe, { type: "stayboost:ready" }, "https://stayboost.se", window);
    send(iframe, null);
    expect(screen.getByText("Laddar bokningen…")).toBeInTheDocument();
    send(iframe, { type: "stayboost:ready" });
    expect(screen.queryByText("Laddar bokningen…")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(20001));
    expect(screen.queryByText(/Bokningen är tillfälligt otillgänglig/)).not.toBeInTheDocument();
  });

  it("shows paused or failed booking as unavailable without reopening Sirvoy inventory", () => {
    const { container } = render(<BookingWidget />);
    const iframe = openForm();
    send(iframe, { type: "stayboost:error" });
    expect(screen.getByRole("link", { name: "info@auroramedia.se" })).toBeInTheDocument();
    expect(iframe).not.toBeVisible();
    expect(container.querySelector('script[src*="sirvoy"]')).toBeNull();
    expect(screen.queryByText("Existing Sirvoy booking")).not.toBeInTheDocument();
  });

  it("recovers after timeout and ignores messages from a discarded frame", () => {
    render(<BookingWidget />);
    const oldFrame = openForm();
    const oldSource = oldFrame.contentWindow;
    act(() => vi.advanceTimersByTime(20001));
    fireEvent.click(screen.getByRole("button", { name: "Försök igen" }));
    const newFrame = document.querySelector("iframe")!;
    expect(newFrame).not.toBe(oldFrame);
    send(newFrame, { type: "stayboost:ready" }, "https://stayboost.se", oldSource);
    expect(screen.getByText("Laddar bokningen…")).toBeInTheDocument();
    send(newFrame, { type: "stayboost:ready" });
    expect(screen.queryByText("Laddar bokningen…")).not.toBeInTheDocument();
  });

  it("passes the site's language to the booking form and separate-window link", () => {
    render(<LanguageProvider value="de"><BookingWidget /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buchungsformular öffnen" }));
    expect(screen.getByTitle("Bergs Slussar Glamping buchen")).toHaveAttribute("src", "https://stayboost.se/boka/example?lang=de&embed=goglamping");
    expect(screen.getByRole("link", { name: "Buchung in einem eigenen Fenster öffnen" })).toHaveAttribute("href", "https://stayboost.se/boka/example?lang=de");
  });

  it("redirects only trusted checkout messages to the approved Stripe host", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    render(<BookingWidget />);
    const iframe = openForm();
    const url = "https://checkout.stripe.com/c/pay/cs_test_example";
    send(iframe, { type: "stayboost:checkout", url }, "https://evil.example");
    send(iframe, { type: "stayboost:checkout", url }, "https://stayboost.se", window);
    send(iframe, { type: "stayboost:checkout", url: "https://evil.example" });
    expect(assign).not.toHaveBeenCalled();
    send(iframe, { type: "stayboost:checkout", url });
    expect(assign).toHaveBeenCalledExactlyOnceWith(url);
  });

  it("keeps the existing provider as default and fails closed on invalid settings", () => {
    config.provider = "sirvoy";
    const { rerender } = render(<BookingWidget />);
    expect(screen.getByText("Existing Sirvoy booking")).toBeInTheDocument();
    config.provider = "unavailable";
    rerender(<BookingWidget />);
    expect(screen.queryByText("Existing Sirvoy booking")).not.toBeInTheDocument();
    expect(screen.getByText(/Bokningen är tillfälligt otillgänglig/)).toBeInTheDocument();
  });
});
