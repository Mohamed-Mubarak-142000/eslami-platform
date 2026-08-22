"use client";
import { useState, type FormEvent } from "react";
import type { VerificationStatus } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button, TextField } from "@/components/ui";
import { StatusTimeline } from "@/components/patterns";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";

export function VerificationApplication({ status = "ready", onSubmit }: { status?: FeatureStatus; onSubmit?: (data: { specialty: string; credential: string }) => void }) {
  const t = useTranslations("verification");
  const [consent, setConsent] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); if (consent) onSubmit?.({ specialty: String(d.get("specialty") ?? ""), credential: String(d.get("credential") ?? "") }); }
  return <FeatureState status={status}><form aria-labelledby="verification-title" onSubmit={submit}><h1 id="verification-title">{t.applyTitle}</h1><TextField id="verification-specialty" name="specialty" label={t.specialtyLabel} required /><TextField id="verification-credential" name="credential" label={t.credentialLabel} required /><label><input type="checkbox" checked={consent} onChange={e => setConsent(e.currentTarget.checked)} /> {t.consent}</label><Button type="submit" disabled={!consent}>{t.submit}</Button></form></FeatureState>;
}
export function VerificationStatusView({ status, reason }: { status: VerificationStatus; reason?: string }) {
  const t = useTranslations("verification");
  const text = status === "pending" ? t.pending : status === "needs_info" ? t.needsInfo(reason ?? t.reviewFallback) : status === "approved" ? t.approved : t.fallback;
  return <section aria-labelledby="status-title"><h1 id="status-title">{t.statusTitle}</h1><p role="status">{text}</p><StatusTimeline items={[{ id: "verification", status, description: text, timestamp: "2026-08-22" }]} /></section>;
}
