-- Supporters: a user sends a donation by InstaPay from the mobile app, uploads the transfer screenshot,
-- and an admin approves or rejects it at /admin/supporters (features/admin/supporterActions.ts). Only
-- approved ones are shown, on the app's home screen, through the public_supporters view (name and
-- message only: never the amount, the receipt or who the user is).

create table public.supporters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- The name shown on the home screen; show_name = false shows "فاعل خير" instead.
  display_name text not null check (char_length(display_name) between 2 and 60),
  message text check (message is null or char_length(message) between 2 and 140),
  show_name boolean not null default true,
  amount integer not null check (amount between 1 and 1000000),
  -- The InstaPay name or number the money came from, so the admin can match the transfer.
  sender text not null check (char_length(sender) between 2 and 60),
  -- Path in the private donation_receipts bucket: "<user_id>/<uuid>.<ext>".
  receipt_path text not null check (char_length(receipt_path) between 3 and 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 200),
  reviewed_at timestamptz,
  thanked_at timestamptz,
  created_at timestamptz not null default now()
);
create index supporters_status_idx on public.supporters (status, created_at desc);
-- One request waiting for review per user at a time.
create unique index supporters_one_pending_idx on public.supporters (user_id) where status = 'pending';

alter table public.supporters enable row level security;

-- Users send their own request, always as pending and unreviewed; they can't change it afterwards.
create policy "supporters: insert own pending" on public.supporters for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending' and reviewed_at is null and thanked_at is null and reject_reason is null
    and receipt_path like auth.uid()::text || '/%'
  );
create policy "supporters: read own" on public.supporters for select to authenticated using (user_id = auth.uid());
create policy "supporters: admin read" on public.supporters for select to authenticated using (public.is_admin());
create policy "supporters: admin write" on public.supporters for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The public list: approved only, without the amount, the receipt or the user. Runs as its owner so
-- anonymous readers see these columns without any access to the table itself.
create view public.public_supporters with (security_invoker = off) as
  select id,
         case when show_name then display_name else 'فاعل خير' end as name,
         message,
         reviewed_at as approved_at
  from public.supporters
  where status = 'approved'
  order by reviewed_at desc nulls last;

revoke all on public.public_supporters from public;
grant select on public.public_supporters to anon, authenticated;

-- Transfer screenshots: private. Each user uploads into (and reads back) their own folder only; the
-- admin page reads them with short-lived signed URLs through the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('donation_receipts', 'donation_receipts', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "donation_receipts: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'donation_receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "donation_receipts: read own" on storage.objects for select to authenticated
  using (bucket_id = 'donation_receipts' and (storage.foldername(name))[1] = auth.uid()::text);
