-- Let each signed-in customer see their own submitted feedback, including pending reviews.
drop policy if exists "public read visible reviews" on public.site_reviews;
create policy "public read visible reviews" on public.site_reviews for select to anon, authenticated
  using (status = 'visible' or user_id = auth.uid() or public.is_manager());


-- Customers can confirm receipt only for their own order currently out for delivery.
create or replace function public.customer_confirm_delivery(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into v_order
  from public.orders
  where id = p_order_id and user_id = auth.uid()
  for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if v_order.status <> 'OUT_FOR_DELIVERY' then raise exception 'Commande non éligible à la confirmation'; end if;

  update public.orders set status = 'DELIVERED' where id = p_order_id returning * into v_order;
  insert into public.order_status_events(order_id, from_status, to_status, changed_by, note)
  values(p_order_id, 'OUT_FOR_DELIVERY', 'DELIVERED', auth.uid(), 'Réception confirmée par le client');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'ORDER_STATUS_CHANGED', 'order', p_order_id::text,
    jsonb_build_object('from', 'OUT_FOR_DELIVERY', 'to', 'DELIVERED', 'label', v_order.order_number));
  return v_order;
end;
$$;
revoke all on function public.customer_confirm_delivery(uuid) from public, anon;
grant execute on function public.customer_confirm_delivery(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
