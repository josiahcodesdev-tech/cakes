-- Crumb & Frost: database setup.
-- Paste this whole file into Supabase → SQL Editor → New query, change the admin email below, then press Run.
-- Safe to run again: it only creates what's missing and won't duplicate the starter cakes.

-- ---------------------------------------------------------------
-- 1. Who can use the admin page
-- ---------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

-- 👇 Put the email you'll log in with here (you can add more lines for staff).
insert into public.admins (email) values ('you@example.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

drop policy if exists "Admins can see the admin list" on public.admins;
create policy "Admins can see the admin list" on public.admins for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------
-- 2. Cakes
-- ---------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  image text not null,
  base_price integer not null check (base_price >= 0),
  old_price integer check (old_price >= 0),
  flavours text[] not null default '{}',
  fixed_size text,
  ready_in text,
  tags text[] not null default '{}',
  rating numeric(2,1) not null default 4.8,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "Anyone can see cakes on sale" on public.products;
create policy "Anyone can see cakes on sale" on public.products for select using (active or public.is_admin());
drop policy if exists "Admins manage cakes" on public.products;
create policy "Admins manage cakes" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- 3. Orders (website orders, custom requests, and payments you request yourself)
-- ---------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null default 'order' check (kind in ('order', 'custom', 'manual')),
  customer_name text not null default '',
  phone text not null default '',
  address text,
  delivery_date date,
  zone text,
  items jsonb not null default '[]',
  notes text,
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  status text not null default 'new' check (status in ('new', 'confirmed', 'baking', 'ready', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  amount_requested integer,
  amount_paid integer not null default 0,
  mpesa_code text,
  payment_reference text,
  paid_at timestamptz
);
create index if not exists orders_created_at on public.orders (created_at desc);
create index if not exists orders_payment_reference on public.orders (payment_reference);
alter table public.orders enable row level security;

-- Customers can place an order but can't read anyone's orders or mark themselves as paid.
drop policy if exists "Customers can place orders" on public.orders;
create policy "Customers can place orders" on public.orders for insert to anon, authenticated
  with check (status = 'new' and payment_status = 'unpaid' and amount_paid = 0 and mpesa_code is null and paid_at is null and kind in ('order', 'custom'));
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- 4. Cake photos
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('cake-images', 'cake-images', true) on conflict (id) do nothing;

drop policy if exists "Admins upload cake photos" on storage.objects;
create policy "Admins upload cake photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'cake-images' and public.is_admin());
drop policy if exists "Admins replace cake photos" on storage.objects;
create policy "Admins replace cake photos" on storage.objects for update to authenticated
  using (bucket_id = 'cake-images' and public.is_admin());
drop policy if exists "Admins delete cake photos" on storage.objects;
create policy "Admins delete cake photos" on storage.objects for delete to authenticated
  using (bucket_id = 'cake-images' and public.is_admin());

-- ---------------------------------------------------------------
-- 5. Starter cakes (the ones currently on the website)
-- ---------------------------------------------------------------
insert into public.products (slug, name, category, description, image, base_price, old_price, flavours, fixed_size, ready_in, tags, rating, sort_order) values
  ('classic-black-forest', 'Classic Black Forest', 'ready', 'Chocolate sponge soaked in cherry syrup, layered with whipped cream and crowned with cherries and chocolate shavings.', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 2600, 3000, array['Black Forest']::text[], null, '1–2 hrs', array['bestseller']::text[], 4.8, 0),
  ('chocolate-fudge-swirl', 'Chocolate Fudge Swirl', 'ready', 'Moist chocolate sponge, silky ganache drip and piped chocolate buttercream rosettes.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 2600, null, array['Chocolate']::text[], null, '1–2 hrs', array['bestseller']::text[], 4.9, 1),
  ('red-velvet-classic', 'Red Velvet Classic', 'ready', 'Velvety cocoa sponge layered with tangy cream cheese frosting. Always a crowd-pleaser.', 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80', 2800, null, array['Red Velvet']::text[], null, '1–2 hrs', array[]::text[], 4.8, 2),
  ('oreo-cookies-and-cream', 'Oreo Cookies & Cream', 'ready', 'Chocolate sponge with crushed-Oreo cream filling and a cookie-crumb finish.', 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80', 2900, 3200, array['Oreo', 'Chocolate']::text[], null, '1–2 hrs', array[]::text[], 4.8, 3),
  ('confetti-birthday-bash', 'Confetti Birthday Bash', 'birthday', 'Vanilla sponge loaded with rainbow sprinkles, pink drip and cherries. Name & age piping included.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=800&q=80', 3500, 3750, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '1–3 hrs', array['bestseller']::text[], 4.8, 4),
  ('macaron-dream-tall-cake', 'Macaron Dream Tall Cake', 'birthday', 'A tall pastel-striped cake with a white chocolate drip and a crown of French macarons.', 'https://images.unsplash.com/photo-1562440499-64c9a111f713?auto=format&fit=crop&w=800&q=80', 4200, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '1–3 hrs', array['new']::text[], 4.8, 5),
  ('golden-drip-celebration', 'Golden Drip Celebration', 'birthday', 'Chocolate drip, gold-painted accents, meringue kisses and macarons on a soft pistachio buttercream.', 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?auto=format&fit=crop&w=800&q=80', 4250, 4600, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '1–3 hrs', array[]::text[], 4.8, 6),
  ('chocolate-mousse-drip', 'Chocolate Mousse Drip', 'birthday', 'Light chocolate mousse layers under a glossy ganache drip and chocolate pearls.', 'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=800&q=80', 3600, null, array['Chocolate', 'Mocha', 'Chocolate-Vanilla Marble']::text[], null, '1–3 hrs', array[]::text[], 4.8, 7),
  ('blackberry-bloom', 'Blackberry Bloom', 'anniversary', 'Semi-naked vanilla cake topped with fresh blackberries and edible lilac flowers.', 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=800&q=80', 3500, null, array['Vanilla', 'Lemon', 'Berry']::text[], null, '2–3 hrs', array[]::text[], 4.8, 8),
  ('raspberry-romance', 'Raspberry Romance', 'anniversary', 'Fluffy sponge layered with raspberry compote and whipped cream, topped with fresh berries.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80', 3200, 3600, array['Vanilla', 'Raspberry']::text[], null, '2–3 hrs', array[]::text[], 4.8, 9),
  ('strawberries-and-cream', 'Strawberries & Cream', 'anniversary', 'Japanese-style strawberry shortcake: feather-light sponge, fresh cream and juicy strawberries.', 'https://images.unsplash.com/photo-1602663491496-73f07481dbea?auto=format&fit=crop&w=800&q=80', 3300, null, array['Vanilla', 'Strawberry']::text[], null, '2–3 hrs', array[]::text[], 4.8, 10),
  ('rainbow-sprinkle-surprise', 'Rainbow Sprinkle Surprise', 'kids', 'Six rainbow layers hidden inside a sprinkle-covered shell. Pure joy when you cut it.', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80', 3500, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '3–4 hrs', array['bestseller']::text[], 4.8, 11),
  ('ice-cream-cone-party', 'Ice-Cream Cone Party', 'kids', 'Funfetti cake with a pink drip and an upside-down waffle cone topper.', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=800&q=80', 3800, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '3–4 hrs', array['new']::text[], 4.8, 12),
  ('cookies-and-cream-tower', 'Cookies & Cream Tower', 'kids', 'A tall cake with pink drip, Oreos, swirls and a doughnut on top. Theme it however you like.', 'https://images.unsplash.com/photo-1616690710400-a16d146927c5?auto=format&fit=crop&w=800&q=80', 4500, 4800, array['Oreo', 'Vanilla', 'Chocolate']::text[], null, '3–4 hrs', array[]::text[], 4.8, 13),
  ('mint-choc-cupcakes', 'Mint Choc Cupcakes', 'cupcakes', 'Chocolate cupcakes swirled with fresh mint buttercream and a chocolate button.', 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80', 1400, null, array['Chocolate']::text[], 'Box of 6', '2–3 hrs', array[]::text[], 4.8, 14),
  ('oreo-chocolate-cupcakes', 'Oreo Chocolate Cupcakes', 'cupcakes', 'Rich chocolate cupcakes, cookies & cream frosting and half an Oreo on top.', 'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=800&q=80', 1500, null, array['Chocolate', 'Oreo']::text[], 'Box of 6', '2–3 hrs', array['bestseller']::text[], 4.8, 15),
  ('red-velvet-cupcakes', 'Red Velvet Cupcakes', 'cupcakes', 'A dozen red velvet cupcakes with cream cheese frosting and red velvet crumbs.', 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80', 2600, 2800, array['Red Velvet']::text[], 'Box of 12', '2–3 hrs', array[]::text[], 4.8, 16),
  ('sprinkle-party-cupcakes', 'Sprinkle Party Cupcakes', 'cupcakes', 'Vanilla cupcakes with fluffy buttercream and rainbow sprinkles. Perfect for class parties.', 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80', 2400, null, array['Vanilla', 'Chocolate', 'Strawberry']::text[], 'Box of 12', '2–3 hrs', array[]::text[], 4.8, 17),
  ('tiramisu-fine-cake', 'Tiramisu Fine Cake', 'signature', 'Espresso-soaked sponge, mascarpone cream and a dusting of cocoa. Adults-only indulgence.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 4500, null, array['Tiramisu']::text[], null, '24 hrs', array[]::text[], 5, 18),
  ('blueberry-cheesecake', 'Blueberry Cheesecake', 'signature', 'Baked New York cheesecake on a buttery biscuit base with a thick blueberry topping.', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 4200, null, array['Blueberry', 'Strawberry', 'Plain']::text[], null, '24 hrs', array[]::text[], 4.8, 19),
  ('orange-mirror-glaze', 'Orange Mirror Glaze', 'signature', 'Orange mousse cake with a glossy mirror glaze, chocolate lattice and strawberries.', 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=800&q=80', 3800, 4200, array['Orange', 'Passion']::text[], null, '24 hrs', array['new']::text[], 4.8, 20),
  ('coffee-crunch-layer', 'Coffee Crunch Layer', 'signature', 'Thin coffee-soaked sponge layers with mascarpone and a crunchy chocolate wafer.', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80', 4000, null, array['Coffee', 'Mocha']::text[], null, '24 hrs', array[]::text[], 4.8, 21),
  ('eggless-vanilla-cake', 'Eggless Vanilla Cake', 'special', 'Our classic vanilla sponge made completely egg-free, without losing any of the softness.', 'https://images.unsplash.com/photo-1602663491496-73f07481dbea?auto=format&fit=crop&w=800&q=80', 3000, null, array['Vanilla', 'Strawberry']::text[], null, '24 hrs', array['eggless']::text[], 4.8, 22),
  ('eggless-red-velvet', 'Eggless Red Velvet', 'special', 'Egg-free red velvet with cream cheese frosting. Nobody will guess.', 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=800&q=80', 3200, null, array['Red Velvet']::text[], null, '24 hrs', array['eggless']::text[], 4.8, 23),
  ('sugar-free-diabetic-cake', 'Sugar-free Diabetic Cake', 'special', 'Sweetened with natural stevia and fresh fruit. Suitable for diabetic guests.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80', 3500, null, array['Vanilla', 'Lemon']::text[], null, '24 hrs', array['sugar-free']::text[], 4.8, 24),
  ('logo-print-corporate-cake', 'Logo Print Corporate Cake', 'corporate', 'Your company logo on an A4 edible print, in brand colours. Great for launches and team wins.', 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=800&q=80', 5500, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '24 hrs', array[]::text[], 4.8, 25),
  ('executive-chocolate-cake', 'Executive Chocolate Cake', 'corporate', 'A sleek 3 kg chocolate cake finished to match your event branding.', 'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=800&q=80', 6000, null, array['Chocolate', 'Vanilla']::text[], '3 kg', '24 hrs', array[]::text[], 4.8, 26),
  ('graduation-gold-tall-cake', 'Graduation Gold Tall Cake', 'graduation', 'A tall design with gold accents, a fondant cap and the graduate’s name.', 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?auto=format&fit=crop&w=800&q=80', 4500, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '3–4 hrs', array['new']::text[], 4.8, 27),
  ('proud-grad-chocolate-cake', 'Proud Grad Chocolate Cake', 'graduation', 'Chocolate drip cake finished with a personalised “Congrats Grad” topper.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 3600, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '3–4 hrs', array[]::text[], 4.8, 28),
  ('gender-reveal-surprise', 'Gender Reveal Surprise', 'baby', 'Neutral on the outside and pink or blue inside. Tell us the secret privately and we keep it.', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80', 4200, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '24 hrs', array[]::text[], 4.8, 29),
  ('baby-shower-pastel-cake', 'Baby Shower Pastel Cake', 'baby', 'Soft pastel stripes, macarons and a “Oh Baby” topper.', 'https://images.unsplash.com/photo-1562440499-64c9a111f713?auto=format&fit=crop&w=800&q=80', 4000, null, array['Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Black Forest', 'Chocolate-Vanilla Marble']::text[], null, '24 hrs', array[]::text[], 4.8, 30),
  ('mini-bento-5-cupcakes', 'Mini Bento + 5 Cupcakes', 'baby', 'A lunchbox-size bento cake with five matching cupcakes. Perfect for small showers.', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80', 2500, null, array['Vanilla', 'Chocolate']::text[], 'Bento + 5 cupcakes', '24 hrs', array[]::text[], 4.8, 31),
  ('berries-and-blooms-bundle', 'Berries & Blooms Bundle', 'flowers', 'A 1 kg berry-topped cake with a hand-tied bouquet of fresh roses and a greeting card.', 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80', 6500, 7200, array['Vanilla', 'Chocolate', 'Red Velvet']::text[], '1 kg cake + bouquet', '2–3 hrs', array[]::text[], 4.8, 32),
  ('floral-kiss-combo', 'Floral Kiss Combo', 'flowers', 'Our Blackberry Bloom cake paired with a colourful mixed bouquet.', 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=800&q=80', 5800, null, array['Vanilla', 'Lemon']::text[], '1 kg cake + bouquet', '2–3 hrs', array[]::text[], 4.8, 33),
  ('cupcakes-and-roses-hatbox', 'Cupcakes & Roses Hatbox', 'flowers', 'A hatbox of fresh roses with six cupcakes tucked inside. A surprise they’ll remember.', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80', 4800, null, array['Vanilla', 'Strawberry']::text[], '6 cupcakes + roses', '2–3 hrs', array[]::text[], 4.8, 34),
  ('garden-rose-three-tier', 'Garden Rose Three-Tier', 'wedding', 'Three ivory tiers dressed with fresh garden roses. Includes a free tasting session.', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80', 28000, null, array['Vanilla', 'Lemon', 'Red Velvet', 'Carrot']::text[], '3 tiers · 8 kg (80–100 guests)', '2 weeks', array[]::text[], 5, 35),
  ('berry-cascade-two-tier', 'Berry Cascade Two-Tier', 'wedding', 'An intimate two-tier cake with a cascade of fresh berries.', 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80', 16500, null, array['Vanilla', 'Lemon', 'Berry']::text[], '2 tiers · 5 kg (50–60 guests)', '2 weeks', array[]::text[], 4.8, 36)
on conflict (slug) do nothing;
