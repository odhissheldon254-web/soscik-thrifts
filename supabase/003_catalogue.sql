-- Sosick catalogue: categories the owner manages + his own products + photos.
-- Run after setup.sql (safe to re-run).

-- ---------- categories ----------
create table if not exists public.categories (
  id text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  name text not null check (length(name) between 1 and 40),     -- short name on the tile
  label text not null default '' check (length(label) <= 60),     -- longer name (plug lists, admin)
  emoji text not null default '🛍️' check (length(emoji) <= 16),
  tile text not null default '#FFD21F' check (tile ~ '^#[0-9A-Fa-f]{6}$'),
  tagline text not null default '' check (length(tagline) <= 140),
  words text not null default '' check (length(words) <= 300),   -- search words, comma separated
  sort int not null default 100,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (id, name, label, emoji, tile, tagline, words, sort) values
  ('kicks',   'Kicks',          'Sneakers & Shoes',       '👟', '#FF5A36', 'AF1s, dad shoes, Timbs, sandals. Fresh or barely worn.',      'sneakers,shoes,kicks,sneaker,airforce,af1,jordans,boots,sandals', 10),
  ('denim',   'Denim',          'Denim & Jeans',          '👖', '#3B6FE0', 'Baggy, straight, ripped, jorts. Every wash, every size.',     'jeans,denim,trouser,trousers,jorts', 20),
  ('tops',    'Tops & Hoodies', 'Tees, Shirts & Hoodies', '👕', '#22A65A', 'Vintage tees, hoodies, jackets and shirts for every mood.',  'tshirt,t-shirt,tee,shirt,hoodie,sweater,top,tops,jacket,jackets', 30),
  ('dresses', 'Dresses',        'Dresses & Skirts',       '👗', '#D6458F', 'From Sunday best to Saturday out.',                          'dress,dresses,skirt,skirts,gown', 40),
  ('bags',    'Bags & Extras',  'Bags & Accessories',     '👜', '#8B5CF6', 'Totes, caps, chains, watches. The finishing touch.',         'bag,bags,handbag,backpack,cap,caps,belt,watch,jewellery,jewelry', 50),
  ('phones',  'Gadgets',        'Phones & Gadgets',       '📱', '#111110', 'Phones, earbuds, chargers. Tested before you pay.',          'phone,phones,earphones,airpods,charger,gadget,laptop', 60),
  ('beauty',  'Beauty',         'Beauty & Grooming',      '💄', '#F28C28', 'Perfume, skincare, hair and wigs from sellers we trust.',    'perfume,makeup,skincare,lotion,hair,wig,wigs', 70),
  ('home',    'Hostel & Home',  'Home & Hostel',          '🛏️', '#0EA5A4', 'Duvets, curtains, cookers. Make the room feel like home.',   'duvet,bedsheet,curtain,curtains,cooker,hostel,home', 80)
on conflict (id) do nothing;

-- ---------- his own products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null references public.categories(id) on update cascade,
  name text not null check (length(name) between 1 and 80),
  description text not null default '' check (length(description) <= 500),
  price numeric check (price is null or price >= 0),
  photo text not null default '' check (photo = '' or photo ~ '^https://'),
  in_stock boolean not null default true,
  visible boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);

-- ---------- who can do what ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "admin all" on public.categories;
create policy "admin all" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads visible categories" on public.categories;
create policy "public reads visible categories" on public.categories for select to anon using (visible);

drop policy if exists "admin all" on public.products;
create policy "admin all" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public reads visible products" on public.products;
create policy "public reads visible products" on public.products for select to anon using (visible);

revoke insert, update, delete on public.categories, public.products from anon;
grant select on public.categories, public.products to anon;

-- ---------- product photos ----------
-- Public bucket: anyone can VIEW a photo by its link; only the admin can add/change/remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 3145728, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin adds product photos" on storage.objects;
create policy "admin adds product photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin changes product photos" on storage.objects;
create policy "admin changes product photos" on storage.objects for update to authenticated
  using (bucket_id = 'products' and public.is_admin()) with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin removes product photos" on storage.objects;
create policy "admin removes product photos" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.is_admin());
