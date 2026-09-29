create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('store_manager', 'system_admin'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'system_admin', false)
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.visitor_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "public read categories" on public.categories for select to anon, authenticated
using (active or public.is_manager());
create policy "managers insert categories" on public.categories for insert to authenticated
with check (public.is_manager());
create policy "managers update categories" on public.categories for update to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy "managers delete categories" on public.categories for delete to authenticated
using (public.is_manager());

create policy "public read products" on public.products for select to anon, authenticated
using (active or public.is_manager());
create policy "managers insert products" on public.products for insert to authenticated
with check (public.is_manager());
create policy "managers update products" on public.products for update to authenticated
using (public.is_manager()) with check (public.is_manager());
create policy "managers delete products" on public.products for delete to authenticated
using (public.is_manager());

create policy "public read product images" on public.product_images for select to anon, authenticated using (true);
create policy "managers manage product images insert" on public.product_images for insert to authenticated with check (public.is_manager());
create policy "managers manage product images update" on public.product_images for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "managers manage product images delete" on public.product_images for delete to authenticated using (public.is_manager());

create policy "public read delivery zones" on public.delivery_zones for select to anon, authenticated using (active or public.is_manager());
create policy "managers manage delivery zones" on public.delivery_zones for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "customers read own orders staff read all" on public.orders for select to authenticated
using (user_id = auth.uid() or public.is_manager());
create policy "staff update orders" on public.orders for update to authenticated
using (public.is_manager()) with check (public.is_manager());

create policy "customers read own order items staff read all" on public.order_items for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_manager())));
create policy "staff read order events" on public.order_status_events for select to authenticated
using (public.is_manager() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "staff read inventory" on public.inventory_movements for select to authenticated using (public.is_manager());

create policy "staff manage suppliers" on public.suppliers for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "staff manage purchase orders" on public.purchase_orders for all to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "staff manage purchase items" on public.purchase_order_items for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "public read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "staff manage site settings" on public.site_settings for all to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "anonymous analytics insert" on public.visitor_events for insert to anon, authenticated with check (true);
create policy "staff analytics select" on public.visitor_events for select to authenticated using (public.is_manager());
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.is_admin());

revoke update on public.profiles from authenticated;
grant update(full_name, phone, avatar_url) on public.profiles to authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.delivery_zones, public.site_settings to anon, authenticated;
grant insert on public.visitor_events to anon, authenticated;
grant select, insert, update, delete on public.categories, public.products, public.product_images, public.delivery_zones, public.suppliers, public.purchase_orders, public.purchase_order_items, public.site_settings to authenticated;
grant select on public.orders, public.order_items, public.order_status_events, public.inventory_movements, public.visitor_events, public.audit_logs, public.profiles to authenticated;
grant update on public.orders to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "product images public read" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
create policy "staff upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_manager());
create policy "staff update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_manager()) with check (bucket_id = 'product-images' and public.is_manager());
create policy "staff delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_manager());
