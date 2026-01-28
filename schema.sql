-- ================================================================
-- 購物網站 完整資料庫 Schema
-- 最後更新: 2026-01-28
-- ================================================================
-- 使用方式：在 Supabase Dashboard → SQL Editor 中執行此腳本
-- 注意：此腳本設計為可重複執行（Idempotent）
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================================
-- 1. 資料表定義 (Table Definitions)
-- ================================================================

-- Products (商品)
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price integer not null,
  image_url text,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product Variants (規格庫存)
create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  size text not null, -- e.g. S, M, L
  stock integer default 0 not null,
  check (stock >= 0), -- Prevent negative stock
  unique(product_id, size)
);

-- Orders (訂單)
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id), -- Can be null for guest checkout
  customer_info jsonb not null default '{}'::jsonb, -- { name, phone, address, email, note, shipping_method }
  total_amount integer not null,
  status text not null default 'pending', -- pending, paid, shipped, completed, cancelled
  payment_note text, -- 客戶匯款帳號後5碼
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items (訂單明細)
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) not null,
  product_id uuid references public.products(id) not null,
  name_snapshot text not null,
  size_snapshot text not null,
  price_snapshot integer not null,
  quantity integer not null check (quantity > 0)
);

-- ================================================================
-- 2. 啟用 Row Level Security (RLS)
-- ================================================================

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ================================================================
-- 3. RLS 策略 (Policies)
-- ================================================================

-- 刪除既有策略 (避免重複錯誤)
drop policy if exists "Public Read Products" on public.products;
drop policy if exists "Public Read Variants" on public.product_variants;
drop policy if exists "Admin Insert Products" on public.products;
drop policy if exists "Admin Update Products" on public.products;
drop policy if exists "Admin Delete Products" on public.products;
drop policy if exists "Admin Insert Variants" on public.product_variants;
drop policy if exists "Admin Update Variants" on public.product_variants;
drop policy if exists "Admin Delete Variants" on public.product_variants;
drop policy if exists "User View Own Orders" on public.orders;
drop policy if exists "User View Own OrderItems" on public.order_items;
drop policy if exists "Auth All Products" on public.products;
drop policy if exists "Auth All Variants" on public.product_variants;
drop policy if exists "Admin All Orders" on public.orders;
drop policy if exists "Admin All Order Items" on public.order_items;

-- ----------------------------------------------------------------
-- 3.1 Products 策略
-- ----------------------------------------------------------------

-- 公開讀取 (所有人可以瀏覽商品)
create policy "Public Read Products" on public.products 
for select using (true);

-- 管理員完整權限 (登入用戶可新增/修改/刪除)
create policy "Auth All Products" on public.products
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3.2 Product Variants 策略
-- ----------------------------------------------------------------

-- 公開讀取
create policy "Public Read Variants" on public.product_variants 
for select using (true);

-- 管理員完整權限
create policy "Auth All Variants" on public.product_variants
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3.3 Orders 策略
-- ----------------------------------------------------------------

-- 管理員完整權限 (可查看與管理所有訂單)
create policy "Admin All Orders" on public.orders
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3.4 Order Items 策略
-- ----------------------------------------------------------------

-- 管理員完整權限
create policy "Admin All Order Items" on public.order_items
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ================================================================
-- 4. 核心邏輯：原子性結帳 RPC
-- ================================================================

create or replace function create_order(
  p_user_id uuid,
  p_customer_info jsonb,
  p_total_amount integer,
  p_items jsonb -- List of { variant_id, product_id, quantity, name, size, price }
)
returns uuid
language plpgsql
security definer -- 使用函數建立者權限執行 (繞過 RLS 以更新庫存)
as $$
declare
  new_order_id uuid;
  item jsonb;
  v_stock integer;
  v_variant_id uuid;
  v_qty integer;
begin
  -- 1. 建立訂單記錄
  insert into public.orders (user_id, customer_info, total_amount, status)
  values (p_user_id, p_customer_info, p_total_amount, 'pending')
  returning id into new_order_id;

  -- 2. 處理每個商品項目
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (item->>'variant_id')::uuid;
    v_qty := (item->>'quantity')::integer;

    -- 原子更新：僅在庫存足夠時扣減
    update public.product_variants
    set stock = stock - v_qty
    where id = v_variant_id and stock >= v_qty
    returning stock into v_stock;

    -- 如果沒有更新到任何列，表示庫存不足
    if v_stock is null then
      raise exception '庫存不足，規格 ID: %', v_variant_id;
    end if;

    -- 建立訂單明細 (快照)
    insert into public.order_items (
      order_id, variant_id, product_id,
      name_snapshot, size_snapshot, price_snapshot, quantity
    ) values (
      new_order_id,
      v_variant_id,
      (item->>'product_id')::uuid,
      item->>'name',
      item->>'size',
      (item->>'price')::integer,
      v_qty
    );
  end loop;

  return new_order_id;
end;
$$;

-- ================================================================
-- 5. Storage 設定 (商品圖片)
-- ================================================================

-- 建立 product-images bucket (公開)
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 公開讀取 Policy
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects 
for select using ( bucket_id = 'product-images' );

-- 登入用戶上傳 Policy
drop policy if exists "Auth Upload" on storage.objects;
create policy "Auth Upload" on storage.objects 
for insert with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

-- 登入用戶刪除 Policy (用於替換圖片)
drop policy if exists "Auth Delete" on storage.objects;
create policy "Auth Delete" on storage.objects 
for delete using ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

-- ================================================================
-- 完成！
-- ================================================================
