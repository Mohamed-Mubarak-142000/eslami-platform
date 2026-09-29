"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Download, Ellipsis, ExternalLink, Share, SquarePlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import {
  dismissInstallArrival,
  installLink,
  isIOS,
  isIOSChrome,
  openInBrowser,
  promptInstall,
  registerServiceWorker,
  useInstallArrival,
  useInstallMode,
  type InstallMode,
} from "./install-store";

type Props = {
  /** "compact" is the header pill; "block" is the full-width row in the mobile drawer. */
  variant?: "compact" | "block";
  className?: string;
  onDone?: () => void;
};

/** Shown only where installing is possible, or where one step (leaving an in-app browser) makes it possible. */
export function InstallAppButton({ variant = "compact", className, onDone }: Props) {
  const mode = useInstallMode();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(registerServiceWorker, []);

  // Arriving from our "open in browser" link: show the steps straight away. Only the header
  // instance does this, so the drawer's copy never opens a second dialog.
  const arrived = useInstallArrival() && variant === "compact" && (mode === "ios" || mode === "prompt");
  const open = helpOpen || arrived;
  const close = () => {
    setHelpOpen(false);
    dismissInstallArrival();
  };

  if (mode === "installed" || mode === "unsupported") return null;

  const onClick = async () => {
    if (mode === "prompt") {
      await promptInstall();
      onDone?.();
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="ثبّت التطبيق"
        className={variant === "block" ? buttonClass("gold", "md", cn("w-full", className)) : buttonClass("gold", "sm", className)}
      >
        <Download aria-hidden />
        <span className={variant === "compact" ? "hidden sm:inline" : undefined}>ثبّت التطبيق</span>
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <InstallDialog
              mode={mode}
              onClose={close}
              onInstalled={() => {
                close();
                onDone?.();
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

function InstallDialog({ mode, onClose, onInstalled }: { mode: InstallMode; onClose: () => void; onInstalled: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 bg-emerald-night/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="relative m-3 w-full max-w-sm rounded-3xl bg-ivory p-6 shadow-lift"
        style={{ marginBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full hover:bg-emerald-mist"
        >
          <X className="size-5" aria-hidden />
          <span className="sr-only">إغلاق</span>
        </button>
        {mode === "in-app" ? <OpenInBrowser /> : mode === "prompt" ? <PromptNow onInstalled={onInstalled} /> : <IosSteps />}
      </motion.div>
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 id="install-title" className="pe-10 text-lg font-bold text-ink">
      {children}
    </h2>
  );
}

function Step({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-mist text-gold-deep [&_svg]:size-5">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

/** Facebook, Instagram and friends can't add to the home screen, so first hop to the real browser. */
function OpenInBrowser() {
  const [copied, setCopied] = useState(false);
  const browser = isIOS() ? "Safari" : "Chrome";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installLink());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Title>افتح المنارة في {browser} أولًا</Title>
      <p className="mt-2 text-sm text-muted">
        أنت تتصفح من داخل تطبيق آخر، والتثبيت يعمل من المتصفح فقط. بعد الفتح ستظهر لك خطوات التثبيت مباشرة.
      </p>
      <button type="button" onClick={openInBrowser} className={buttonClass("gold", "md", "mt-5 w-full")}>
        <ExternalLink aria-hidden />
        افتح في {browser}
      </button>
      <button type="button" onClick={copy} className={buttonClass("outline", "md", "mt-2 w-full")}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "تم نسخ الرابط — الصقه في المتصفح" : "انسخ الرابط"}
      </button>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Ellipsis className="size-4 shrink-0" aria-hidden />
        لم يفتح؟ اضغط ⋯ أعلى الشاشة ثم «فتح في المتصفح».
      </p>
    </>
  );
}

function IosSteps() {
  const where = isIOSChrome() ? "بجانب شريط العنوان في الأعلى" : "في شريط Safari أسفل الشاشة";
  return (
    <>
      <Title>ثبّت المنارة على جهازك</Title>
      <ol className="mt-4 space-y-3 text-sm text-ink">
        <Step icon={<Share aria-hidden />}>اضغط زر المشاركة {where}</Step>
        <Step icon={<SquarePlus aria-hidden />}>اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة»</Step>
      </ol>
    </>
  );
}

/** Chromium only lets the install dialog open from a tap, so arriving visitors get one button to press. */
function PromptNow({ onInstalled }: { onInstalled: () => void }) {
  return (
    <>
      <Title>ثبّت المنارة على جهازك</Title>
      <p className="mt-2 text-sm text-muted">افتح المنارة من الشاشة الرئيسية كأي تطبيق، بدون متجر تطبيقات.</p>
      <button
        type="button"
        onClick={async () => {
          await promptInstall();
          onInstalled();
        }}
        className={buttonClass("gold", "md", "mt-5 w-full")}
      >
        <Download aria-hidden />
        ثبّت الآن
      </button>
    </>
  );
}
