export type CleaningStayLike = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  children: number | null;
};

export function pickPreparationStay(
  sameDayArrival: CleaningStayLike | undefined,
  futureStays: CleaningStayLike[],
  tentId: string,
  cleaningDate: string,
): CleaningStayLike | undefined {
  if (sameDayArrival) return sameDayArrival;

  return futureStays
    .filter((stay) => stay.tent_id === tentId && stay.checkin_date > cleaningDate)
    .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))[0];
}

export function towelCounts(guests: number | null | undefined) {
  const count = Math.max(0, Number(guests ?? 0));
  return { large: count, small: count };
}

export function towelInstruction(guests: number, lang: "sv" | "en" | "si") {
  const { large, small } = towelCounts(guests);

  if (lang === "en") return `Put out ${large} large and ${small} small towels`;
  if (lang === "si") return `විශාල තුවා ${large}ක් සහ කුඩා තුවා ${small}ක් තබන්න`;
  return `Lägg in ${large} stora och ${small} små handdukar`;
}
