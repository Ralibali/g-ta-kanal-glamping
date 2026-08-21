-- Existing /stay/:token reads public.bookings.public_token (uuid).
-- Native booking guest_token is generated from gen_random_uuid()::text, so after
-- the paid-booking compatibility bridge has created the legacy row, make both
-- systems use the same token. Trigger name sorts after the primary bridge.

create or replace function public.be_sync_guest_token_to_legacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status <> 'paid' or new.status <> 'confirmed' then
    return new;
  end if;

  update public.bookings
  set public_token = new.guest_token::uuid,
      updated_at = now()
  where coalesce(raw->>'native_booking_id', '') = new.id::text
    and public_token is distinct from new.guest_token::uuid;

  return new;
end;
$$;

drop trigger if exists zz_be_sync_guest_token_to_legacy on public.be_bookings;
create trigger zz_be_sync_guest_token_to_legacy
after insert or update of payment_status, status
on public.be_bookings
for each row execute function public.be_sync_guest_token_to_legacy();

revoke all on function public.be_sync_guest_token_to_legacy() from public, anon, authenticated;
