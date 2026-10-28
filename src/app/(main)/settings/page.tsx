"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { PrefsFields, type PrefsDraft } from "@/components/ProfileFields";
import { IconBack } from "@/components/Icons";

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [prefs, setPrefs] = useState<PrefsDraft | null>(null);
  const [visible, setVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    api<{ user: { email: string }; profile: { isVisible: boolean }; preferences: PrefsDraft }>("/api/profile/me").then((d) => {
      setEmail(d.user.email);
      setVisible(d.profile.isVisible);
      setPrefs({ preferredGenders: d.preferences.preferredGenders, minAge: d.preferences.minAge, maxAge: d.preferences.maxAge, lookingFor: d.preferences.lookingFor });
    });
  }, []);

  // Auto-save shortly after the last change.
  function persist(body: object) {
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => api("/api/profile/me", { method: "PUT", body }).then(() => setSaved(true)), 400);
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function deleteAccount() {
    if (!confirm(t("settings.deleteConfirm"))) return;
    await api("/api/account", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f4f8]">
      <header className="flex items-center gap-2 border-b border-ink-100 bg-white px-2 py-2">
        <Link href="/me" className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-ink-100" aria-label="back"><IconBack /></Link>
        <h1 className="flex-1 font-bold">{t("settings.title")}</h1>
        {saved && <span className="pr-3 text-xs font-semibold text-emerald-600">✓ {t("me.saved")}</span>}
      </header>
      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        <Group title={t("settings.language")}>
          <div className="grid grid-cols-2 gap-2">
            {(["ko", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`${lang === l ? "chip-on" : "chip-off"} h-11 justify-center`}>{l === "ko" ? "한국어" : "English"}</button>
            ))}
          </div>
        </Group>

        <Group title={t("settings.discovery")}>
          {prefs ? <PrefsFields value={prefs} set={(p) => { const next = { ...prefs, ...p }; setPrefs(next); persist({ preferences: next }); }} /> : <p className="text-sm text-ink-500">{t("common.loading")}</p>}
        </Group>

        <Group title={t("settings.privacy")}>
          <label className="flex items-center justify-between gap-3">
            <span><span className="block font-semibold">{t("ob.visible")}</span><span className="text-xs text-ink-500">{t("ob.visibleSub")}</span></span>
            <input type="checkbox" role="switch" className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-ink-300 transition before:block before:h-5 before:w-5 before:translate-x-0.5 before:rounded-full before:bg-white before:transition checked:bg-brand-500 checked:before:translate-x-[22px]"
              checked={visible} onChange={(e) => { setVisible(e.target.checked); persist({ profile: { isVisible: e.target.checked } }); }} />
          </label>
          <p className="mt-4 text-xs leading-relaxed text-ink-500">{t("settings.privacyNote")}</p>
          <Link href="/privacy" className="mt-2 inline-block text-xs font-semibold text-brand-600 underline">{t("settings.policy")}</Link>
        </Group>

        <Group>
          <div className="text-xs text-ink-500">{email}</div>
          <button className="btn-ghost mt-3 w-full" onClick={logout}>{t("settings.logout")}</button>
          <button className="mt-2 h-11 w-full text-sm font-semibold text-rose-600" onClick={deleteAccount}>{t("settings.delete")}</button>
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      {title && <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">{title}</h2>}
      {children}
    </section>
  );
}
