import type { ReactNode } from "react";
import { Phone } from "lucide-react";

const DEVELOPER = "محمد مبارك";

// lucide-react dropped its brand icons, so these are drawn here in the same stroke style.
function BrandIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const LINKS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "https://www.facebook.com/mubarak142000",
    label: "فيسبوك",
    icon: (
      <BrandIcon>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </BrandIcon>
    ),
  },
  {
    href: "https://www.linkedin.com/in/mohamed-mubarak-142317215",
    label: "لينكدإن",
    icon: (
      <BrandIcon>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </BrandIcon>
    ),
  },
  {
    href: "https://www.instagram.com/mubarak142000/",
    label: "إنستغرام",
    icon: (
      <BrandIcon>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </BrandIcon>
    ),
  },
  {
    href: "https://wa.me/201050867135",
    label: "واتساب: 01050867135",
    icon: (
      <BrandIcon>
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9z" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
      </BrandIcon>
    ),
  },
  {
    href: "tel:+201050867135",
    label: "اتصال: 01050867135",
    icon: <Phone className="size-4" aria-hidden />,
  },
];

/** Footer line: who built the site, with their social links. */
export function DeveloperCredit() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-xs text-white/70">
        تصميم وتطوير <span className="font-bold text-gold-soft">{DEVELOPER}</span>
      </p>
      <ul className="flex items-center gap-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              {...(link.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={link.label}
              title={link.label}
              className="grid size-9 place-items-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-gold-soft hover:text-gold-soft"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
