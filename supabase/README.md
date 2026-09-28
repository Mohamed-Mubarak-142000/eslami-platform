# Supabase setup (Al-Manara)

Project ref: `vdxxiiafwniikiitwzth`. Keys live in `.env.local` (git-ignored); see `.env.example`.

## 1. Database schema

Apply `migrations/20260928000001_init.sql` once. Use either:

- **SQL Editor** (Dashboard → SQL Editor → New query): paste the whole file and run it, or
- the **Supabase MCP** server in `.mcp.json` (authenticate with `claude /mcp` first).

## 2. Auth → URL configuration

- Site URL: the production origin (for example `https://your-domain`).
- Redirect URLs: `http://localhost:3000/auth/callback` and `https://your-domain/auth/callback`.

## 3. Auth → Email templates (6-digit codes)

The app verifies codes with `verifyOtp`, so each template must show `{{ .Token }}`, not a link.

| Template       | Subject                    |
| -------------- | -------------------------- |
| Confirm signup | كود تأكيد حسابك في المنارة |
| Reset password | كود استعادة كلمة المرور    |
| Magic link     | كود الدخول إلى المنارة     |

Body (same for all three, adjust the first line):

```html
<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;text-align:right">
  <h2>المنارة</h2>
  <p>استخدم هذا الكود لإكمال العملية:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;direction:ltr;text-align:center">{{ .Token }}</p>
  <p>الكود صالح لمدة ساعة. إن لم تطلبه فتجاهل هذه الرسالة.</p>
</div>
```

Also set Auth → Providers → Email → "Email OTP length" to **6**.

## 4. Custom SMTP (required for production)

The built-in mailer only sends a few emails per hour. Set Auth → SMTP settings with a provider
such as Resend (host `smtp.resend.com`, port 465, user `resend`, password = API key).

## 5. Google sign-in

Google Cloud Console → OAuth client (Web). Authorized redirect URI:
`https://vdxxiiafwniikiitwzth.supabase.co/auth/v1/callback`. Paste the client ID and secret in
Auth → Providers → Google.

## 6. First admin

After registering your own account, run once in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Further admins can be promoted from `/admin/users`.
