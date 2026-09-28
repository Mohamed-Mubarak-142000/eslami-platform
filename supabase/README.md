# Supabase setup (Al-Manara)

Project ref: `vdxxiiafwniikiitwzth`. Keys live in `.env.local` (git-ignored); see `.env.example`.

## 1. Database schema

Apply `migrations/20260928000001_init.sql` once. Use either:

- **SQL Editor** (Dashboard → SQL Editor → New query): paste the whole file and run it, or
- the **Supabase MCP** server in `.mcp.json` (authenticate with `claude /mcp` first).

## 2. Auth → URL configuration

- Site URL: the production origin (for example `https://your-domain`).
- Redirect URLs: `http://localhost:3000/auth/callback` and `https://your-domain/auth/callback`.

## 3. Email codes (OTP)

The app sends its own 6-digit codes (signup, password reset, code sign-in) over SMTP from
`src/lib/mail/smtp.ts` — Supabase's mailer and email templates are not used. Codes are stored
only as HMAC hashes in `public.email_otps` (migration `20260928000002_email_otps.sql`), expire
after 15 minutes, allow 5 attempts, and can be resent once a minute.

Set in `.env.local` and in Vercel → Settings → Environment Variables:

- `SMTP_USER` — the Gmail address that sends the codes.
- `SMTP_PASS` — a Gmail **App Password** (Google Account → Security → 2-Step Verification →
  App passwords), not the account password.

Gmail allows about 500 emails a day from a personal account.

## 4. Google sign-in

Google Cloud Console → OAuth client (Web). Authorized redirect URI:
`https://vdxxiiafwniikiitwzth.supabase.co/auth/v1/callback`. Paste the client ID and secret in
Auth → Providers → Google.

## 5. First admin

After registering your own account, run once in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Further admins can be promoted from `/admin/users`.
