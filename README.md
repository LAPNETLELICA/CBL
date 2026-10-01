# Christ Béni Commerce Suite — Supabase Frontend Edition

This rebuild removes the Java/Spring API, local PostgreSQL application backend, Flutter manager, Nginx gateway and Docker Compose application stack. Supabase is the single backend platform. The repository contains three web frontends:

| App | Purpose | Default dev port |
| --- | --- | ---: |
| `storefront/` | Public selling website, cart, OTP customer account, profile, checkout and public order tracking | 3000 |
| `manager-web/` | Store manager website: dashboard, products/descriptions/photos, stock, orders, suppliers and public content | 3001 |
| `admin-web/` | System/developer admin: users/roles, catalogue supervision, orders, system settings and audit | 3002 |

`supabase/migrations/` contains the database schema, RLS/storage policies, transactional order functions and the starter catalogue derived from the original project.

## What was removed

There is no `backend/`, no Maven/Spring Boot service, no Flutter `management_app/`, no application PostgreSQL container, no Nginx dependency, and no `NEXT_PUBLIC_API_URL`. Browser code uses only the Supabase publishable key. **Never expose a Supabase secret/service-role key to client code or through a `NEXT_PUBLIC_` variable.**

## 1. Create a Supabase project

Create a Supabase project, then open the SQL editor and apply these files in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls_and_storage.sql`
3. `supabase/migrations/003_business_functions.sql`
4. `supabase/migrations/004_seed_catalog.sql`
5. `supabase/migrations/005_content_management.sql`
6. `supabase/migrations/006_promotions_reviews.sql`
7. `supabase/migrations/007_customer_review_access.sql`

The migrations create Auth-linked profiles, roles, catalogue, stock, product images, orders, order history, suppliers, purchasing data, CMS values, editable site sections/articles, analytics, Storage policies and audit logs. Apply migrations 005, 006, and 007 in order to existing projects before using the expanded admin dashboard and customer review history.

## 2. Configure OTP

In Supabase Auth configure the email provider and/or an SMS provider. The three apps use OTP/passwordless sign-in. New accounts are created with role `customer` by default.

### First system administrator

Create the first account through OTP, then run this one-time SQL from the Supabase SQL editor (replace the email):

```sql
update public.profiles
set role = 'system_admin'
where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
```

After that, the System Admin website can promote a normal OTP account to `store_manager` or `system_admin` through the secure `admin_set_user_role` RPC.

## 3. Environment variables

Create `.env.local` in each app:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

For `admin-web` only, administrator invitations/removal also need `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Copy the value from Supabase server secrets; never prefix it with `NEXT_PUBLIC_`, and never add it to `storefront` or `manager-web`. The admin invitation API authenticates the current administrator before using this server-only key.

## 4. Install and run

```bash
./scripts/install-all.sh
```

Then use three terminals:

```bash
cd storefront && npm run dev
cd manager-web && npm run dev
cd admin-web && npm run dev
```

Open:

- Storefront: `http://localhost:3000`
- Store Manager: `http://localhost:3001`
- System Admin: `http://localhost:3002`

The admin dashboard includes a **Voir le site** link. On the storefront, signed-in store managers and system administrators see **Retour à l’administration**; customers do not. For deployed apps, set `NEXT_PUBLIC_STOREFRONT_URL` in `admin-web` and `NEXT_PUBLIC_ADMIN_URL` / `NEXT_PUBLIC_MANAGER_URL` in `storefront` to their public addresses.

## Security model

The browser is not trusted for final stock or totals. `create_order` runs transactionally in Supabase Postgres, locks product rows, recalculates prices from the database, validates stock, creates immutable item snapshots and decrements stock. RLS controls public/customer/manager/admin access. `set_order_status` enforces allowed fulfillment transitions and restores stock on cancellation. Product-image writes require manager/admin rights in Supabase Storage.

Mobile Money integration is intentionally not faked. The current frontend creates a pending payment order. Connect the payment provider later with a Supabase Edge Function/webhook so signing keys remain server-side in Supabase rather than in a browser bundle.

## Design

The storefront preserves the original premium blurred-nature direction and adds more ambient motion, hover depth and luminous blue/pink accents. The Store Manager uses a soft glass commerce workspace. The System Admin uses a distinct dark developer/control-room interface so operational and platform administration are visually separated.

## Original conception

`docs/CONCEPTION-ORIGINAL.md` is retained only as the source specification used for this rebuild. `docs/CONCEPTION.md` documents the new Supabase architecture.
