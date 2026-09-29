create or replace function public.new_order_number()
returns text
language plpgsql
volatile
as $$
begin
  return 'CB-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
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
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text := public.new_order_number();
  v_delivery_fee integer;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Le panier est vide';
  end if;

  if p_payment_method not in ('MOBILE_MONEY', 'CASH_ON_DELIVERY') then
    raise exception 'Mode de paiement non valide';
  end if;

  select fee_fcfa into v_delivery_fee
  from public.delivery_zones
  where name = p_delivery_area and active = true;
  if v_delivery_fee is null then
    raise exception 'Zone de livraison non valide';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(0, coalesce((v_item->>'quantity')::integer, 0));
    if v_quantity <= 0 or v_quantity > 10 then
      raise exception 'Quantité non valide';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and active = true
    for update;

    if not found then raise exception 'Produit indisponible'; end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'Stock insuffisant pour %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price_fcfa * v_quantity);
  end loop;

  v_total := v_subtotal + v_delivery_fee;

  insert into public.orders(
    id, order_number, user_id, customer_name, customer_email, contact_phone,
    shipping_address, delivery_area, delivery_fee_fcfa, subtotal_fcfa, total_fcfa,
    payment_method, payment_status, status
  ) values (
    v_order_id, v_order_number, auth.uid(), trim(p_customer_name), lower(trim(p_customer_email)), trim(p_contact_phone),
    trim(p_shipping_address), p_delivery_area, v_delivery_fee, v_subtotal, v_total,
    p_payment_method,
    case when p_payment_method = 'CASH_ON_DELIVERY' then 'UNPAID'::public.payment_status else 'PENDING'::public.payment_status end,
    'PENDING'::public.order_status
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;

    insert into public.order_items(order_id, product_id, product_name, sku, quantity, unit_price_fcfa)
    values(v_order_id, v_product.id, v_product.name, v_product.sku, v_quantity, v_product.price_fcfa);

    update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
    insert into public.inventory_movements(product_id, delta, reason, reference_id, created_by)
    values(v_product.id, -v_quantity, 'ORDER_CREATED', v_order_id, auth.uid());
  end loop;

  insert into public.order_status_events(order_id, to_status, changed_by, note)
  values(v_order_id, 'PENDING', auth.uid(), 'Commande créée');

  return jsonb_build_object(
    'orderNumber', v_order_number,
    'status', 'PENDING',
    'paymentStatus', case when p_payment_method = 'CASH_ON_DELIVERY' then 'UNPAID' else 'PENDING' end,
    'totalFcfa', v_total,
    'paymentMessage', case when p_payment_method = 'MOBILE_MONEY' then 'Paiement Mobile Money à connecter via une Supabase Edge Function fournisseur.' else 'Paiement à la livraison.' end
  );
end;
$$;

grant execute on function public.create_order(text,text,text,text,text,text,jsonb) to anon, authenticated;

create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'orderNumber', o.order_number,
    'status', o.status,
    'paymentStatus', o.payment_status,
    'updatedAt', o.updated_at,
    'estimatedDelivery', dz.delivery_window
  )
  from public.orders o
  left join public.delivery_zones dz on dz.name = o.delivery_area
  where upper(o.order_number) = upper(trim(p_order_number))
    and regexp_replace(o.contact_phone, '\\s', '', 'g') = regexp_replace(trim(p_phone), '\\s', '', 'g')
  limit 1
$$;

grant execute on function public.track_order(text,text) to anon, authenticated;

create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_previous public.order_status;
  v_allowed boolean := false;
