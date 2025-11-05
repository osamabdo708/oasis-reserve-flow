-- Create public bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Anyone can upload product images" on storage.objects;

-- Allow public read access to product images
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow anyone to upload images to product-images bucket
create policy "Anyone can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images');