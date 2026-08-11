-- Combined ecommerce migrations for project nmfxevjeqrduwxzhlykt
-- Paste into Supabase SQL Editor and Run, OR apply via: node apps/web/scripts/apply-migrations.mjs
begin;

-- ========== 20260322130000_init_ecommerce_schema.sql ==========
-- Complete ecommerce foundation schema for Supabase PostgreSQL
-- Non-destructive: create if not exists / do $$ for enums

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum (
    'super_admin', 'admin', 'manager', 'support', 'customer', 'delivery'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'payment_processing', 'paid', 'processing', 'shipped',
    'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending', 'processing', 'succeeded', 'failed', 'cancelled',
    'refunded', 'partially_refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum (
    'stripe', 'paypal', 'apple_pay', 'google_pay'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inventory_txn_type as enum (
    'adjustment', 'reserve', 'release', 'deduct', 'restock', 'return'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum (
    'in_app', 'email', 'sms', 'push'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Auth / RBAC / sessions
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  avatar_url text,
  locale text not null default 'en',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.app_role not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  refresh_token_hash text not null,
  user_agent text,
  ip_address text,
  device_name text,
  revoked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_user_roles_role on public.user_roles (role_id);
create index if not exists idx_device_sessions_user on public.device_sessions (user_id);
create index if not exists idx_device_sessions_expires on public.device_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories (id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  brand_id uuid references public.brands (id) on delete set null,
  base_price numeric(12, 2) not null check (base_price >= 0),
  compare_price numeric(12, 2) check (compare_price is null or compare_price >= 0),
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  currency text not null default 'USD',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  barcode text unique,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  compare_price numeric(12, 2),
  cost_price numeric(12, 2),
  options jsonb not null default '{}'::jsonb,
  weight_grams int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_active_featured on public.products (is_active, is_featured) where deleted_at is null;
create index if not exists idx_products_brand on public.products (brand_id);
create index if not exists idx_product_variants_product on public.product_variants (product_id);
create index if not exists idx_product_images_product on public.product_images (product_id);
create index if not exists idx_categories_parent on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  reserved int not null default 0 check (reserved >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now(),
  constraint inventory_reserved_lte_quantity check (reserved <= quantity)
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory (id) on delete cascade,
  type public.inventory_txn_type not null,
  quantity int not null,
  reason text,
  reference_id text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_txn_inventory on public.inventory_transactions (inventory_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Cart / wishlist / addresses / coupons
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value >= 0),
  min_order_amount numeric(12, 2),
  max_uses int,
  used_count int not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  guest_id text unique,
  coupon_id uuid references public.coupons (id) on delete set null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_chk check (user_id is not null or guest_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id, variant_id)
);

create index if not exists idx_cart_items_cart on public.cart_items (cart_id);
create index if not exists idx_addresses_user on public.addresses (user_id);
create index if not exists idx_coupons_active on public.coupons (is_active) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Orders / payments / refunds / subscriptions / invoices
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles (id),
  status public.order_status not null default 'pending',
  address_id uuid references public.addresses (id) on delete set null,
  coupon_id uuid references public.coupons (id) on delete set null,
  currency text not null default 'USD',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount_total numeric(12, 2) not null default 0 check (discount_total >= 0),
  tax_total numeric(12, 2) not null default 0 check (tax_total >= 0),
  shipping_total numeric(12, 2) not null default 0 check (shipping_total >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0),
  notes text,
  idempotency_key text unique,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  product_name text not null,
  variant_name text not null,
  sku text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider public.payment_provider not null,
  status public.payment_status not null default 'pending',
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  provider_payment_id text,
  provider_intent_id text,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  reason text,
  status public.payment_status not null default 'pending',
  provider_refund_id text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_subscription_id text,
  plan_code text not null,
  status public.subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  user_id uuid not null references public.profiles (id),
  order_id uuid unique references public.orders (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  status public.invoice_status not null default 'draft',
  pdf_url text,
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_created on public.orders (user_id, created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_payments_order on public.payments (order_id);
create index if not exists idx_payments_provider_id on public.payments (provider_payment_id);
create index if not exists idx_refunds_payment on public.refunds (payment_id);
create index if not exists idx_subscriptions_user on public.subscriptions (user_id);
create index if not exists idx_invoices_user on public.invoices (user_id);

-- ---------------------------------------------------------------------------
-- Reviews / notifications / chat / audit
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (product_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.reviews (product_id) where is_visible and deleted_at is null;
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'products', 'product_variants', 'categories', 'brands',
    'carts', 'cart_items', 'orders', 'payments', 'refunds', 'coupons',
    'subscriptions', 'invoices', 'reviews', 'conversations', 'device_sessions',
    'addresses'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;


-- ========== 20260322130100_rls_auth_rbac.sql ==========
-- RLS, auth helpers, and profile bootstrap for full ecommerce schema

create or replace function public.has_role(role_names public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any (role_names)
  );
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.code = permission_code
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin','admin','manager','support']::public.app_role[]);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_role_id uuid;
begin
  insert into public.profiles (id, email, first_name, last_name, locale)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  select id into customer_role_id from public.roles where name = 'customer' limit 1;
  if customer_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, customer_role_id)
    on conflict do nothing;
  end if;

  insert into public.wishlists (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Enable RLS on all public commerce tables
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.device_sessions enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.coupons enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
drop policy if exists profiles_select_own_or_staff on public.profiles;
create policy profiles_select_own_or_staff on public.profiles
for select to authenticated using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Roles / permissions
drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles for select to authenticated using (true);

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated on public.permissions for select to authenticated using (true);

drop policy if exists role_permissions_select_authenticated on public.role_permissions;
create policy role_permissions_select_authenticated on public.role_permissions for select to authenticated using (true);

drop policy if exists user_roles_select_own_or_staff on public.user_roles;
create policy user_roles_select_own_or_staff on public.user_roles
for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists user_roles_manage_staff on public.user_roles;
create policy user_roles_manage_staff on public.user_roles
for all to authenticated
using (public.has_permission('users:write'))
with check (public.has_permission('users:write'));

-- Device sessions
drop policy if exists device_sessions_own on public.device_sessions;
create policy device_sessions_own on public.device_sessions
for all to authenticated
using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

-- Catalog public read / staff write
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
for select to anon, authenticated using (deleted_at is null and is_active = true);
drop policy if exists categories_staff_write on public.categories;
create policy categories_staff_write on public.categories
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists brands_public_read on public.brands;
create policy brands_public_read on public.brands
for select to anon, authenticated using (deleted_at is null and is_active = true);
drop policy if exists brands_staff_write on public.brands;
create policy brands_staff_write on public.brands
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
for select to anon, authenticated using (deleted_at is null and is_active = true);
drop policy if exists products_staff_write on public.products;
create policy products_staff_write on public.products
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_public_read on public.product_categories for select to anon, authenticated using (true);
drop policy if exists product_categories_staff_write on public.product_categories;
create policy product_categories_staff_write on public.product_categories
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants
for select to anon, authenticated using (deleted_at is null and is_active = true);
drop policy if exists product_variants_staff_write on public.product_variants;
create policy product_variants_staff_write on public.product_variants
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images for select to anon, authenticated using (true);
drop policy if exists product_images_staff_write on public.product_images;
create policy product_images_staff_write on public.product_images
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists inventory_public_read on public.inventory;
create policy inventory_public_read on public.inventory for select to anon, authenticated using (true);
drop policy if exists inventory_staff_write on public.inventory;
create policy inventory_staff_write on public.inventory
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

drop policy if exists inventory_txn_staff_read on public.inventory_transactions;
create policy inventory_txn_staff_read on public.inventory_transactions for select to authenticated using (public.is_staff());
drop policy if exists inventory_txn_staff_write on public.inventory_transactions;
create policy inventory_txn_staff_write on public.inventory_transactions
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

-- Coupons
drop policy if exists coupons_public_read_active on public.coupons;
create policy coupons_public_read_active on public.coupons
for select to anon, authenticated using (deleted_at is null and is_active = true);
drop policy if exists coupons_staff_write on public.coupons;
create policy coupons_staff_write on public.coupons
for all to authenticated using (public.has_permission('products:write')) with check (public.has_permission('products:write'));

-- Carts / addresses / wishlists
drop policy if exists carts_owner_all on public.carts;
create policy carts_owner_all on public.carts
for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists cart_items_owner_all on public.cart_items;
create policy cart_items_owner_all on public.cart_items
for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff())))
with check (exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff())));

drop policy if exists addresses_owner_all on public.addresses;
create policy addresses_owner_all on public.addresses
for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists wishlists_owner_all on public.wishlists;
create policy wishlists_owner_all on public.wishlists
for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists wishlist_items_owner_all on public.wishlist_items;
create policy wishlist_items_owner_all on public.wishlist_items
for all to authenticated
using (exists (select 1 from public.wishlists w where w.id = wishlist_id and (w.user_id = auth.uid() or public.is_staff())))
with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and (w.user_id = auth.uid() or public.is_staff())));

