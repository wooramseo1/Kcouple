"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { api, ApiError } from "@/lib/api-client";
import { IconShield } from "@/components/Icons";

export function VerifyAgeForm() {
  const { t } = useI18n();
  const [birthDate, setBirthDate] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next: string }>("/api/auth/verify-age", { body: { birthDate, confirmAdult: confirm } });
      window.location.href = r.next;
    } catch (err) {
      setError(err instanceof ApiError && err.code === "underage" ? t("age.sub") : t("common.error"));
      setBusy(false);
    }
  }

  return (
    <div className="pt-6">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><IconShield className="h-7 w-7" /></div>
      <h1 className="text-3xl font-extrabold">{t("age.title")}</h1>
      <p className="mt-2 text-ink-500">{t("age.sub")}</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="bd">{t("age.birth")}</label>
          <input id="bd" className="input" type="date" required max={new Date().toISOString().slice(0, 10)} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-500" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          <span>{t("age.confirm")}</span>
        </label>
        {error && <p className="text-sm font-medium text-brand-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !confirm || !birthDate}>{t("age.submit")}</button>
      </form>
      <p className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{t("age.note")}</p>
    </div>
  );
}
