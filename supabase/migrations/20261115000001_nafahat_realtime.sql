-- Live "نفحات المنارة": open pages of the website hear a new post the moment the admin publishes it (the
-- dialog pops up, the channel appends it) and a deleted one disappears. Supabase Realtime only streams
-- tables in its publication; reads still go through the table's RLS ("nafahat: read all").

do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'nafahat'
  ) then
    alter publication supabase_realtime add table public.nafahat;
  end if;
end
$$;
