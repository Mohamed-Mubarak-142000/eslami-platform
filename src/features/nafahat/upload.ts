"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { NAFAHAT_BUCKET, NAFAHAT_MAX_BYTES, NAFAHAT_MEDIA_TYPES } from "./shared";

/** Shared by the admin page's composer and the channel's inline composer. */
export const NAFAHAT_ACCEPT = Object.keys(NAFAHAT_MEDIA_TYPES).join(",");

/**
 * Uploads straight from the browser to Supabase Storage (the admin's session passes the bucket's
 * "admin upload" policy). XHR rather than supabase-js, for the progress bar on large videos.
 */
export async function uploadNafhaMedia(file: File, onProgress: (ratio: number) => void): Promise<string> {
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

/** The message to show for a failed upload: the session error as is, anything else as a retry hint. */
export function uploadErrorMessage(error: unknown): string {
  return error instanceof Error && !/^upload|^network/.test(error.message) ? error.message : "تعذّر رفع الملف، حاول مرة أخرى.";
}

export function checkNafhaFile(file: File): string | null {
  if (!NAFAHAT_MEDIA_TYPES[file.type]) return "الملف صورة (PNG أو JPG أو WebP) أو فيديو (MP4 أو MOV أو WebM)";
  if (file.size > NAFAHAT_MAX_BYTES) return "حجم الملف ٥٠ ميجابايت بحد أقصى";
  return null;
}

export const formatMegabytes = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} ميجابايت`;
