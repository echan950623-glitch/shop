-- ================================================================
-- Migration For Multiple Product Images
-- ================================================================

-- 1. 建立商品圖片表 (一對多關係)
create table if not exists public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  url text not null,
  display_order integer default 0, -- 用來控制圖片順序 (0 是封面)
  created_at timestamp with time zone default now()
);

-- 2. 建立索引 (加快查詢速度)
create index if not exists idx_product_images_product_id on public.product_images(product_id);

-- 3. 設定 RLS 安全性策略 (同 Products 表)
alter table public.product_images enable row level security;

-- 刪除既有策略 (避免重複)
drop policy if exists "Public Read Images" on public.product_images;
drop policy if exists "Auth Manage Images" on public.product_images;

-- 所有人可讀
create policy "Public Read Images" on public.product_images 
  for select using (true);

-- 僅登入用戶(管理員)可寫入/刪除
create policy "Auth Manage Images" on public.product_images 
  for all using (auth.role() = 'authenticated');

-- 4. 遷移舊資料
-- 如果原本 products 表有 image_url，可以把它搬過來當作第一張圖 (display_order = 0)
insert into public.product_images (product_id, url, display_order)
select id, image_url, 0 
from public.products
where image_url is not null and image_url != ''
on conflict do nothing;
