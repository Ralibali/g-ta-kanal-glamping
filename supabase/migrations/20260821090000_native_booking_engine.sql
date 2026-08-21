-- Bergs Slussar Glamping native booking engine.
-- Keeps the booking ledger separate from the legacy Sirvoy import tables while
-- mirroring paid native bookings into the existing operations model used by
-- /frukost, /stad, check-in and guest workflows.

create table if not exists public.be_properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  currency text not null default 'SEK',
  checkin_time text not null default '15:00',
  checkout_time text not null default '10:00',
  contact_email text,
  contact_phone text,
  directions text,
  house_rules text,
  review_url text,
  swish_number text,
  wifi_name text,
  wifi_password text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.be_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.be_properties(id) on delete cascade,
  name text not null,
  description text,
  capacity int not null default 2 check (capacity between 1 and 20),
  base_price int not null default 0 check (base_price >= 0),
  weekend_pct int not null default 0,
  min_stay int not null default 1 check (min_stay >= 1),
  cleaning_fee int not null default 0 check (cleaning_fee >= 0),
  monthly_mult numeric[] not null default '{100,100,100,100,100,100,100,100,100,100,100,100}',
  door_code text,
  external_ref text,
  legacy_tent_id text,
  ical_feed_token uuid not null default gen_random_uuid(),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.be_addons (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.be_properties(id) on delete cascade,
  name text not null,
  name_en text,
  description text,
  description_en text,
  price int not null default 0 check (price >= 0),
  price_type text not null default 'per_booking',
  max_quantity int not null default 10 check (max_quantity > 0),
  image_url text,
  slug text,
  legacy_addon_id uuid references public.addons(id) on delete set null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.be_ical_sources (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.be_properties(id) on delete cascade,
  unit_id uuid not null references public.be_units(id) on delete cascade,
  name text not null,
  url text not null,
  active boolean not null default true,
  last_synced_at timestamptz,
  last_status text,
  last_error text,
  events_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.be_bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.be_properties(id) on delete cascade,
  unit_id uuid references public.be_units(id) on delete restrict,
  source text not null default 'direct',
  status text not null default 'confirmed',
  guest_name text,
  guest_email text,
  guest_phone text,
  guests int check (guests is null or guests > 0),
  checkin_date date not null,
  checkout_date date not null,
  language text not null default 'sv',
  notes text,
  total_amount int not null default 0 check (total_amount >= 0),
  addons_total int not null default 0 check (addons_total >= 0),
  payment_status text not null default 'pending',
  payment_method text not null default 'stripe',
  payment_amount int,
  payment_ref text,
  stripe_session_id text,
  payment_expires_at timestamptz,
  guest_token text not null default gen_random_uuid()::text,
  public_token text not null default gen_random_uuid()::text,
  external_id text,
  ical_source_id uuid references public.be_ical_sources(id) on delete set null,
  ical_uid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checkout_date > checkin_date)
);

-- Existing live databases already have most be_* columns. Keep this migration
-- safe when it runs there by adding the new hold field explicitly.
alter table public.be_bookings
  add column if not exists payment_expires_at timestamptz;

create table if not exists public.be_booking_addons (
  booking_id uuid not null references public.be_bookings(id) on delete cascade,
  addon_id uuid not null references public.be_addons(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  unit_price int not null check (unit_price >= 0),
  line_total int not null check (line_total >= 0),
  price_type text not null default 'per_booking',
  created_at timestamptz not null default now(),
  primary key (booking_id, addon_id)
);

create index if not exists be_units_property_active_idx
  on public.be_units(property_id, active, sort_order);
create index if not exists be_bookings_unit_dates_idx
  on public.be_bookings(unit_id, checkin_date, checkout_date);
create index if not exists be_bookings_pending_expiry_idx
  on public.be_bookings(payment_expires_at)
  where status = 'confirmed' and payment_status = 'pending';
create unique index if not exists be_bookings_payment_ref_idx
  on public.be_bookings(payment_ref) where payment_ref is not null;
create unique index if not exists be_bookings_stripe_session_idx
  on public.be_bookings(stripe_session_id) where stripe_session_id is not null;

-- Public clients never write these tables directly. The Edge Function uses the
-- service role. RLS therefore protects the ledger even if an anon key leaks.
alter table public.be_properties enable row level security;
alter table public.be_units enable row level security;
alter table public.be_addons enable row level security;
alter table public.be_ical_sources enable row level security;
alter table public.be_bookings enable row level security;
alter table public.be_booking_addons enable row level security;

-- Race-safe protection. Pending Stripe checkouts block the unit until their
-- hold expires; paid/confirmed bookings keep blocking it afterwards.
create or replace function public.be_prevent_booking_overlap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.unit_id is null or new.status <> 'confirmed' then
    return new;
  end if;

  if new.payment_status = 'pending'
     and new.payment_expires_at is not null
     and new.payment_expires_at <= now() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.unit_id::text, 0));

  if exists (
    select 1
    from public.be_bookings b
    where b.unit_id = new.unit_id
      and b.id <> new.id
      and b.status = 'confirmed'
      and b.checkin_date < new.checkout_date
      and b.checkout_date > new.checkin_date
      and not (
        b.payment_status = 'pending'
        and b.payment_expires_at is not null
        and b.payment_expires_at <= now()
      )
  ) then
    raise exception 'booking_overlap' using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists be_bookings_prevent_overlap on public.be_bookings;
