-- Use a short shared order reference for new orders; existing references stay valid.
create sequence if not exists public.order_number_seq;

do $$
declare
  v_existing_max bigint;
  v_sequence_value bigint;
  v_sequence_called boolean;
begin
  select max(substring(order_number from '^CB-([0-9]+)$')::bigint)
    into v_existing_max
  from public.orders;

  select last_value, is_called
    into v_sequence_value, v_sequence_called
  from public.order_number_seq;

  if v_existing_max is not null and v_existing_max > v_sequence_value then
    perform setval('public.order_number_seq', v_existing_max, true);
  elsif not v_sequence_called then
    perform setval('public.order_number_seq', 1, false);
  end if;
end;
$$;

create or replace function public.new_order_number()
returns text
language sql
volatile
set search_path = public
as $$
  select 'CB-' || lpad(nextval('public.order_number_seq')::text, 6, '0')
$$;
