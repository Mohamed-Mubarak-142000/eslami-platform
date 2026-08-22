"use client";
import { useState, type FormEvent } from "react";
import type { Question, QuestionVisibility, Source } from "@/domain";
import { useTranslations } from "@/i18n/LocaleProvider";
import { Button, TextField } from "@/components/ui";
import { AsyncAction, OpinionGroup, SourceCitation, StatusTimeline, type AsyncActionState } from "@/components/patterns";
import { FeatureState, type FeatureStatus } from "../shared/FeatureState";

export interface QuestionDraft { title: string; details: string; specialtyId: string; visibility: QuestionVisibility }
export function AskQuestion({ status = "ready", onSubmit }: { status?: FeatureStatus; onSubmit?: (draft: QuestionDraft) => void }) {
  const t = useTranslations("questions");
  const [visibility, setVisibility] = useState<QuestionVisibility>("public");
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); onSubmit?.({ title: String(d.get("title") ?? ""), details: String(d.get("details") ?? ""), specialtyId: String(d.get("specialty") ?? ""), visibility }); }
  return <FeatureState status={status}><form aria-labelledby="ask-title" onSubmit={submit}><h1 id="ask-title">{t.askTitle}</h1><TextField id="question-title" name="title" label={t.titleLabel} required /><label htmlFor="question-details">{t.detailsLabel}</label><textarea id="question-details" name="details" required /><TextField id="question-specialty" name="specialty" label={t.specialtyLabel} required /><fieldset><legend>{t.visibilityLegend}</legend><label><input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} />{t.public}</label><label><input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} />{t.private}</label></fieldset><aside role="note">{visibility === "public" ? t.publicNote : t.privateNote}<br />{t.noPiiNote}</aside><Button type="submit">{t.submit}</Button></form></FeatureState>;
}

export function QuestionDetail({ question, privateAccess = true, sources = [] }: { question: Question; privateAccess?: boolean; sources?: readonly Source[] }) {
  const t = useTranslations("questions");
  if (question.visibility === "private" && !privateAccess) return <FeatureState status="privacy"><span /></FeatureState>;
  return <article aria-labelledby="question-title"><p>{question.visibility === "private" ? t.privateQuestion : t.publicQuestion}</p><h1 id="question-title">{question.title}</h1><p>{question.details}</p><StatusTimeline items={[{ id: "current", status: question.status, description: t.currentStatus, timestamp: "2026-08-22" }]} />{sources.length > 0 && <OpinionGroup id="opinion-1" label={t.verifiedOpinionLabel} summary={t.verifiedOpinionSummary} evidence={sources.map((s, i) => <SourceCitation key={s.id} index={i + 1} type={s.type} title={s.title} />)} />}</article>;
}

export function AnswerEditor({ permission = true, state = "idle", onSubmit }: { permission?: boolean; state?: AsyncActionState; onSubmit?: (answer: string) => void }) {
  const t = useTranslations("questions");
  const [answer, setAnswer] = useState("");
  if (!permission) return <FeatureState status="permission"><span /></FeatureState>;
  return <section aria-labelledby="answer-title"><h1 id="answer-title">{t.answerTitle}</h1><label htmlFor="answer-body">{t.answerLabel}</label><textarea id="answer-body" value={answer} onChange={e => setAnswer(e.currentTarget.value)} /><p>{t.answerNote}</p><AsyncAction state={state} label={t.answerAction} {...(state === "uncertain" ? { message: t.answerUncertain } : {})} onAction={() => onSubmit?.(answer)} /></section>;
}
