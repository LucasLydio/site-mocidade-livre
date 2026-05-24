# Supabase MVP Database Rules

## Context

This database is a simplified MVP version focused on:

- Public content pages
- Events
- Areas
- Contact interests
- Product catalog
- Product images
- Cart flow
- WhatsApp checkout instead of online payment

The goal is to avoid unnecessary complexity in the first version while keeping the schema clean and easy to evolve later.

---

## MVP Tables

The MVP will use only these tables:

```txt
users
areas
events
contact_interests
categories
products
product_images
carts
cart_items
```

---

## Removed or Postponed Tables

These tables are not necessary for the first MVP version:

```txt
area_members
event_areas
event_registrations
albums
photos
product_variants
orders
order_items
order_payments
```

### Reason

The MVP does not need complete event registration, albums, product variants, internal payment processing, or formal order tracking yet.

For now, the user can select products, generate a cart, and send the order details to WhatsApp.

---

## Main MVP Rules

### 1. Users

The `users` table stores application users.

Rules:

- User IDs use UUID.
- Email must be unique.
- Roles are simplified to `admin` and `common`.
- Admin users can manage private/admin data.
- Common users can access their own information.

---

### 2. Areas

The `areas` table stores ministry, department, or activity areas.

Rules:

- Public users can read only active areas.
- Admin users can create, update, and delete areas.
- Each area has a unique slug.

---

### 3. Events

The `events` table stores public events.

Rules:

- Public users can read only published events.
- Admin users can manage events.
- Events may have location information and a cover image.
- Events are ordered/searchable by date.

---

### 4. Contact Interests

The `contact_interests` table stores people interested in participating, contacting, or joining an area.

Rules:

- Anyone can create a contact interest.
- Only admins can read/manage contact interests.
- Status is simplified to `new`, `contacted`, and `archived`.

---

### 5. Categories

The `categories` table organizes products.

Rules:

- Public users can read only active categories.
- Admin users can manage categories.
- Each category has a unique slug.

---

### 6. Products

The `products` table stores catalog products.

Rules:

- Public users can read only active products.
- Admin users can manage products.
- Product price is stored in cents using `price_cents`.
- Product stock is stored using `stock_qty`.
- Products can belong to one category.
- Product variants are postponed for future versions.

---

### 7. Product Images

The `product_images` table stores images related to products.

Rules:

- A product can have multiple images.
- One image can be marked as cover using `is_cover`.
- Images are deleted when the product is deleted.
- Public users can read images only from active products.

> Naming rule: use `product_images`, not `products_images`, because each image belongs to one product.

---

### 8. Carts

The `carts` table stores temporary cart data.

Rules:

- A cart can belong to a logged user.
- Anonymous carts can be handled in frontend localStorage.
- Cart status is simplified to `open`, `sent_to_whatsapp`, and `abandoned`.
- No payment is processed inside the system in this MVP.
- The cart can store customer name, WhatsApp number, and notes before sending to WhatsApp.

---

### 9. Cart Items

The `cart_items` table stores products inside a cart.

Rules:

- Each cart item belongs to a cart.
- Each cart item references one product.
- Quantity must be greater than zero.
- Unit price and product name are copied into the cart item to preserve the checkout snapshot.
- The same product should appear only once per cart.

---

## Security Rules

### Public Read

Public users can read:

```txt
active areas
published events
active categories
active products
product images from active products
```

### Admin Access

Admin users can fully manage:

```txt
users
areas
events
contact_interests
categories
products
product_images
carts
cart_items
```

### User Access

Logged users can:

```txt
read their own profile
update their own profile
manage their own carts
manage their own cart items
```

---

## WhatsApp Checkout Rule

This MVP does not create real payment records.

The frontend/backend should generate a WhatsApp message from the cart, for example:

```txt
Hello, I want to place an order:

Customer: John Doe
WhatsApp: +55 11 99999-9999

Items:
- Product A x2 - R$ 20,00
- Product B x1 - R$ 15,00

Total: R$ 35,00
Notes: Please confirm availability.
```

After sending the message, the cart can be marked as:

```txt
sent_to_whatsapp
```

---

## Supabase SQL

