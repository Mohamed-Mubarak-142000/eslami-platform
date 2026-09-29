"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { isInAppBrowser, isIOS, openInRealBrowser } from "@/lib/browser";
import type { OAuthProvider } from "../oauth";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

const PROVIDERS: { id: OAuthProvider; label: string; logo: ReactNode }[] = [
  { id: "google", label: "المتابعة بحساب Google", logo: <GoogleLogo /> },
  // Hidden until the provider is switched on in Supabase; otherwise the button lands on a raw JSON error.
  ...(process.env.NEXT_PUBLIC_FACEBOOK_LOGIN === "1"
    ? [{ id: "facebook" as const, label: "المتابعة بحساب Facebook", logo: <FacebookLogo /> }]
    : []),
];

/**
 * Full-page links to /auth/oauth/<provider>. Google refuses to sign in inside an app's webview
 * (WhatsApp, Facebook, …), so there the Google link is opened in the phone's real browser instead.
 * Facebook's own login works in those webviews, so it stays put.
 */
export function SocialButtons({ next }: { next?: string | undefined }) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [leftApp, setLeftApp] = useState(false);

  // Coming back with the browser's back button restores this page from cache with the spinner still on.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => event.persisted && setPending(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label, logo }) => {
        const href = `/auth/oauth/${id}?next=${encodeURIComponent(next ?? "/dashboard")}`;
        return (
          <a
            key={id}
            href={href}
            aria-disabled={pending !== null}
            onClick={(event) => {
              if (pending) return event.preventDefault();
              if (id === "google" && isInAppBrowser()) {
                event.preventDefault();
                setLeftApp(true);
                openInRealBrowser(new URL(href, window.location.origin).toString());
                return;
              }
              setPending(id);
            }}
            className={buttonClass("outline", "lg", "w-full aria-disabled:opacity-50")}
          >
            {pending === id ? <Loader2 className="animate-spin" aria-hidden /> : logo}
            {label}
          </a>
        );
      })}
      {leftApp && (
        <p role="status" className="rounded-2xl bg-white p-3 text-sm leading-relaxed text-muted">
          فتحنا {isIOS() ? "Safari" : "Chrome"} لإكمال الدخول بحساب Google. إن لم يُفتح، اضغط على قائمة ⋮ أعلى الشاشة واختر «فتح في
          المتصفح»، أو ادخل بحساب Facebook أو بكلمة المرور أو بكود على البريد.
        </p>
      )}
    </div>
  );
}
