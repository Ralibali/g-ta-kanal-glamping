import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { todayInStockholm } from "@/cleaning/config";
import {
  buildBreakfastOrders,
  type BreakfastBookingInput,
  type BreakfastDeliveryInput,
  type BreakfastOrder,
  type BreakfastStayInput,
} from "@/lib/breakfast-orders";
import { toast } from "sonner";

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

type RawBreakfastStay = {
  booking_number: string;
  tent_id: string;
  checkin_date: string;
  checkout_date: string;
  guests: number | null;
  guest_name: string | null;
  dietary: string[] | null;
  dietary_note: string | null;
  breakfast_csv_quantity?: number | null;
  breakfast_addon_quantity?: number | null;
  fikapase_csv_quantity?: number | null;
  fikapase_addon_quantity?: number | null;
  breakfast?: boolean | null;
  fikapase?: boolean | null;
};

function bookingGuestTotal(rows: RawBreakfastStay[]): number {
  const values = rows
    .map((row) => Number(row.guests ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) return 0;

  // Sirvoy kan upprepa bokningens totala gästantal på varje tält-rad.
  // När alla värden är identiska ska antalet därför bara räknas en gång.
  if (rows.length > 1 && new Set(values).size === 1) return values[0];

  return values.reduce((sum, value) => sum + value, 0);
}

function normalizeStayRows(rows: RawBreakfastStay[]): BreakfastStayInput[] {
  const normalized: BreakfastStayInput[] = rows.map((row) => ({
    booking_number: row.booking_number,
    tent_id: row.tent_id,
    checkin_date: row.checkin_date,
    checkout_date: row.checkout_date,
    guests: row.guests,
    guest_name: row.guest_name,
    dietary: row.dietary,
    dietary_note: row.dietary_note,
    breakfast_csv_quantity: Number(row.breakfast_csv_quantity ?? 0),
    breakfast_addon_quantity: Number(row.breakfast_addon_quantity ?? 0),
    fikapase_csv_quantity: Number(row.fikapase_csv_quantity ?? 0),
    fikapase_addon_quantity: Number(row.fikapase_addon_quantity ?? 0),
  }));

  const groups = new Map<string, number[]>();
  rows.forEach((row, index) => {
    const key = `${row.booking_number}|${row.checkin_date}|${row.checkout_date}`;
    groups.set(key, [...(groups.get(key) ?? []), index]);
  });

  groups.forEach((indices) => {
    const rawGroup = indices.map((index) => rows[index]);
    const normalizedGroup = indices.map((index) => normalized[index]);
    const exactBreakfast = normalizedGroup.reduce(
      (sum, row) => sum + row.breakfast_csv_quantity + row.breakfast_addon_quantity,
      0,
    );
    const exactFika = normalizedGroup.reduce(
      (sum, row) => sum + row.fikapase_csv_quantity + row.fikapase_addon_quantity,
      0,
    );

    // Reserv för databaser/importer där de nya mängdfälten ännu inte fyllts.
    // Lägg bokningsnivåns reservmängd på en enda rad så flertältsbokningar inte dubbleras.
    if (exactBreakfast === 0 && rawGroup.some((row) => row.breakfast === true)) {
      normalized[indices[0]].breakfast_csv_quantity = Math.max(1, bookingGuestTotal(rawGroup));
    }
    if (exactFika === 0 && rawGroup.some((row) => row.fikapase === true)) {
      normalized[indices[0]].fikapase_csv_quantity = 1;
    }
  });

  return normalized;
}

export function useBreakfastOrders(active: boolean) {
  const [stays, setStays] = useState<BreakfastStayInput[]>([]);
  const [bookings, setBookings] = useState<BreakfastBookingInput[]>([]);
  const [deliveries, setDeliveries] = useState<BreakfastDeliveryInput[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    const today = todayInStockholm();
    const end = addDays(today, 60);

    const deliveryPromise = (supabase as any)
      .from("breakfast_deliveries")
      .select("booking_number, delivery_date, kind, status, sms_status, delivered_at")
      .gte("delivery_date", today)
      .lte("delivery_date", end);

    let stayResult = await (supabase as any)
      .from("tent_stays")
      .select("booking_number, tent_id, checkin_date, checkout_date, guests, guest_name, dietary, dietary_note, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity, breakfast, fikapase")
      .gte("checkout_date", today)
      .lte("checkin_date", end);

    // Bakåtkompatibilitet: de nya mängdkolumnerna kan saknas tills migrationen körts.
    if (stayResult.error) {
      stayResult = await (supabase as any)
        .from("tent_stays")
        .select("booking_number, tent_id, checkin_date, checkout_date, guests, guest_name, dietary, dietary_note, breakfast, fikapase")
        .gte("checkout_date", today)
        .lte("checkin_date", end);
    }

    const deliveryResult = await deliveryPromise;

    if (stayResult.error) {
      toast.error(`Kunde inte ladda frukost: ${stayResult.error.message}`);
      setLoading(false);
      return;
    }
    if (deliveryResult.error) toast.error(`Kunde inte ladda leveranser: ${deliveryResult.error.message}`);

    const nextStays = normalizeStayRows((stayResult.data ?? []) as RawBreakfastStay[]);
    const numbers = Array.from(new Set(nextStays.map((stay) => stay.booking_number)));
    let nextBookings: BreakfastBookingInput[] = [];
    if (numbers.length > 0) {
      const result = await (supabase as any).rpc("get_breakfast_booking_notes", {
        p_booking_numbers: numbers,
      });
      // Antecknings-RPC:n är ett tillägg. Bokningarna ska fortfarande visas om den saknas.
      if (!result.error) nextBookings = (result.data ?? []) as BreakfastBookingInput[];
    }

    setStays(nextStays);
    setBookings(nextBookings);
    setDeliveries((deliveryResult.data ?? []) as BreakfastDeliveryInput[]);
    setLoading(false);
  }, [active]);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(() => buildBreakfastOrders(stays, bookings, deliveries), [stays, bookings, deliveries]);

  const markDelivered = async (order: BreakfastOrder) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-breakfast-delivered`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      },
      body: JSON.stringify({
        booking_number: order.bookingNumber,
        delivery_date: order.date,
        kind: order.kind,
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Kunde inte markera leveransen.");
    await load();
  };

  return { orders, loading, load, markDelivered };
}
