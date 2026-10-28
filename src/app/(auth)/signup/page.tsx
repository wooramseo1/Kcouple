"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { api, ApiError } from "@/lib/api-client";

export default function SignupPage() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ next: string }>("/api/auth/register", { body: { email, password, acceptTerms: terms, acceptPrivacy: privacy } });
      window.location.href = r.next;
    } catch (err) {
      setError(err instanceof ApiError && err.code === "email_taken"
        ? (lang === "ko" ? "이미 가입된 이메일이에요." : "That email is already registered.")
        : t("common.error"));
      setBusy(false);
    }
  }

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold">{t("auth.signupTitle")}</h1>
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="email">{t("auth.email")}</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">{t("auth.password")}</label>
          <input id="pw" className="input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-ink-500">{t("auth.passwordHint")}</p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-500" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>{t("auth.acceptTerms")}</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-500" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>{t("auth.acceptPrivacy")} · <Link href="/privacy" className="underline" target="_blank">{t("settings.policy")}</Link></span>
        </label>
        {error && <p className="text-sm font-medium text-brand-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !terms || !privacy}>{t("auth.signup")}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        {t("auth.haveAccount")} <Link href="/login" className="font-semibold text-brand-600">{t("auth.login")}</Link>
      </p>
    </div>
  );
}
