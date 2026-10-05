-- Sponsor logos uploaded from /admin/sponsors. A public bucket: the website and the mobile app show the
-- logos by their public URL. Uploads and deletes go through the server with the service role after the
-- admin check (features/admin/sponsorActions.ts), so no storage.objects policies are needed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsors', 'sponsors', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
