import { MessageCircle } from "lucide-react";
import "./twister-shell.css";

export interface StickyWhatsAppButtonProps {
  whatsappNumber?: string;
  /** Pre-filled greeting text, kept short and free of any order/customer data. */
  message?: string;
}

const defaultWhatsappNumber = "201233326848";

/**
 * Always-visible floating WhatsApp contact button (docs/ux/accessibility.md: sticky elements
 * never cover the last interactive element and never stack with the cart button in the same
 * corner — feature-ui-agent positions `StickyCartBar` alongside this, not on top of it).
 */
export function StickyWhatsAppButton({ whatsappNumber = defaultWhatsappNumber, message }: StickyWhatsAppButtonProps) {
  const href = message ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : `https://wa.me/${whatsappNumber}`;

  return (
    <a className="tw-sticky-whatsapp" href={href} target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا عبر واتساب">
      <MessageCircle aria-hidden size={26} />
    </a>
  );
}
