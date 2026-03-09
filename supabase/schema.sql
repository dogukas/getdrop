-- ============================================================
-- DepoSaaS — Supabase SQL Schema
-- Supabase SQL Editor'da çalıştırın (sırayla)
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. BRANCHES (Şubeler) ───────────────────────────────────
create table if not exists public.branches (
    id   uuid primary key default uuid_generate_v4(),
    name text not null,
    created_at timestamptz not null default now()
);

-- ─── 2. PROFILES (Kullanıcı Profilleri) ─────────────────────
-- Supabase Auth'un auth.users tablosuyla ilişkili
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    name       text not null,
    email      text not null,
    role       text not null default 'viewer' check (role in ('admin','operator','viewer')),
    branch_id  uuid references public.branches(id),
    created_at timestamptz not null default now()
);

-- Yeni kullanıcı kaydında profil otomatik oluşsun
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.profiles (id, name, email, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'viewer')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ─── 3. PRODUCTS (Ürünler / Stok) ────────────────────────────
create table if not exists public.products (
    id         uuid primary key default uuid_generate_v4(),
    name       text not null,
    sku        text not null unique,
    stock      integer not null default 0,
    unit       text not null default 'adet',
    min_stock  integer not null default 10,
    branch_id  uuid references public.branches(id),
    created_at timestamptz not null default now()
);

-- ─── 4. ORDERS (Siparişler) ──────────────────────────────────
create table if not exists public.orders (
    id         uuid primary key default uuid_generate_v4(),
    order_no   text not null unique,
    customer   text not null,
    address    text,
    status     text not null default 'pending' check (status in ('pending','processing','completed','cancelled')),
    date       date not null default current_date,
    notes      text,
    branch_id  uuid references public.branches(id),
    created_by uuid references public.profiles(id),
    created_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id           uuid primary key default uuid_generate_v4(),
    order_id     uuid not null references public.orders(id) on delete cascade,
    product_name text not null,
    sku          text not null,
    quantity     integer not null default 1,
    unit_price   numeric(12,2) not null default 0
);

-- ─── 5. TRANSFERS (Transferler) ──────────────────────────────
create table if not exists public.transfers (
    id                uuid primary key default uuid_generate_v4(),
    transfer_no       text not null unique,
    source_warehouse  text not null,
    target_warehouse  text not null,
    status            text not null default 'pending' check (status in ('pending','in_transit','delivered','rejected')),
    planned_date      date not null,
    notes             text,
    branch_id         uuid references public.branches(id),
    created_by        uuid references public.profiles(id),
    created_at        timestamptz not null default now()
);

create table if not exists public.transfer_items (
    id           uuid primary key default uuid_generate_v4(),
    transfer_id  uuid not null references public.transfers(id) on delete cascade,
    product_name text not null,
    sku          text not null,
    quantity     integer not null default 1
);

-- ─── 6. SHIPMENTS (Sevkiyatlar) ──────────────────────────────
create table if not exists public.shipments (
    id            uuid primary key default uuid_generate_v4(),
    shipment_no   text not null unique,
    supplier      text not null,
    plate         text,
    driver        text,
    status        text not null default 'expected' check (status in ('expected','accepted','partial','rejected')),
    expected_date date not null,
    notes         text,
    branch_id     uuid references public.branches(id),
    created_by    uuid references public.profiles(id),
    created_at    timestamptz not null default now()
);

create table if not exists public.shipment_items (
    id           uuid primary key default uuid_generate_v4(),
    shipment_id  uuid not null references public.shipments(id) on delete cascade,
    product_name text not null,
    sku          text not null,
    expected_qty integer not null default 0,
    accepted_qty integer
);

-- ─── 7. ACTIVITY LOGS (Aktivite Kayıtları) ───────────────────
create table if not exists public.activity_logs (
    id         uuid primary key default uuid_generate_v4(),
    level      text not null check (level in ('success','warning','error','info')),
    title      text not null,
    description text not null,
    module     text not null check (module in ('OMS','Transfer','Sevkiyat','Stok','Sistem')),
    entity_id  text,
    entity_no  text,
    user_name  text,
    branch_id  uuid references public.branches(id),
    created_at timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────
alter table public.branches       enable row level security;
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.transfers      enable row level security;
alter table public.transfer_items enable row level security;
alter table public.shipments      enable row level security;
alter table public.shipment_items enable row level security;
alter table public.activity_logs  enable row level security;

-- Giriş yapmış kullanıcılar kendi branch verilerini okuyabilir
create policy "Authenticated read branches"
    on public.branches for select
    to authenticated using (true);

create policy "Authenticated read profiles"
    on public.profiles for select
    to authenticated using (true);

create policy "Authenticated read products"
    on public.products for select
    to authenticated using (true);

create policy "Authenticated manage products"
    on public.products for all
    to authenticated using (true);

create policy "Authenticated read orders"
    on public.orders for select
    to authenticated using (true);

create policy "Authenticated manage orders"
    on public.orders for all
    to authenticated using (true);

create policy "Authenticated read order_items"
    on public.order_items for select
    to authenticated using (true);

create policy "Authenticated manage order_items"
    on public.order_items for all
    to authenticated using (true);

create policy "Authenticated read transfers"
    on public.transfers for select
    to authenticated using (true);

create policy "Authenticated manage transfers"
    on public.transfers for all
    to authenticated using (true);

create policy "Authenticated read transfer_items"
    on public.transfer_items for select
    to authenticated using (true);

create policy "Authenticated manage transfer_items"
    on public.transfer_items for all
    to authenticated using (true);

create policy "Authenticated read shipments"
    on public.shipments for select
    to authenticated using (true);

create policy "Authenticated manage shipments"
    on public.shipments for all
    to authenticated using (true);

create policy "Authenticated read shipment_items"
    on public.shipment_items for select
    to authenticated using (true);

create policy "Authenticated manage shipment_items"
    on public.shipment_items for all
    to authenticated using (true);

create policy "Authenticated read activity_logs"
    on public.activity_logs for select
    to authenticated using (true);

create policy "Authenticated insert activity_logs"
    on public.activity_logs for insert
    to authenticated with check (true);

-- ─── REALTIME ────────────────────────────────────────────────
-- Supabase Dashboard > Database > Replication > Tables'da aktif edin:
-- orders, transfers, shipments, products, activity_logs

-- ─── ÖNERİLEN İLK VERİ (Branch) ─────────────────────────────
-- İlk şubeyi ekleyin (projeye göre düzenleyin):
insert into public.branches (name) values
    ('Merkez Depo'),
    ('Antalya Dağıtım'),
    ('Bursa Transfer')
on conflict do nothing;