begin
  if not public.is_manager() then raise exception 'Accès refusé'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Commande introuvable'; end if;
  v_previous := v_order.status;

  v_allowed :=
    (v_previous = 'PENDING' and p_status in ('CONFIRMED','CANCELLED')) or
    (v_previous = 'CONFIRMED' and p_status in ('PREPARING','CANCELLED')) or
    (v_previous = 'PREPARING' and p_status in ('OUT_FOR_DELIVERY','CANCELLED')) or
    (v_previous = 'OUT_FOR_DELIVERY' and p_status = 'DELIVERED') or
    (v_previous = p_status);

  if not v_allowed then raise exception 'Transition de statut non autorisée'; end if;
  if p_status = 'CONFIRMED' and v_order.payment_method = 'MOBILE_MONEY' and v_order.payment_status <> 'PAID' then
    raise exception 'Le paiement Mobile Money doit être PAID avant confirmation';
  end if;

  if p_status = 'CANCELLED' and v_previous <> 'CANCELLED' then
    update public.products p
    set stock_quantity = p.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id;

    insert into public.inventory_movements(product_id, delta, reason, reference_id, created_by)
    select oi.product_id, oi.quantity, 'ORDER_CANCELLED', p_order_id, auth.uid()
    from public.order_items oi where oi.order_id = p_order_id and oi.product_id is not null;
  end if;

  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  insert into public.order_status_events(order_id, from_status, to_status, changed_by, note)
  values(p_order_id, v_previous, p_status, auth.uid(), p_note);
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'ORDER_STATUS_CHANGED', 'order', p_order_id::text, jsonb_build_object('from', v_previous, 'to', p_status));
  return v_order;
end;
$$;

grant execute on function public.set_order_status(uuid,public.order_status,text) to authenticated;

create or replace function public.set_payment_status(p_order_id uuid, p_status public.payment_status)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_manager() then raise exception 'Accès refusé'; end if;
  update public.orders set payment_status = p_status where id = p_order_id returning * into v_order;
  if not found then raise exception 'Commande introuvable'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'PAYMENT_STATUS_CHANGED', 'order', p_order_id::text, jsonb_build_object('status', p_status));
  return v_order;
end;
$$;
grant execute on function public.set_payment_status(uuid,public.payment_status) to authenticated;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role, p_active boolean default true)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare v_profile public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  if p_user_id = auth.uid() and p_role <> 'system_admin' then raise exception 'Vous ne pouvez pas retirer votre propre rôle administrateur'; end if;
  update public.profiles set role = p_role, active = p_active where id = p_user_id returning * into v_profile;
  if not found then raise exception 'Profil introuvable'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'USER_ROLE_CHANGED', 'profile', p_user_id::text, jsonb_build_object('role', p_role, 'active', p_active));
  return v_profile;
end;
$$;
grant execute on function public.admin_set_user_role(uuid,public.app_role,boolean) to authenticated;

create or replace function public.receive_purchase_item(p_item_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_item public.purchase_order_items%rowtype;
begin
  if not public.is_manager() then raise exception 'Accès refusé'; end if;
  if p_quantity <= 0 then raise exception 'Quantité non valide'; end if;
  select * into v_item from public.purchase_order_items where id = p_item_id for update;
  if not found then raise exception 'Ligne introuvable'; end if;
  if v_item.received_quantity + p_quantity > v_item.quantity then raise exception 'Réception supérieure à la quantité commandée'; end if;
  update public.purchase_order_items set received_quantity = received_quantity + p_quantity where id = p_item_id;
  update public.products set stock_quantity = stock_quantity + p_quantity where id = v_item.product_id;
  insert into public.inventory_movements(product_id, delta, reason, reference_id, created_by)
  values(v_item.product_id, p_quantity, 'PURCHASE_RECEIPT', v_item.purchase_order_id, auth.uid());

  if not exists (
    select 1 from public.purchase_order_items
    where purchase_order_id = v_item.purchase_order_id and received_quantity < quantity
  ) then
    update public.purchase_orders set status = 'RECEIVED' where id = v_item.purchase_order_id;
  else
    update public.purchase_orders set status = 'PARTIALLY_RECEIVED' where id = v_item.purchase_order_id and status <> 'RECEIVED';
  end if;
end;
$$;
grant execute on function public.receive_purchase_item(uuid,integer) to authenticated;