-- Orders / payments
drop policy if exists orders_select_own_or_staff on public.orders;
create policy orders_select_own_or_staff on public.orders
for select to authenticated using (user_id = auth.uid() or public.has_permission('orders:read') or public.is_staff());
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders for insert to authenticated with check (user_id = auth.uid());
drop policy if exists orders_update_staff on public.orders;
create policy orders_update_staff on public.orders
for update to authenticated using (public.has_permission('orders:write')) with check (public.has_permission('orders:write'));

drop policy if exists order_items_select_own_or_staff on public.order_items;
create policy order_items_select_own_or_staff on public.order_items
for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_permission('orders:read') or public.is_staff())));
drop policy if exists order_items_insert_own on public.order_items;
create policy order_items_insert_own on public.order_items
for insert to authenticated
with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists order_status_history_select on public.order_status_history;
create policy order_status_history_select on public.order_status_history
for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_permission('orders:read') or public.is_staff())));
drop policy if exists order_status_history_staff_insert on public.order_status_history;
create policy order_status_history_staff_insert on public.order_status_history
for insert to authenticated with check (public.has_permission('orders:write'));

drop policy if exists payments_select_own_or_staff on public.payments;
create policy payments_select_own_or_staff on public.payments
for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));
drop policy if exists payments_staff_write on public.payments;
create policy payments_staff_write on public.payments
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists refunds_select_own_or_staff on public.refunds;
create policy refunds_select_own_or_staff on public.refunds
for select to authenticated
using (exists (
  select 1 from public.payments p
  join public.orders o on o.id = p.order_id
  where p.id = payment_id and (o.user_id = auth.uid() or public.is_staff())
));
drop policy if exists refunds_staff_write on public.refunds;
create policy refunds_staff_write on public.refunds
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions
for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists subscriptions_staff_write on public.subscriptions;
create policy subscriptions_staff_write on public.subscriptions
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists invoices_own on public.invoices;
create policy invoices_own on public.invoices
for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists invoices_staff_write on public.invoices;
create policy invoices_staff_write on public.invoices
for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Reviews / notifications / chat / audit
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
for select to anon, authenticated using (is_visible = true and deleted_at is null);
drop policy if exists reviews_owner_write on public.reviews;
create policy reviews_owner_write on public.reviews
for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists conversation_members_own on public.conversation_members;
create policy conversation_members_own on public.conversation_members
for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists conversations_member_select on public.conversations;
create policy conversations_member_select on public.conversations
for select to authenticated
using (exists (select 1 from public.conversation_members m where m.conversation_id = id and (m.user_id = auth.uid() or public.is_staff())));

