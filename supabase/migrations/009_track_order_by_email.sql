-- Order lookup uses the buyer email so the phone number is only requested at checkout.
drop function if exists public.track_order(text, text);

create function public.track_order(p_order_number text, p_customer_email text)
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
    and lower(o.customer_email) = lower(trim(p_customer_email))
  limit 1
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;
