"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Nafha } from "./shared";

interface LiveHandlers {
  onInsert?: (nafha: Nafha) => void;
  onDelete?: (id: string) => void;
}

function pick(row: Record<string, unknown>): Nafha | null {
  if (typeof row.id !== "string" || typeof row.title !== "string" || typeof row.created_at !== "string") return null;
  return {
    id: row.id,
    title: row.title,
    body: typeof row.body === "string" ? row.body : null,
    media_type: row.media_type === "image" || row.media_type === "video" ? row.media_type : null,
    media_url: typeof row.media_url === "string" ? row.media_url : null,
    created_at: row.created_at,
  };
}

/**
 * New and deleted posts as they happen, through Supabase Realtime (the table is in the supabase_realtime
 * publication: migrations/20261115000001_nafahat_realtime.sql). Each caller gets its own channel.
 */
export function useNafahatLive(handlers: LiveHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`nafahat:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nafahat" }, (payload) => {
        const nafha = pick(payload.new as Record<string, unknown>);
        if (nafha) latest.current.onInsert?.(nafha);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "nafahat" }, (payload) => {
        const id = (payload.old as { id?: unknown }).id;
        if (typeof id === "string") latest.current.onDelete?.(id);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}

const noop = () => () => {};
/** False during the server render and hydration, true once mounted: for labels that depend on "now". */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
