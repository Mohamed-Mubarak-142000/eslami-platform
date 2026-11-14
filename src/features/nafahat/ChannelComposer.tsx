"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Film, Loader2, Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { createNafhaAction, discardNafhaUploadAction } from "./actions";
import { NAFAHAT_MEDIA_TYPES } from "./shared";
import { NAFAHAT_ACCEPT, checkNafhaFile, formatMegabytes, uploadErrorMessage, uploadNafhaMedia } from "./upload";

/** "First line = title, the rest = body", the way a chat message maps onto a nafha. */
function splitDraft(text: string): { title: string; body: string } {
  const [first = "", ...rest] = text.trim().split("\n");
  return { title: first.trim(), body: rest.join("\n").trim() };
}

/**
 * The admin's composer at the bottom of the channel, WhatsApp-style: type, attach a photo or video, send.
 * The post appears in the chat through Realtime (and the action's revalidation), like everyone else sees it.
 * Enter is a new line (the first line is the title); only the button publishes, since a post pushes to all.
 */
export function ChannelComposer({ onPublished }: { onPublished: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // The file already uploaded for this draft, so a retry after an error doesn't upload twice.
  const [uploaded, setUploaded] = useState<{ file: File; path: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  // Grow with the text, up to about six lines, then scroll.
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const busy = saving || progress !== null;
  const { title } = splitDraft(text);
  const canSend = !busy && title.length > 0;
  const kind = file ? NAFAHAT_MEDIA_TYPES[file.type]?.kind : undefined;

  const pick = (next: File | null) => {
    if (uploaded && uploaded.file !== next) {
      void discardNafhaUploadAction(uploaded.path);
      setUploaded(null);
    }
    const problem = next ? checkNafhaFile(next) : null;
    setError(problem);
    setFile(problem ? null : next);
    setPreview(next && !problem ? URL.createObjectURL(next) : null);
    if (fileInput.current) fileInput.current.value = "";
    if (next && !problem) textarea.current?.focus();
  };

  async function send() {
    if (!canSend) return;
    const draft = splitDraft(text);
    if (draft.title.length < 2) return setError("اكتب عنوانًا للنفحة في السطر الأول");
    if (draft.title.length > 120) return setError("السطر الأول (العنوان) ١٢٠ حرفًا بحد أقصى، اكتب الباقي في سطر جديد");
    setError(null);

    let path = uploaded?.file === file ? uploaded.path : "";
    if (file && !path) {
      setProgress(0);
      try {
        path = await uploadNafhaMedia(file, setProgress);
        setUploaded({ file, path });
      } catch (problem) {
        setError(uploadErrorMessage(problem));
        setProgress(null);
        return;
      }
      setProgress(null);
    }

    const data = new FormData();
    data.set("title", draft.title);
    data.set("body", draft.body);
    data.set("media_path", path);
    startSaving(async () => {
      const result = await createNafhaAction(undefined, data);
      if (result.message) {
        setText("");
        setFile(null);
        setPreview(null);
        setUploaded(null);
        onPublished();
        return;
      }
      setError(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? "تعذّر النشر، حاول مرة أخرى.");
    });
  }

  return (
    <footer className="shrink-0 border-t border-line bg-ivory px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4">
      {file && preview && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white p-2 shadow-[0_1px_0.5px_rgba(1,42,34,0.1)]">
          {kind === "video" ? (
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-emerald-night">
              <video src={`${preview}#t=0.001`} muted playsInline preload="metadata" className="size-full object-cover" />
              <Film className="absolute bottom-1 start-1 size-3.5 text-white drop-shadow" aria-hidden />
            </span>
          ) : (
            // A local object URL, just picked.
            <img src={preview} alt="" className="size-14 shrink-0 rounded-xl bg-ivory object-cover" />
          )}
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-bold" dir="auto">
              {file.name}
            </span>
            <span className="block text-xs text-muted">
              {progress !== null ? `جارٍ الرفع… ${Math.round(progress * 100).toLocaleString("ar-EG")}٪` : formatMegabytes(file.size)}
            </span>
            {progress !== null && (
              <span
                className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="block h-full rounded-full bg-emerald transition-[width]" style={{ width: `${progress * 100}%` }} />
              </span>
            )}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => pick(null)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-rose hover:bg-rose/10 disabled:opacity-50"
            aria-label="إزالة الملف"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {error ? (
        <p role="alert" className="mb-1.5 px-2 text-xs font-bold text-rose">
          {error}
        </p>
      ) : (
        text.trim() && (
          <p className="mb-1.5 px-2 text-xs text-muted">السطر الأول عنوان النفحة، وما بعده وصفها. تصل لكل المستخدمين بإشعار.</p>
        )
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex min-h-11 flex-1 items-end rounded-3xl bg-white shadow-[0_1px_0.5px_rgba(1,42,34,0.1)] focus-within:shadow-[0_0_0_2px_var(--color-emerald-soft)]">
          <label htmlFor="nafha-draft" className="sr-only">
            اكتب نفحة
          </label>
          <textarea
            id="nafha-draft"
            ref={textarea}
            rows={1}
            value={text}
            disabled={busy}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            maxLength={4200}
            dir="auto"
            placeholder="اكتب نفحة جديدة…"
            // text-base (16px) so iOS doesn't zoom the page on focus.
            className="max-h-42 min-w-0 flex-1 resize-none bg-transparent py-2.5 ps-4 text-base leading-6 text-ink outline-none placeholder:text-muted/80 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className={cn(
              "m-1 grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-emerald-mist hover:text-emerald disabled:opacity-50",
              file && "text-emerald",
            )}
            aria-label="إرفاق صورة أو فيديو"
            title="إرفاق صورة أو فيديو (حتى ٥٠ ميجابايت)"
          >
            <Paperclip className="size-5" aria-hidden />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={NAFAHAT_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={!canSend}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald text-white shadow-soft transition hover:bg-emerald-deep active:scale-95 disabled:bg-line disabled:text-muted disabled:shadow-none"
          aria-label="انشر النفحة"
          title="انشر النفحة"
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5 -scale-x-100" aria-hidden />}
        </button>
      </form>
    </footer>
  );
}