```sql
-- =========================================================
-- MVP DATABASE - SHOP + WHATSAPP CHECKOUT
-- Supabase PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- USERS
-- =========================================================

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  telephone text null,
  role text not null default 'common'
    check (role in ('admin', 'common')),
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_unique_ci
on public.users (lower(email));

create index if not exists users_role_idx
on public.users (role);

-- =========================================================
-- AREAS
-- =========================================================

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  cover_image_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists areas_slug_unique
on public.areas (slug);

create index if not exists areas_active_idx
on public.areas (is_active);

-- =========================================================
-- EVENTS
-- =========================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text null,
  description text null,
  starts_at timestamptz not null,
  ends_at timestamptz null,
  location_name text null,
  location_address text null,
  cover_image_url text null,
  is_published boolean not null default false,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx
on public.events (starts_at);

create index if not exists events_published_starts_at_idx
on public.events (is_published, starts_at);

-- =========================================================
-- CONTACT INTERESTS
-- =========================================================

create table if not exists public.contact_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text null,
  area_interest text not null,
  message text null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_interests_status_created_idx
on public.contact_interests (status, created_at desc);

-- =========================================================
-- CATEGORIES
-- =========================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_slug_unique
on public.categories (slug);

create index if not exists categories_active_idx
on public.categories (is_active);

-- =========================================================
-- PRODUCTS
-- =========================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid null references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  price_cents integer not null check (price_cents >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_slug_unique
on public.products (slug);

create index if not exists products_category_idx
on public.products (category_id);

create index if not exists products_active_idx
on public.products (is_active);

-- =========================================================
-- PRODUCT IMAGES
-- =========================================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx
on public.product_images (product_id);

create index if not exists product_images_cover_idx
on public.product_images (product_id, is_cover);

-- =========================================================
-- CARTS
-- =========================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'sent_to_whatsapp', 'abandoned')),
  customer_name text null,
  customer_whatsapp text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_user_status_idx
on public.carts (user_id, status);

create index if not exists carts_status_created_idx
on public.carts (status, created_at desc);

-- =========================================================
-- CART ITEMS
-- =========================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  product_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_cart_idx
on public.cart_items (cart_id);

create index if not exists cart_items_product_idx
on public.cart_items (product_id);

create unique index if not exists cart_items_cart_product_unique
on public.cart_items (cart_id, product_id);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_areas_updated_at on public.areas;
create trigger set_areas_updated_at
before update on public.areas
for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_interests_updated_at on public.contact_interests;
create trigger set_contact_interests_updated_at
before update on public.contact_interests
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_carts_updated_at on public.carts;
create trigger set_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================

alter table public.users enable row level security;
alter table public.areas enable row level security;
alter table public.events enable row level security;
alter table public.contact_interests enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Helper: check if current authenticated user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$ language sql stable security definer;

-- =========================================================
-- PUBLIC READ POLICIES
-- =========================================================

create policy "Public can read active areas"
on public.areas
for select
using (is_active = true);

create policy "Public can read published events"
on public.events
for select
using (is_published = true);

create policy "Public can read active categories"
on public.categories
for select
using (is_active = true);

create policy "Public can read active products"
on public.products
for select
using (is_active = true);

create policy "Public can read product images"
on public.product_images
for select
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

-- =========================================================
-- ADMIN FULL ACCESS POLICIES
-- =========================================================

create policy "Admin can manage users"
on public.users
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage areas"
on public.areas
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage events"
on public.events
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage contact interests"
on public.contact_interests
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage categories"
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage products"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage product images"
on public.product_images
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage carts"
on public.carts
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admin can manage cart items"
on public.cart_items
for all
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- USER / CONTACT POLICIES
-- =========================================================

create policy "Users can read own profile"
on public.users
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Anyone can create contact interest"
on public.contact_interests
for insert
with check (true);

create policy "Users can manage own carts"
on public.carts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own cart items"
on public.cart_items
for all
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);
```

---

## Future Version Ideas

After the MVP is working, you can add:

```txt
orders
order_items
order_payments
product_variants
event_registrations
albums
photos
area_members
event_areas
```

Recommended next step after MVP:

1. Add real `orders` and `order_items` after validating WhatsApp checkout.
2. Add `product_variants` only if products need sizes, colors, or options.
3. Add `order_payments` only when online payment is implemented.
4. Add `event_registrations` only when users need to register for events.
5. Add `albums` and `photos` only when gallery content becomes necessary.
