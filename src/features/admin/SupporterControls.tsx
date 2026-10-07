"use client";

import { useState } from "react";
import { ActionButton } from "./AdminControls";
import { approveSupporterAction, deleteSupporterAction, rejectSupporterAction } from "./supporterActions";

/** Approve (with the thank-you email), reject with an optional reason, or delete a donation request. */
export function SupporterRowControls({ supporterId, status }: { supporterId: string; status: "pending" | "approved" | "rejected" }) {
  const [reason, setReason] = useState("");
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <ActionButton
            label="قبول وإرسال الشكر"
            run={() =>
              window.confirm("تأكدت من وصول التحويل؟ سيظهر الداعم في التطبيق ويصله إيميل شكر.")
                ? approveSupporterAction(supporterId)
                : Promise.resolve({})
            }
          />
        )}
        {status !== "rejected" && <ActionButton label="رفض" danger run={() => rejectSupporterAction(supporterId, reason)} />}
        <ActionButton
          label="حذف"
          danger
          run={() => (window.confirm("حذف الطلب وصورة التحويل نهائيًا؟") ? deleteSupporterAction(supporterId) : Promise.resolve({}))}
        />
      </div>
      {status !== "rejected" && (
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          placeholder="سبب الرفض (اختياري، يراه المستخدم)"
          className="w-full min-w-56 rounded-xl border border-line bg-white px-3 py-1.5 text-xs"
        />
      )}
    </div>
  );
}
