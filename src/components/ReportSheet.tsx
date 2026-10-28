"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { REPORT_REASONS } from "@/lib/constants";

export function ReportSheet({ name, targetId, matchId, onClose, onDone }: {
  name: string; targetId: string; matchId?: string; onClose: () => void; onDone: (blocked: boolean) => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api("/api/reports", { body: { target_user_id: targetId, match_id: matchId ?? null, reason, detail, also_block: alsoBlock } });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="safe-bottom max-h-[90%] w-full overflow-y-auto rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("report.title", { name })}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink-100" />
        {done ? (
          <div className="py-8 text-center">
            <div className="mb-3 text-4xl">🛡️</div>
            <p className="font-semibold">{t("report.done")}</p>
            <button className="btn-primary mt-6 w-full" onClick={() => onDone(alsoBlock)}>{t("common.close")}</button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold">{t("report.title", { name })}</h2>
            <p className="mb-3 mt-1 text-sm text-ink-500">{t("report.reason")}</p>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r} className={`card flex cursor-pointer items-center gap-3 p-3 ${reason === r ? "border-brand-500 bg-brand-50" : ""}`}>
                  <input type="radio" name="reason" className="h-4 w-4 accent-brand-500" checked={reason === r} onChange={() => setReason(r)} />
                  <span className="text-sm font-medium">{t(`reason.${r}`)}</span>
                </label>
              ))}
            </div>
            <label className="label mt-4" htmlFor="detail">{t("report.detail")}</label>
            <textarea id="detail" className="input h-24 resize-none py-3" maxLength={1000} value={detail} onChange={(e) => setDetail(e.target.value)} />
            <label className="mt-3 flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-brand-500" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
              {t("report.alsoBlock")}
            </label>
            <div className="mt-5 flex gap-3">
              <button className="btn-ghost flex-1" onClick={onClose}>{t("common.cancel")}</button>
              <button className="btn-primary flex-1" disabled={!reason || busy} onClick={submit}>{t("report.submit")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
