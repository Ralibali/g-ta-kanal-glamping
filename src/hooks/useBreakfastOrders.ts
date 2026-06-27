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
    const [stayResult, deliveryResult] = await Promise.all([
      (supabase as any)
        .from("tent_stays")
        .select("booking_number, tent_id, checkin_date, checkout_date, guests, guest_name, dietary, dietary_note, breakfast_csv_quantity, breakfast_addon_quantity, fikapase_csv_quantity, fikapase_addon_quantity")
        .gte("checkout_date", today)
        .lte("checkin_date", end),
      (supabase as any)
        .from("breakfast_deliveries")
        .select("booking_number, delivery_date, kind, status, sms_status, delivered_at, prepared_at, prepared_by, prepared_quantity")
        .gte("delivery_date", today)
        .lte("delivery_date", end),
    ]);

    if (stayResult.error) {
      toast.error(`Kunde inte ladda frukost: ${stayResult.error.message}`);
      setLoading(false);
      return;
    }
    if (deliveryResult.error) toast.error(`Kunde inte ladda leveranser: ${deliveryResult.error.message}`);

    const nextStays = (stayResult.data ?? []) as BreakfastStayInput[];
    const numbers = Array.from(new Set(nextStays.map((stay) => stay.booking_number)));
    let nextBookings: BreakfastBookingInput[] = [];
    if (numbers.length > 0) {
      const result = await (supabase as any).rpc("get_breakfast_booking_notes", {
        p_booking_numbers: numbers,
      });
      if (result.error) toast.error(`Kunde inte läsa bokningsanteckningar: ${result.error.message}`);
      nextBookings = (result.data ?? []) as BreakfastBookingInput[];
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

  const markPrepared = async (order: BreakfastOrder) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("breakfast_deliveries")
      .upsert({
        booking_number: order.bookingNumber,
        tent_id: order.tentIds[0],
        delivery_date: order.date,
        kind: order.kind,
        status: "prepared",
        prepared_at: new Date().toISOString(),
        prepared_by: user?.id ?? null,
        prepared_quantity: order.quantity,
      }, { onConflict: "booking_number,delivery_date,kind" });

    if (error) throw error;
    await load();
  };

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

  return { orders, loading, load, markPrepared, markDelivered };
}
