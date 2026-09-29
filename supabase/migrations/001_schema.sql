create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'store_manager', 'system_admin');
create type public.order_status as enum ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
create type public.payment_status as enum ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type public.purchase_status as enum ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role public.app_role not null default 'customer',
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  hero_image_url text,
  accent text not null default '#8ECAE6',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  description text not null default '',
  price_fcfa integer not null check (price_fcfa >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  age_group text,
  size_label text,
  gender text check (gender is null or gender in ('Fille', 'Garçon', 'Mixte')),
  color text,
  cover_image_url text,
  featured boolean not null default false,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(product_id, storage_path)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  delivery_window text not null,
  fee_fcfa integer not null check (fee_fcfa >= 0),
  active boolean not null default true,
  display_order integer not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  contact_phone text not null,
  shipping_address text not null,
  delivery_area text not null,
  delivery_fee_fcfa integer not null check (delivery_fee_fcfa >= 0),
  subtotal_fcfa integer not null check (subtotal_fcfa >= 0),
  total_fcfa integer not null check (total_fcfa >= 0),
  payment_method text not null check (payment_method in ('MOBILE_MONEY', 'CASH_ON_DELIVERY')),
  payment_status public.payment_status not null default 'PENDING',
  status public.order_status not null default 'PENDING',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price_fcfa integer not null check (unit_price_fcfa >= 0),
  line_total_fcfa integer generated always as (quantity * unit_price_fcfa) stored
);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta integer not null,
  reason text not null,
  reference_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_id uuid not null references public.suppliers(id),
  status public.purchase_status not null default 'DRAFT',
  expected_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  received_quantity integer not null default 0 check (received_quantity >= 0 and received_quantity <= quantity),
  unit_cost_fcfa integer not null default 0 check (unit_cost_fcfa >= 0)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  check (key in ('promo_banner', 'home_message', 'delivery_message', 'store_contact'))
);

create table public.visitor_events (
  id bigint generated by default as identity primary key,
  visitor_id uuid not null,
  event_type text not null check (event_type in ('heartbeat', 'category_view')),
  category_slug text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders(created_at desc);
create index orders_status_idx on public.orders(status);
create index products_category_idx on public.products(category_id);
create index products_active_idx on public.products(active);
create index products_stock_idx on public.products(stock_quantity);
create index visitor_events_created_idx on public.visitor_events(created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger suppliers_touch before update on public.suppliers for each row execute function public.touch_updated_at();
create trigger purchase_orders_touch before update on public.purchase_orders for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, email, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.email, ''),
    coalesce(nullif(new.phone, ''), nullif(new.raw_user_meta_data->>'phone', ''))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles(id, full_name, email, phone)
select id, nullif(raw_user_meta_data->>'full_name',''), nullif(email,''), coalesce(nullif(phone,''), nullif(raw_user_meta_data->>'phone',''))
from auth.users
on conflict (id) do nothing;

create or replace function public.enforce_featured_limit()
returns trigger language plpgsql as $$
declare
  current_count integer;
begin
  if new.featured and new.active then
    select count(*) into current_count
    from public.products
    where featured and active and id <> coalesce(new.id, gen_random_uuid());
    if current_count >= 4 then
      raise exception 'Maximum de 4 produits coups de coeur atteint';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_featured_limit
before insert or update of featured, active on public.products
for each row execute function public.enforce_featured_limit();
