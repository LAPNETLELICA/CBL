-- Real, date-bounded offers and moderated customer feedback.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null unique references public.products(id) on delete cascade,
  sale_price_fcfa integer not null check (sale_price_fcfa > 0),
  primary key (promotion_id, product_id)
);
create index if not exists promotions_window_idx on public.promotions(active, starts_at, ends_at);
drop trigger if exists promotions_touch on public.promotions;
create trigger promotions_touch before update on public.promotions for each row execute function public.touch_updated_at();

create table if not exists public.site_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  status text not null default 'pending' check (status in ('pending', 'visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_reviews_created_idx on public.site_reviews(created_at desc);
drop trigger if exists site_reviews_touch on public.site_reviews;
create trigger site_reviews_touch before update on public.site_reviews for each row execute function public.touch_updated_at();

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.site_reviews enable row level security;

drop policy if exists "public read current promotions" on public.promotions;
drop policy if exists "staff manage promotions" on public.promotions;
drop policy if exists "public read current promotion products" on public.promotion_products;
drop policy if exists "staff manage promotion products" on public.promotion_products;
drop policy if exists "public read visible reviews" on public.site_reviews;
drop policy if exists "customers submit pending reviews" on public.site_reviews;
drop policy if exists "customers edit pending reviews" on public.site_reviews;
drop policy if exists "staff manage reviews" on public.site_reviews;
create policy "public read current promotions" on public.promotions for select to anon, authenticated
  using ((active and starts_at <= now() and ends_at > now()) or public.is_manager());
create policy "staff manage promotions" on public.promotions for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "public read current promotion products" on public.promotion_products for select to anon, authenticated
  using (exists (select 1 from public.promotions p where p.id = promotion_id and p.active and p.starts_at <= now() and p.ends_at > now()) or public.is_manager());
create policy "staff manage promotion products" on public.promotion_products for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "public read visible reviews" on public.site_reviews for select to anon, authenticated
  using (status = 'visible' or user_id = auth.uid() or public.is_manager());
create policy "customers submit pending reviews" on public.site_reviews for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "customers edit pending reviews" on public.site_reviews for update to authenticated
  using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'pending');
create policy "staff manage reviews" on public.site_reviews for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

grant select on public.promotions, public.promotion_products, public.site_reviews to anon, authenticated;
grant insert, update, delete on public.promotions, public.promotion_products to authenticated;
grant insert, update on public.site_reviews to authenticated;

drop trigger if exists audit_promotions_cms on public.promotions;
drop trigger if exists audit_reviews_cms on public.site_reviews;
create trigger audit_promotions_cms after insert or update or delete on public.promotions for each row execute function public.audit_cms_change();
create trigger audit_reviews_cms after insert or update or delete on public.site_reviews for each row execute function public.audit_cms_change();

-- Checkout recalculates an offer price on the server; browser-submitted prices are never trusted.
create or replace function public.audit_cms_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare row_data jsonb; entity text; label text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity := case tg_table_name when 'site_sections' then 'section' when 'site_articles' then 'article' when 'site_settings' then 'site_setting' when 'categories' then 'category' when 'site_reviews' then 'review' when 'promotions' then 'promotion' else 'product' end;
  label := coalesce(row_data->>'name', row_data->>'title', row_data->>'key', row_data->>'slug', row_data->>'rating', '');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'CMS_' || tg_op, entity, coalesce(row_data->>'id', row_data->>'key'), jsonb_build_object('label', label));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_contact_phone text,
  p_shipping_address text,
  p_delivery_area text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := public.new_order_number();
  v_delivery_fee integer;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total integer;
  v_effective_price integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Le panier est vide'; end if;
  if p_payment_method not in ('MOBILE_MONEY', 'CASH_ON_DELIVERY') then raise exception 'Mode de paiement non valide'; end if;
  select fee_fcfa into v_delivery_fee from public.delivery_zones where name = p_delivery_area and active = true;
  if v_delivery_fee is null then raise exception 'Zone de livraison non valide'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := greatest(0, coalesce((v_item->>'quantity')::integer, 0));
    if v_quantity <= 0 or v_quantity > 10 then raise exception 'Quantité non valide'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and active = true for update;
    if not found then raise exception 'Produit indisponible'; end if;
    if v_product.stock_quantity < v_quantity then raise exception 'Stock insuffisant pour %', v_product.name; end if;
    select pp.sale_price_fcfa into v_effective_price
      from public.promotion_products pp join public.promotions p on p.id = pp.promotion_id
      where pp.product_id = v_product.id and p.active and p.starts_at <= now() and p.ends_at > now()
      order by p.created_at desc limit 1;
    v_subtotal := v_subtotal + (coalesce(v_effective_price, v_product.price_fcfa) * v_quantity);
  end loop;

  v_total := v_subtotal + v_delivery_fee;
  insert into public.orders(id, order_number, user_id, customer_name, customer_email, contact_phone, shipping_address, delivery_area, delivery_fee_fcfa, subtotal_fcfa, total_fcfa, payment_method, payment_status, status)
  values(v_order_id, v_order_number, auth.uid(), trim(p_customer_name), lower(trim(p_customer_email)), trim(p_contact_phone), trim(p_shipping_address), p_delivery_area, v_delivery_fee, v_subtotal, v_total, p_payment_method,
    case when p_payment_method = 'CASH_ON_DELIVERY' then 'UNPAID'::public.payment_status else 'PENDING'::public.payment_status end, 'PENDING'::public.order_status);

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    select pp.sale_price_fcfa into v_effective_price
      from public.promotion_products pp join public.promotions p on p.id = pp.promotion_id
      where pp.product_id = v_product.id and p.active and p.starts_at <= now() and p.ends_at > now()
      order by p.created_at desc limit 1;
    insert into public.order_items(order_id, product_id, product_name, sku, quantity, unit_price_fcfa)
    values(v_order_id, v_product.id, v_product.name, v_product.sku, v_quantity, coalesce(v_effective_price, v_product.price_fcfa));
    update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
    insert into public.inventory_movements(product_id, delta, reason, reference_id, created_by) values(v_product.id, -v_quantity, 'ORDER_CREATED', v_order_id, auth.uid());
  end loop;
  insert into public.order_status_events(order_id, to_status, changed_by, note) values(v_order_id, 'PENDING', auth.uid(), 'Commande créée');
  return jsonb_build_object('orderNumber', v_order_number, 'status', 'PENDING',
    'paymentStatus', case when p_payment_method = 'CASH_ON_DELIVERY' then 'UNPAID' else 'PENDING' end,
    'totalFcfa', v_total,
    'paymentMessage', case when p_payment_method = 'MOBILE_MONEY' then 'Le paiement Mobile Money n’est pas encore disponible. Choisissez le paiement à la livraison.' else 'Paiement à la livraison.' end);
end;
$$;
grant execute on function public.create_order(text,text,text,text,text,text,jsonb) to anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['promotions','promotion_products','site_reviews'] loop
    if not exists (select 1 from pg_publication_tables pt where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
