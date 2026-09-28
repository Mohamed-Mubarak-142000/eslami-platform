-- auth.users already rejects a second account with the same email; this mirrors that guarantee
-- on profiles, which the app uses to look accounts up by email (case-insensitive).
create unique index profiles_email_unique on public.profiles (lower(email)) where email is not null;
