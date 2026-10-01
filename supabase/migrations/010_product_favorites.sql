-- Customer favorites / likes. Adds only the data required for this feature.
create table if not exists public.product_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists product_favorites_product_idx on public.product_favorites(product_id, created_at desc);
alter table public.product_favorites enable row level security;
drop policy if exists "customers manage own product favorites" on public.product_favorites;
drop policy if exists "admins read product favorites" on public.product_favorites;
create policy "customers manage own product favorites" on public.product_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read product favorites" on public.product_favorites for select to authenticated using (public.is_admin());
grant select, insert, delete on public.product_favorites to authenticated;
