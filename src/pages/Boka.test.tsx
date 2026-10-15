import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Boka from "./Boka";

const config = vi.hoisted(() => ({ provider: "sirvoy", slug: "example" }));
vi.mock("@/lib/booking-provider", async (original) => ({
  ...await original<typeof import("@/lib/booking-provider")>(), bookingConfig: config,
}));
vi.mock("@/components/BookingWidget", () => ({ default: () => <div>Booking form</div> }));

afterEach(cleanup);

const cases = [
  {
    lang: "sv" as const,
    question: "Kan vi lägga till frukost?",
    sirvoyAnswer: "Ja, frukost kan läggas till vid bokningen och levereras runt 08:30 av Boställets Vedugnsbageri – ni får ett SMS så fort den är på plats.",
    sirvoyTitle: "Frukost kan läggas till",
    stayboostTitle: "Frukost när den erbjuds",
    availability: "När frukost erbjuds för dina datum",
    guestInfo: "bokningsbekräftelsen via e-post och på din gästsida",
    deliveryTime: "08:30",
  },
  {
    lang: "en" as const,
    question: "Can we add breakfast?",
    sirvoyAnswer: "Yes, breakfast can be added at booking. It's delivered around 8:30 by Boställets Vedugnsbageri – you'll get a text as soon as it's ready.",
    sirvoyTitle: "Breakfast can be added",
    stayboostTitle: "Breakfast when available",
    availability: "When breakfast is offered for your dates",
    guestInfo: "confirmation email and on your guest page",
    deliveryTime: "8:30",
  },
  {
    lang: "de" as const,
    question: "Können wir Frühstück hinzufügen?",
    sirvoyAnswer: "Ja, das Frühstück kann bei der Buchung hinzugefügt werden. Es wird gegen 8:30 Uhr von Boställets Vedugnsbageri geliefert – Sie erhalten eine SMS, sobald es bereit ist.",
    sirvoyTitle: "Frühstück kann hinzugefügt werden",
    stayboostTitle: "Frühstück nach Verfügbarkeit",
    availability: "Wenn Frühstück für Ihre Reisedaten angeboten wird",
    guestInfo: "Buchungsbestätigung per E-Mail und auf Ihrer Gästeseite",
    deliveryTime: "8:30",
  },
];

describe("booking page communication promises", () => {
  it.each(cases)("keeps the existing Sirvoy breakfast copy in $lang", (copy) => {
    config.provider = "sirvoy";
    render(<MemoryRouter><Boka lang={copy.lang} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: copy.question }));
    expect(screen.getByText(copy.sirvoyAnswer)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.sirvoyTitle })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.stayboostTitle })).not.toBeInTheDocument();
  });

  it.each(cases)("uses email and guest-page information only for StayBoost in $lang", (copy) => {
    config.provider = "stayboost";
    const { rerender } = render(<MemoryRouter><Boka lang={copy.lang} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: copy.question }));
    const answer = screen.getByText((text) => text.includes(copy.availability));
    expect(answer).toHaveTextContent(copy.guestInfo);
    expect(answer).toHaveTextContent(copy.deliveryTime);
    expect(answer).toHaveTextContent("Boställets Vedugnsbageri");
    expect(answer.textContent).not.toMatch(/SMS|you'll get a text/i);
    expect(screen.queryByText(copy.sirvoyAnswer)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.stayboostTitle })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: copy.sirvoyTitle })).not.toBeInTheDocument();

    config.provider = "sirvoy";
    rerender(<MemoryRouter><Boka lang={copy.lang} /></MemoryRouter>);
    expect(screen.getByText(copy.sirvoyAnswer)).toBeInTheDocument();
  });
});
