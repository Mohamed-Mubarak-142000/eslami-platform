"use client";
import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import { useTranslations } from "@/i18n/LocaleProvider";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";
export interface ReviewCase { id: string; status: string; priority: string; kind: "content" | "question" | "verification"; ageLabel: string; assignee?: string; version: number }
export function ModerationQueue({ cases, status = "ready", canModerate = true }: { cases: readonly ReviewCase[]; status?: FeatureStatus; canModerate?: boolean }) {
  const t = useTranslations("admin");
  if (!canModerate) return <FeatureState status="permission"><span /></FeatureState>;
  const actual = status === "ready" && cases.length === 0 ? "empty" : status;
  return <section aria-labelledby="queue-title"><h1 id="queue-title">{t.queueTitle}</h1><FeatureState status={actual}><table><caption>{t.queueCaption}</caption><thead><tr><th>{t.statusHeader}</th><th>{t.priorityHeader}</th><th>{t.kindHeader}</th><th>{t.ageHeader}</th><th>{t.assigneeHeader}</th></tr></thead><tbody>{cases.map(item => <tr key={item.id}><td><Badge>{item.status}</Badge></td><td>{item.priority}</td><td>{item.kind}</td><td>{item.ageLabel}</td><td>{item.assignee ?? t.unassigned}</td></tr>)}</tbody></table></FeatureState></section>;
}
export function ReviewDecision({ reviewCase, conflict = false, onDecision }: { reviewCase: ReviewCase; conflict?: boolean; onDecision?: (decision: string, reason: string, version: number) => void }) {
  const t = useTranslations("admin");
  const [reason, setReason] = useState("");
  if (conflict) return <FeatureState status="conflict"><span /></FeatureState>;
  return <section aria-labelledby="decision-title"><h1 id="decision-title">{t.decisionTitle}</h1><p>{t.version(reviewCase.version)}</p><label htmlFor="decision-reason">{t.reasonLabel}</label><textarea id="decision-reason" value={reason} onChange={e => setReason(e.currentTarget.value)} required /><p>{t.decisionNote}</p><Button disabled={!reason} onClick={() => onDecision?.("approve", reason, reviewCase.version)}>{t.approve}</Button></section>;
}
export function TaxonomyManager({ names, canEdit }: { names: readonly string[]; canEdit: boolean }) {
  const t = useTranslations("admin");
  return <section aria-labelledby="taxonomy-title"><h1 id="taxonomy-title">{t.taxonomyTitle}</h1>{!canEdit && <p role="status">{t.readOnlyNote}</p>}<ul>{names.map(name => <li key={name}>{name} <Button disabled={!canEdit} variant="secondary">{t.edit}</Button></li>)}</ul></section>;
}
