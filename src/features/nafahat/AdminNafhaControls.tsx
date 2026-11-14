"use client";

import { useCallback, useState } from "react";
import { ActionButton } from "@/features/admin/AdminControls";
import { deleteNafhaAction } from "./actions";
import { ReactorsPanel } from "./ReactorsPanel";
import { NAFAHAT_EMOJIS, type ReactionCounts } from "./shared";

/** The reactions cell: counts per emoji; opens the list of who reacted. */
export function ReactorsButton({ nafhaId, title, counts }: { nafhaId: string; title: string; counts: ReactionCounts }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-line bg-white px-3 py-1.5 text-xs hover:border-emerald/40 hover:bg-emerald-mist"
        aria-label={`عرض المتفاعلين (${total})`}
      >
        {total === 0 ? (
          <span className="text-muted">لا تفاعل بعد</span>
        ) : (
          NAFAHAT_EMOJIS.filter((emoji) => counts[emoji.id]).map((emoji) => (
            <span key={emoji.id} className="inline-flex items-center gap-0.5">
              {emoji.char} <span className="font-bold tabular-nums">{(counts[emoji.id] ?? 0).toLocaleString("ar-EG")}</span>
            </span>
          ))
        )}
        <span className="font-bold text-emerald">· مين اتفاعل؟</span>
      </button>
      <ReactorsPanel nafhaId={open ? nafhaId : null} title={title} counts={counts} onClose={close} />
    </>
  );
}

export function DeleteNafhaButton({ nafhaId }: { nafhaId: string }) {
  return (
    <ActionButton
      label="حذف"
      danger
      run={() => (window.confirm("حذف النفحة وتفاعلاتها وملفها نهائيًا؟") ? deleteNafhaAction(nafhaId) : Promise.resolve({}))}
    />
  );
}
