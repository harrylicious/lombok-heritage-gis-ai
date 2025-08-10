-- Admin-only RLS extensions for CRUD where missing

-- cultural_sites: allow admin DELETE
create policy if not exists "Admins can delete sites"
on public.cultural_sites
for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- tourism_routes: allow admin UPDATE and DELETE
create policy if not exists "Admins can update routes"
on public.tourism_routes
for update
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can delete routes"
on public.tourism_routes
for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- cultural_practices: allow admin INSERT/UPDATE/DELETE
create policy if not exists "Admins can insert practices"
on public.cultural_practices
for insert
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can update practices"
on public.cultural_practices
for update
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can delete practices"
on public.cultural_practices
for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- historical_records: allow admin INSERT/UPDATE/DELETE
create policy if not exists "Admins can insert records"
on public.historical_records
for insert
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can update records"
on public.historical_records
for update
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can delete records"
on public.historical_records
for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- site_media: allow admin UPDATE/DELETE
create policy if not exists "Admins can update media"
on public.site_media
for update
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

create policy if not exists "Admins can delete media"
on public.site_media
for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);
