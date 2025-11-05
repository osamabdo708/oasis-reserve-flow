-- Drop existing policies for both buckets
drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Anyone can upload product images" on storage.objects;
drop policy if exists "Public can view service images" on storage.objects;
drop policy if exists "Anyone can upload service images" on storage.objects;
drop policy if exists "Anyone can update service images" on storage.objects;
drop policy if exists "Anyone can update product images" on storage.objects;

-- Product images policies
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Anyone can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images');

create policy "Anyone can update product images"
on storage.objects for update
using (bucket_id = 'product-images');

-- Service images policies  
create policy "Public can view service images"
on storage.objects for select
using (bucket_id = 'service-images');

create policy "Anyone can upload service images"
on storage.objects for insert
with check (bucket_id = 'service-images');

create policy "Anyone can update service images"
on storage.objects for update
using (bucket_id = 'service-images');