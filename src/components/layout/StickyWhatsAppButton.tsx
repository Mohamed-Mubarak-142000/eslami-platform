import { MessageCircle } from "lucide-react";
import "./site-shell.css";

export interface StickyWhatsAppButtonProps {
  /** No default on purpose — a placeholder number would silently look like a real contact channel. */
  whatsappNumber: string;
  /** Pre-filled greeting text, kept short and free of any personal data. */
  message?: string;
}

/** Always-visible floating WhatsApp contact button, shown only once a real number is supplied. */
export function StickyWhatsAppButton({ whatsappNumber, message }: StickyWhatsAppButtonProps) {
  const href = message ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : `https://wa.me/${whatsappNumber}`;

  return (
    <a className="site-sticky-whatsapp" href={href} target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا عبر واتساب">
      <MessageCircle aria-hidden size={26} />
    </a>
  );
}
