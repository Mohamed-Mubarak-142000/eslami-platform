"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Film, ImagePlus, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { Field, FormAlert } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { createNafhaAction, discardNafhaUploadAction } from "./actions";
import { NafhaCard } from "./NafhaCard";
import { NAFAHAT_BUCKET, NAFAHAT_MAX_BYTES, NAFAHAT_MEDIA_TYPES } from "./shared";

const ACCEPT = Object.keys(NAFAHAT_MEDIA_TYPES).join(",");

/**
 * Uploads straight from the browser to Supabase Storage (the admin's session passes the bucket's
 * "admin upload" policy). XHR rather than supabase-js, for the progress bar on large videos.
 */
async function uploadWithProgress(file: File, onProgress: (ratio: number) => void): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new Error("انتهت الجلسة، سجّل الدخول مرة أخرى.");

  const path = `${crypto.randomUUID()}.${NAFAHAT_MEDIA_TYPES[file.type]!.ext}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${NAFAHAT_BUCKET}/${path}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
  return path;
}

function checkFile(file: File): string | null {
  if (!NAFAHAT_MEDIA_TYPES[file.type]) return "الملف صورة (PNG أو JPG أو WebP) أو فيديو (MP4 أو MOV أو WebM)";
  if (file.size > NAFAHAT_MAX_BYTES) return "حجم الملف ٥٠ ميجابايت بحد أقصى";
  return null;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} ميجابايت`;

export function NafhaComposer() {
  const [state, dispatch, saving] = useActionState<FormState | undefined, FormData>(createNafhaAction, undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyId = useId();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // The path of the file already uploaded for this draft, so a retry after an error doesn't upload twice.
  const [uploaded, setUploaded] = useState<{ file: File; path: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  // Published: start a fresh draft (state adjusted during render, React's pattern for "reset on new result").
  const [handled, setHandled] = useState(state);
  const [round, setRound] = useState(0);
  if (state !== handled) {
    setHandled(state);
    if (state?.message) {
      setTitle("");
      setBody("");
      setFile(null);
      setPreview(null);
      setUploaded(null);
      setProgress(null);
      setRound((value) => value + 1);
    }
  }

  const pick = (next: File | null) => {
    if (uploaded && uploaded.file !== next) {
      void discardNafhaUploadAction(uploaded.path);
      setUploaded(null);
    }
    const error = next ? checkFile(next) : null;
    setFileError(error);
    setFile(error ? null : next);
    setPreview(next && !error ? URL.createObjectURL(next) : null);
    if (!next && fileInput.current) fileInput.current.value = "";
  };

  const busy = saving || progress !== null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    data.delete("media");
    let path = uploaded?.file === file ? uploaded.path : "";
    if (file && !path) {
      setProgress(0);
      try {
        path = await uploadWithProgress(file, setProgress);
        setUploaded({ file, path });
      } catch (error) {
        setFileError(error instanceof Error && !/^upload|^network/.test(error.message) ? error.message : "تعذّر رفع الملف، حاول مرة أخرى.");
        setProgress(null);
        return;
      }
      setProgress(null);
    }
    data.set("media_path", path);
    startTransition(() => dispatch(data));
  }

  const kind = file ? NAFAHAT_MEDIA_TYPES[file.type]?.kind : undefined;
  const mediaError = fileError ?? state?.fieldErrors?.media;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={submit} className="grid content-start gap-4" noValidate>
        <FormAlert error={state?.error} message={state?.message} />
        <Field
          label="عنوان النفحة"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="مثال: لا تحزن إن الله معنا"
          error={state?.fieldErrors?.title}
        />
        <div>
          <label htmlFor={bodyId} className="mb-1.5 block text-sm font-bold text-ink">
            الوصف (اختياري)
          </label>
          <textarea
            id={bodyId}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            placeholder="الخاطرة أو المقال…"
            className={cn(
              "min-h-36 w-full rounded-2xl border bg-white px-4 py-3 text-base leading-relaxed text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-emerald/50 focus:shadow-soft",
              state?.fieldErrors?.body ? "border-rose" : "border-line",
            )}
          />
          {state?.fieldErrors?.body && <p className="mt-1.5 text-sm font-semibold text-rose">{state.fieldErrors.body}</p>}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">صورة أو فيديو (اختياري)</span>
          {file ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory p-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-emerald">
                {kind === "video" ? <Film className="size-5" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-bold" dir="auto">
                  {file.name}
                </span>
                <span className="block text-xs text-muted">{mb(file.size)}</span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => pick(null)}
                className="grid size-9 place-items-center rounded-full text-rose hover:bg-rose/10 disabled:opacity-50"
                aria-label="إزالة الملف"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-ivory px-4 py-6 text-sm font-bold text-muted hover:border-emerald/50 hover:text-emerald"
            >
              <ImagePlus className="size-5" aria-hidden /> اختر صورة أو فيديو — حتى ٥٠ ميجابايت
            </button>
          )}
          <input
            key={round}
            ref={fileInput}
            type="file"
            name="media"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />
          {progress !== null && (
            <div className="mt-3" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-emerald transition-[width]" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">جارٍ الرفع… {Math.round(progress * 100).toLocaleString("ar-EG")}٪</p>
            </div>
          )}
          {mediaError && <p className="mt-1.5 text-sm font-semibold text-rose">{mediaError}</p>}
        </div>

        <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "sm:justify-self-start")}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {progress !== null ? "جارٍ رفع الملف…" : saving ? "جارٍ النشر…" : "نشر النفحة لكل المستخدمين"}
        </button>
        <p className="text-xs text-muted">
          تظهر النفحة فورًا في قناة «نفحات المنارة» على الموقع والتطبيق، وفي نافذة عند فتحهما، ويصل إشعار لمن فعّل الإشعارات. تُحذف كل
          النفحات تلقائيًا أول كل شهر.
        </p>
      </form>

      <aside aria-label="معاينة" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-bold text-muted">معاينة</p>
        <div className="rounded-4xl bg-parchment p-4">
          <NafhaCard
            preview
            nafha={{
              id: "preview",
              title: title.trim() || "عنوان النفحة",
              body: body.trim() || null,
              media_type: kind ?? null,
              media_url: preview,
              created_at: new Date().toISOString(),
            }}
          />
        </div>
      </aside>
    </div>
  );
}
