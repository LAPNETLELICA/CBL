-- Extend the existing commerce CMS without changing profiles or authentication roles.
-- Keep the migration usable even when the earlier RLS helper functions are missing.
-- These definitions match migration 002 and do not change any profile rows or roles.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true
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

alter table public.products
  add column if not exists product_type text not null default 'standard',
  add column if not exists specifications jsonb not null default '{}'::jsonb;

alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('promo_banner', 'home_message', 'delivery_message', 'store_contact', 'branding', 'home_hero'));

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  layout text not null default 'cards' check (layout in ('cards', 'feature')),
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_articles (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.site_sections(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  image_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_articles_section_idx on public.site_articles(section_id, display_order);
drop trigger if exists site_sections_touch on public.site_sections;
drop trigger if exists site_articles_touch on public.site_articles;
create trigger site_sections_touch before update on public.site_sections for each row execute function public.touch_updated_at();
create trigger site_articles_touch before update on public.site_articles for each row execute function public.touch_updated_at();

alter table public.site_sections enable row level security;
alter table public.site_articles enable row level security;
drop policy if exists "public read active site sections" on public.site_sections;
drop policy if exists "admin manage site sections" on public.site_sections;
drop policy if exists "public read active site articles" on public.site_articles;
drop policy if exists "admin manage site articles" on public.site_articles;
create policy "public read active site sections" on public.site_sections for select to anon, authenticated
  using (active or public.is_admin());
create policy "admin manage site sections" on public.site_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "public read active site articles" on public.site_articles for select to anon, authenticated
  using ((active and exists(select 1 from public.site_sections s where s.id = section_id and s.active)) or public.is_admin());
create policy "admin manage site articles" on public.site_articles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.site_sections, public.site_articles to authenticated;
grant select on public.site_sections, public.site_articles to anon;


create or replace function public.audit_cms_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_data jsonb;
  entity text;
  label text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity := case tg_table_name when 'site_sections' then 'section' when 'site_articles' then 'article' when 'site_settings' then 'site_setting' when 'categories' then 'category' else 'product' end;
  label := coalesce(row_data->>'name', row_data->>'title', row_data->>'key', row_data->>'slug', '');
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values(auth.uid(), 'CMS_' || tg_op, entity, coalesce(row_data->>'id', row_data->>'key'), jsonb_build_object('label', label));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists audit_products_cms on public.products;
drop trigger if exists audit_categories_cms on public.categories;
drop trigger if exists audit_sections_cms on public.site_sections;
drop trigger if exists audit_articles_cms on public.site_articles;
drop trigger if exists audit_settings_cms on public.site_settings;
create trigger audit_products_cms after insert or update or delete on public.products for each row execute function public.audit_cms_change();
create trigger audit_categories_cms after insert or update or delete on public.categories for each row execute function public.audit_cms_change();
create trigger audit_sections_cms after insert or update or delete on public.site_sections for each row execute function public.audit_cms_change();
create trigger audit_articles_cms after insert or update or delete on public.site_articles for each row execute function public.audit_cms_change();
create trigger audit_settings_cms after insert or update or delete on public.site_settings for each row execute function public.audit_cms_change();


do $$
declare table_name text;
begin
  foreach table_name in array array['site_sections','site_articles','site_settings','products','categories','delivery_zones'] loop
    if not exists (
      select 1 from pg_publication_tables pt
      where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
