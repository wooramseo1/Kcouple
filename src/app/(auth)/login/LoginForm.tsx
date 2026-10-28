"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { api, ApiError } from "@/lib/api-client";

const DEMOS = [
  { key: "auth.demoForeigner", email: "sam@kcouple.dev", pw: "demo1234", emoji: "🧭" },
  { key: "auth.demoKorean", email: "jiwoo@kcouple.dev", pw: "demo1234", emoji: "🌸" },
  { key: "auth.demoAdmin", email: "admin@kcouple.dev", pw: "admin1234", emoji: "🛡️" },
] as const;

export function LoginForm({ demo }: { demo: boolean }) {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("suspended") ? (lang === "ko" ? "정지된 계정입니다." : "This account is suspended.") : "");
  const [busy, setBusy] = useState(false);

  async function login(e: string, p: string) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next: string }>("/api/auth/login", { body: { email: e, password: p } });
      window.location.href = r.next;
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(code === "invalid_credentials" ? (lang === "ko" ? "이메일 또는 비밀번호가 올바르지 않아요." : "Wrong email or password.")
        : code === "suspended" ? (lang === "ko" ? "정지된 계정입니다." : "This account is suspended.") : t("common.error"));
      setBusy(false);
    }
  }

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold">{t("auth.loginTitle")}</h1>
      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); login(email, password); }}>
        <div>
          <label className="label" htmlFor="email">{t("auth.email")}</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">{t("auth.password")}</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm font-medium text-brand-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{t("auth.login")}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.noAccount")} <Link href="/signup" className="font-semibold text-brand-600">{t("auth.signup")}</Link>
      </p>

      {demo && (
        <div className="mt-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">{t("auth.demoTitle")}</div>
          <div className="space-y-2">
            {DEMOS.map((d) => (
              <button key={d.email} disabled={busy} onClick={() => login(d.email, d.pw)} className="card flex w-full items-center gap-3 p-3 text-left transition hover:border-brand-400">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-xl">{d.emoji}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{t(d.key)}</span>
                  <span className="block text-xs text-ink-500">{d.email}</span>
                </span>
                <span className="text-ink-300">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
