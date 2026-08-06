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

export type RecentSessionLike = {
  tent_id: string;
  cleaning_date: string;
  status: string;
  arrival_booking: string | null;
};

export type ActiveStayLike = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
};

/**
 * Tält som blivit lediga för att en bokning flyttats till ett annat tält.
 * Signalen: en tidigare städning förbereddes för bokning B i tält T, men B bor
 * numera i ett annat tält och är fortfarande incheckad. Då står T smutsigt/oanvänt
 * utan att någon avresa finns i tent_stays — därför syns det inte i vanliga listan.
 */
export function findRebookedTents(
  recentSessions: RecentSessionLike[],
  activeStays: ActiveStayLike[],
  today: string,
): { tent_id: string; booking_number: string; movedTo: string }[] {
  const staysByBooking = new Map<string, ActiveStayLike[]>();
  for (const stay of activeStays) {
    if (stay.checkin_date > today || stay.checkout_date <= today) continue;
    const list = staysByBooking.get(stay.booking_number) ?? [];
    list.push(stay);
    staysByBooking.set(stay.booking_number, list);
  }

  const cleanedToday = new Set(
    recentSessions
      .filter((s) => s.cleaning_date === today && s.status === "completed")
      .map((s) => s.tent_id),
  );
  const openToday = new Set(recentSessions.filter((s) => s.cleaning_date === today).map((s) => s.tent_id));
  const occupiedTents = new Set(
    Array.from(staysByBooking.values()).flat().map((stay) => stay.tent_id),
  );

  const result = new Map<string, { tent_id: string; booking_number: string; movedTo: string }>();
  for (const session of recentSessions) {
    const booking = session.arrival_booking;
    if (!booking) continue;
    const current = staysByBooking.get(booking);
    if (!current || current.length === 0) continue;
    if (current.some((stay) => stay.tent_id === session.tent_id)) continue;
    if (cleanedToday.has(session.tent_id) || openToday.has(session.tent_id)) continue;
    if (occupiedTents.has(session.tent_id)) continue;
    result.set(session.tent_id, {
      tent_id: session.tent_id,
      booking_number: booking,
      movedTo: current[0].tent_id,
    });
  }
  return Array.from(result.values());
}