create trigger be_bookings_prevent_overlap
before insert or update of unit_id, checkin_date, checkout_date, status, payment_status, payment_expires_at
on public.be_bookings
for each row execute function public.be_prevent_booking_overlap();

-- Mirror paid native bookings into the current operations tables. This is a
-- compatibility bridge, not the long-term canonical ledger.
create or replace function public.be_sync_paid_booking_to_legacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_number text;
  v_legacy_booking_id uuid;
  v_unit public.be_units%rowtype;
  v_addon record;
  v_legacy_addon_id uuid;
begin
  v_booking_number := 'SB-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));

  -- A cancelled native booking must disappear from current operational views.
  if new.status = 'cancelled' then
    delete from public.bookings
    where booking_number = v_booking_number
      and coalesce(raw->>'native_booking_id', '') = new.id::text;
    return new;
  end if;

  if new.payment_status <> 'paid' then
    return new;
  end if;

  select * into v_unit from public.be_units where id = new.unit_id;
  if v_unit.id is null or v_unit.legacy_tent_id is null then
    raise exception 'native_booking_missing_legacy_tent_mapping';
  end if;

  insert into public.bookings (
    booking_number, sirvoy_booking_no, guest_name, guest_first_name,
    email, phone, checkin_date, checkout_date, tent_id, tent_name,
    amount, lang, language, nights, raw
  ) values (
    v_booking_number, null, new.guest_name,
    nullif(split_part(coalesce(new.guest_name, ''), ' ', 1), ''),
    new.guest_email, new.guest_phone, new.checkin_date, new.checkout_date,
    v_unit.legacy_tent_id, v_unit.name, new.total_amount,
    coalesce(new.language, 'sv'), coalesce(new.language, 'sv'),
    (new.checkout_date - new.checkin_date),
    jsonb_build_object(
      'source', 'stayboost_native',
      'native_booking_id', new.id,
      'payment_ref', new.payment_ref,
      'number_of_guests', new.guests,
      'children_total', 0
    )
  )
  on conflict (booking_number) do update set
    guest_name = excluded.guest_name,
    email = excluded.email,
    phone = excluded.phone,
    checkin_date = excluded.checkin_date,
    checkout_date = excluded.checkout_date,
    tent_id = excluded.tent_id,
    tent_name = excluded.tent_name,
    amount = excluded.amount,
    raw = coalesce(public.bookings.raw, '{}'::jsonb) || excluded.raw,
    updated_at = now()
  returning id into v_legacy_booking_id;

  -- The legacy auto-assignment trigger normally creates tent_stays, but an
  -- explicit mapping is safer for native bookings and is idempotent.
  if not exists (
    select 1 from public.tent_stays ts
    where ts.booking_number = v_booking_number
      and ts.tent_id = v_unit.legacy_tent_id
  ) then
    insert into public.tent_stays (
      booking_number, tent_id, checkin_date, checkout_date,
      adults, children, guest_name, phone, email, lang, import_source
    ) values (
      v_booking_number, v_unit.legacy_tent_id, new.checkin_date, new.checkout_date,
      greatest(coalesce(new.guests, 1), 1), 0,
      new.guest_name, new.guest_phone, new.guest_email,
      coalesce(new.language, 'sv'), 'stayboost_native'
    );
  end if;

  -- Mirror paid booking add-ons into the existing addon-order pipeline so
  -- breakfast/cleaning operational quantities update through existing triggers.
  for v_addon in
    select ba.quantity, ba.unit_price, ba.line_total, a.slug, a.legacy_addon_id
    from public.be_booking_addons ba
    join public.be_addons a on a.id = ba.addon_id
    where ba.booking_id = new.id
  loop
    v_legacy_addon_id := v_addon.legacy_addon_id;
    if v_legacy_addon_id is null and v_addon.slug is not null then
      select id into v_legacy_addon_id
      from public.addons where slug = v_addon.slug limit 1;
    end if;

    if v_legacy_addon_id is not null and not exists (
      select 1 from public.addon_orders ao
      where ao.booking_id = v_legacy_booking_id
        and ao.addon_id = v_legacy_addon_id
        and ao.status in ('paid', 'confirmed')
    ) then
      insert into public.addon_orders (
        booking_id, addon_id, quantity, unit_price_sek, total_sek,
        status, paid_at
      ) values (
        v_legacy_booking_id, v_legacy_addon_id, v_addon.quantity,
        v_addon.unit_price, v_addon.line_total, 'paid', now()
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists be_sync_paid_booking_to_legacy on public.be_bookings;
create trigger be_sync_paid_booking_to_legacy
after insert or update of payment_status, status
on public.be_bookings
for each row execute function public.be_sync_paid_booking_to_legacy();

revoke all on function public.be_prevent_booking_overlap() from public, anon, authenticated;
revoke all on function public.be_sync_paid_booking_to_legacy() from public, anon, authenticated;