drop policy if exists messages_member_select on public.messages;
create policy messages_member_select on public.messages
for select to authenticated
using (exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and (m.user_id = auth.uid() or public.is_staff())));
drop policy if exists messages_member_insert on public.messages;
create policy messages_member_insert on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);

drop policy if exists audit_logs_staff_read on public.audit_logs;
create policy audit_logs_staff_read on public.audit_logs for select to authenticated using (public.is_staff());
drop policy if exists audit_logs_staff_insert on public.audit_logs;
create policy audit_logs_staff_insert on public.audit_logs for insert to authenticated with check (public.is_staff());

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;


-- ========== 20260322130200_seed_dev_catalog.sql ==========
-- Development seed data ONLY (idempotent upserts).
-- Safe to re-run. Does not delete existing production-like user data.

-- Roles
insert into public.roles (name, description)
values
  ('super_admin', 'Full system access'),
  ('admin', 'Administrative access'),
  ('manager', 'Catalog and order management'),
  ('support', 'Customer support'),
  ('customer', 'Store customer'),
  ('delivery', 'Delivery agent')
on conflict (name) do update set description = excluded.description;

-- Permissions
insert into public.permissions (code, description)
values
  ('products:read', 'Read products'),
  ('products:write', 'Manage products'),
  ('orders:read', 'Read orders'),
  ('orders:write', 'Manage orders'),
  ('users:read', 'Read users'),
  ('users:write', 'Manage users'),
  ('analytics:read', 'Read analytics'),
  ('settings:write', 'Manage settings')
