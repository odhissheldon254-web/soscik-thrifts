-- Sosick database. Run once in Supabase → SQL Editor.
-- Safe to re-run: it only creates what's missing and resets the policies.
--
-- Who can do what:
--   • The owner (emails in public.admins) can read and change everything.
--   • Anyone (the public website) can: read live Verified Plugs, read which
--     charges are switched on, and drop a new order in (but never read orders).

create extension if not exists pgcrypto;

-- ---------- who counts as an admin ----------
create table if not exists public.admins (
  email text primary key
);
-- Put the owner's sign-in email here before running (kept out of the public repo):
insert into public.admins (email) values ('OWNER_EMAIL_HERE')
  on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- team ----------
create table if not exists public.team (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  phone text not null check (length(phone) between 9 and 16),
  role text not null default 'Rider',
  area text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^SOS-[0-9]{4}$'),
  customer text default '' check (length(customer) <= 80),
  phone text default '' check (length(phone) <= 16),
  item text default '' check (length(item) <= 500),
  pickup text default '' check (length(pickup) <= 200),
  drop_to text default '' check (length(drop_to) <= 300),
  pin text default '' check (pin = '' or pin ~ '^https://maps\.google\.com/\?q=-?[0-9.]+,-?[0-9.]+$'),
  when_wanted text default '' check (length(when_wanted) <= 40),
  pay text default '' check (length(pay) <= 40),
  status text not null default 'new' check (status in ('new','picked','way','done','cancel')),
  rider uuid references public.team(id) on delete set null,
  source text not null default 'admin' check (source in ('website','admin')),
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---------- charges ----------
create table if not exists public.charges (
  id text primary key,
  label text not null,
  hint text default '',
  unit text not null,
  amount numeric not null default 0 check (amount >= 0),
  is_on boolean not null default false,
  always_on boolean not null default false,
  seller boolean not null default false,
  sort int not null default 0
);
insert into public.charges (id, label, hint, unit, amount, is_on, always_on, seller, sort) values
  ('base',      'Delivery fee',               'Charged on every delivery',                                     'KES',      100, true,  true,  false, 1),
  ('km',        'Per km after the first 3 km', 'For longer trips',                                              'KES/km',   20,  false, false, false, 2),
  ('service',   'Service fee',                'Percent of the item price',                                     '%',        5,   false, false, false, 3),
  ('rush',      'Rush / ASAP fee',            'When the customer wants it right now',                          'KES',      50,  false, false, false, 4),
  ('night',     'Late-night fee',             'Orders after 9pm',                                              'KES',      80,  false, false, false, 5),
  ('featured',  'Featured plug spot',         'Shows first in its category (per week)',                        'KES/wk',   300, false, false, true,  6),
  ('spotlight', 'Homepage spotlight',         'Big card at the top of Verified Plugs (per week)',              'KES/wk',   500, false, false, true,  7),
  ('promo',     'Sosick promo post',          'Sosick posts the plug on its socials (per post)',     'KES/post', 400, false, false, true,  8),
  ('listing',   'Monthly plug listing',       'Keeps a verified plug listed. The badge itself is always earned, never sold', 'KES/mo', 200, false, false, true, 9)
on conflict (id) do nothing;

-- ---------- verified plugs ----------
create table if not exists public.plugs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  category text not null default 'denim',
  area text default '',
  sells text default '',
  link text default '' check (link = '' or link ~* '^https?://'),
  level text not null default 'verified' check (level in ('verified','trusted','top')),
  tested date,
  checks jsonb not null default '{}'::jsonb,
  status text not null default 'testing' check (status in ('testing','live','removed')),
  created_at timestamptz not null default now(),
  -- The Sosick Test: a plug can only be live once all five checks pass.
  constraint live_needs_all_checks check (
    status <> 'live' or (
      coalesce((checks->>'mystery')::boolean, false) and
      coalesce((checks->>'photo')::boolean, false) and
      coalesce((checks->>'price')::boolean, false) and
      coalesce((checks->>'time')::boolean, false) and
      coalesce((checks->>'issues')::boolean, false)
    )
  )
);

-- ---------- row level security ----------
alter table public.admins  enable row level security;  -- no policies: invisible through the API
alter table public.team    enable row level security;
alter table public.orders  enable row level security;
alter table public.charges enable row level security;
alter table public.plugs   enable row level security;

drop policy if exists "admin all" on public.team;
create policy "admin all" on public.team for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all" on public.orders;
create policy "admin all" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "website can place orders" on public.orders;
create policy "website can place orders" on public.orders for insert to anon
  with check (status = 'new' and rider is null and source = 'website');

drop policy if exists "admin all" on public.charges;
create policy "admin all" on public.charges for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads customer charges" on public.charges;
create policy "public reads customer charges" on public.charges for select to anon using (not seller);

drop policy if exists "admin all" on public.plugs;
create policy "admin all" on public.plugs for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads live plugs" on public.plugs;
create policy "public reads live plugs" on public.plugs for select to anon using (status = 'live');

-- Column-level: the public only ever sees what a plug card shows.
revoke select on public.plugs from anon;
grant select (name, category, area, sells, link, level, tested, status) on public.plugs to anon;
revoke select on public.orders from anon;
grant insert (code, customer, phone, item, pickup, drop_to, pin, when_wanted, pay, source) on public.orders to anon;
revoke select on public.charges from anon;
grant select (id, is_on, seller) on public.charges to anon;
revoke all on public.team from anon;
revoke all on public.admins from anon, authenticated;

-- Belt and braces: the public role only keeps the exact rights granted above.
revoke insert, update, delete on public.plugs, public.charges, public.team from anon;
revoke update, delete on public.orders from anon;