on conflict (code) do update set description = excluded.description;

-- Role permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'products:read','products:write','orders:read','orders:write','analytics:read'
)
where r.name = 'manager'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('orders:read','users:read')
where r.name = 'support'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('products:read','orders:read')
where r.name = 'customer'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'orders:read'
where r.name = 'delivery'
on conflict do nothing;

-- Categories
insert into public.categories (name, slug, description, image_url, sort_order)
values
  ('Electronics', 'electronics', 'Phones, laptops, and audio gear', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', 1),
  ('Home & Living', 'home-living', 'Furniture and everyday essentials', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', 2),
  ('Fashion', 'fashion', 'Apparel and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', 3)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    is_active = true,
    deleted_at = null;

-- Brands
insert into public.brands (name, slug)
values
  ('NovaTech', 'nova-tech'),
  ('Aether Home', 'aether-home'),
  ('Lumen Wear', 'lumen-wear')
on conflict (slug) do update
set name = excluded.name, is_active = true, deleted_at = null;

-- Products + variants + inventory + images
with catalog(name, slug, description, brand_slug, category_slug, price, compare_price, featured, image_url, sku, variant_name, stock, tags) as (
  values
    ('Nova Wireless Headphones', 'nova-wireless-headphones', 'Premium ANC headphones with 36-hour battery life.', 'nova-tech', 'electronics', 149.99::numeric, 199.99::numeric, true, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'NOVA-WH-001', 'Black', 120, ARRAY['audio','wireless','featured']::text[]),
    ('Nova Ultra Laptop 14', 'nova-ultra-laptop-14', 'Lightweight laptop for creators with OLED display.', 'nova-tech', 'electronics', 1299.00::numeric, 1499.00::numeric, true, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 'NOVA-LT-014', 'Silver', 45, ARRAY['laptop','featured']::text[]),
    ('Nova City Smartphone', 'nova-city-smartphone', 'Flagship camera phone with all-day battery.', 'nova-tech', 'electronics', 899.00::numeric, 999.00::numeric, true, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', 'NOVA-PH-090', 'Graphite', 80, ARRAY['phone','camera']::text[]),
    ('Nova Desktop Monitor 27', 'nova-desktop-monitor-27', '4K IPS monitor with USB-C docking.', 'nova-tech', 'electronics', 449.00::numeric, 529.00::numeric, false, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 'NOVA-MN-027', 'Black', 60, ARRAY['monitor','desk']::text[]),
    ('Aether Ceramic Pour-Over Set', 'aether-ceramic-pour-over-set', 'Handcrafted ceramic coffee kit for slow mornings.', 'aether-home', 'home-living', 68.00::numeric, 85.00::numeric, true, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 'AETH-CF-001', 'Stone', 95, ARRAY['coffee','kitchen']::text[]),
    ('Aether Linen Bedding Bundle', 'aether-linen-bedding-bundle', 'Breathable European linen sheets in soft earth tones.', 'aether-home', 'home-living', 189.00::numeric, 240.00::numeric, false, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', 'AETH-BD-QUEEN', 'Sand', 40, ARRAY['bedding','linen']::text[]),
    ('Aether Modular Desk Lamp', 'aether-modular-desk-lamp', 'Warm LED lamp with adjustable arms and USB-C.', 'aether-home', 'home-living', 79.00::numeric, 99.00::numeric, true, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'AETH-LP-02', 'Oak', 110, ARRAY['lighting','desk']::text[]),
    ('Aether Scented Candle Trio', 'aether-scented-candle-trio', 'Soy wax candles with cedar, citrus, and amber notes.', 'aether-home', 'home-living', 42.00::numeric, 55.00::numeric, false, 'https://images.unsplash.com/photo-1603006905004-042704085891?w=800', 'AETH-CD-3', 'Assorted', 150, ARRAY['home','gift']::text[]),
    ('Lumen Merino Crew Sweater', 'lumen-merino-crew-sweater', 'Ultra-soft merino sweater for year-round layering.', 'lumen-wear', 'fashion', 118.00::numeric, 145.00::numeric, true, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', 'LUM-SW-M', 'Navy / M', 70, ARRAY['apparel','merino']::text[]),
    ('Lumen Everyday Sneakers', 'lumen-everyday-sneakers', 'Minimal leather sneakers with cushioned soles.', 'lumen-wear', 'fashion', 135.00::numeric, 160.00::numeric, true, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', 'LUM-SN-42', 'White / 42', 88, ARRAY['shoes','featured']::text[]),
    ('Lumen Crossbody Bag', 'lumen-crossbody-bag', 'Compact leather bag with RFID-safe pocket.', 'lumen-wear', 'fashion', 96.00::numeric, 120.00::numeric, false, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 'LUM-BG-01', 'Cognac', 55, ARRAY['bag','leather']::text[]),
    ('Lumen Aviator Sunglasses', 'lumen-aviator-sunglasses', 'Polarized lenses with lightweight titanium frame.', 'lumen-wear', 'fashion', 89.00::numeric, 110.00::numeric, false, 'https://images.unsplash.com/photo-1511499767150-a48a237ac008?w=800', 'LUM-SG-AV', 'Gold', 100, ARRAY['accessories','summer']::text[])
)
insert into public.products (
  name, slug, description, brand_id, base_price, compare_price, is_featured, is_active, tags
)
select
  c.name,
  c.slug,
  c.description,
  b.id,
  c.price,
  c.compare_price,
  c.featured,
  true,
  c.tags
from catalog c
join public.brands b on b.slug = c.brand_slug
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    brand_id = excluded.brand_id,
    base_price = excluded.base_price,
    compare_price = excluded.compare_price,
    is_featured = excluded.is_featured,
    is_active = true,
    tags = excluded.tags,
    deleted_at = null;

insert into public.product_categories (product_id, category_id)
select p.id, cat.id
from public.products p
join (
  values
    ('nova-wireless-headphones', 'electronics'),
    ('nova-ultra-laptop-14', 'electronics'),
    ('nova-city-smartphone', 'electronics'),
    ('nova-desktop-monitor-27', 'electronics'),
    ('aether-ceramic-pour-over-set', 'home-living'),
    ('aether-linen-bedding-bundle', 'home-living'),
    ('aether-modular-desk-lamp', 'home-living'),
    ('aether-scented-candle-trio', 'home-living'),
    ('lumen-merino-crew-sweater', 'fashion'),
    ('lumen-everyday-sneakers', 'fashion'),
    ('lumen-crossbody-bag', 'fashion'),
    ('lumen-aviator-sunglasses', 'fashion')
) map(product_slug, category_slug) on map.product_slug = p.slug
join public.categories cat on cat.slug = map.category_slug
on conflict do nothing;

insert into public.product_images (product_id, url, alt_text, sort_order, is_primary)
select p.id, imgs.url, p.name, 0, true
from public.products p
join (
  values
    ('nova-wireless-headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'),
    ('nova-ultra-laptop-14', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'),
    ('nova-city-smartphone', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'),
    ('nova-desktop-monitor-27', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'),
    ('aether-ceramic-pour-over-set', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'),
    ('aether-linen-bedding-bundle', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'),
    ('aether-modular-desk-lamp', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'),
    ('aether-scented-candle-trio', 'https://images.unsplash.com/photo-1603006905004-042704085891?w=800'),
    ('lumen-merino-crew-sweater', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'),
    ('lumen-everyday-sneakers', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'),
    ('lumen-crossbody-bag', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'),
    ('lumen-aviator-sunglasses', 'https://images.unsplash.com/photo-1511499767150-a48a237ac008?w=800')
) imgs(product_slug, url) on imgs.product_slug = p.slug
where not exists (
  select 1 from public.product_images pi where pi.product_id = p.id and pi.is_primary = true
);

insert into public.product_variants (product_id, sku, name, price, compare_price, options, is_active)
select
  p.id,
  v.sku,
  v.variant_name,
  v.price,
  v.compare_price,
  jsonb_build_object('label', v.variant_name),
  true
from (
  values
    ('nova-wireless-headphones', 'NOVA-WH-001', 'Black', 149.99, 199.99),
    ('nova-ultra-laptop-14', 'NOVA-LT-014', 'Silver', 1299.00, 1499.00),
    ('nova-city-smartphone', 'NOVA-PH-090', 'Graphite', 899.00, 999.00),
    ('nova-desktop-monitor-27', 'NOVA-MN-027', 'Black', 449.00, 529.00),
    ('aether-ceramic-pour-over-set', 'AETH-CF-001', 'Stone', 68.00, 85.00),
    ('aether-linen-bedding-bundle', 'AETH-BD-QUEEN', 'Sand', 189.00, 240.00),
    ('aether-modular-desk-lamp', 'AETH-LP-02', 'Oak', 79.00, 99.00),
    ('aether-scented-candle-trio', 'AETH-CD-3', 'Assorted', 42.00, 55.00),
    ('lumen-merino-crew-sweater', 'LUM-SW-M', 'Navy / M', 118.00, 145.00),
    ('lumen-everyday-sneakers', 'LUM-SN-42', 'White / 42', 135.00, 160.00),
    ('lumen-crossbody-bag', 'LUM-BG-01', 'Cognac', 96.00, 120.00),
    ('lumen-aviator-sunglasses', 'LUM-SG-AV', 'Gold', 89.00, 110.00)
) v(product_slug, sku, variant_name, price, compare_price)
join public.products p on p.slug = v.product_slug
on conflict (sku) do update
set name = excluded.name,
    price = excluded.price,
    compare_price = excluded.compare_price,
    is_active = true,
    deleted_at = null;

insert into public.inventory (variant_id, quantity, reserved, low_stock_threshold)
select pv.id, stock.qty, 0, 5
from public.product_variants pv
join (
  values
    ('NOVA-WH-001', 120),
    ('NOVA-LT-014', 45),
    ('NOVA-PH-090', 80),
    ('NOVA-MN-027', 60),
    ('AETH-CF-001', 95),
    ('AETH-BD-QUEEN', 40),
    ('AETH-LP-02', 110),
    ('AETH-CD-3', 150),
    ('LUM-SW-M', 70),
    ('LUM-SN-42', 88),
    ('LUM-BG-01', 55),
    ('LUM-SG-AV', 100)
) stock(sku, qty) on stock.sku = pv.sku
on conflict (variant_id) do update
set quantity = excluded.quantity,
    reserved = 0,
    updated_at = now();

commit;

