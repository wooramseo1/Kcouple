"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { AboutFields, BasicsFields, GoalField, LanguagesField, PhotoManager, PrefsFields, type PrefsDraft, type ProfileDraft } from "@/components/ProfileFields";
import type { Gender } from "@/lib/types";

const opposite = (g: Gender): Gender[] => (g === "male" ? ["female"] : g === "female" ? ["male"] : ["female", "male", "nonbinary"]);

export function Onboarding({ initialPhotos }: { initialPhotos: string[] }) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState(initialPhotos);
  const [profile, setProfile] = useState<ProfileDraft>({
    nickname: "", gender: "female", group: lang === "ko" ? "korean" : "foreigner", nationality: lang === "ko" ? "KR" : "US", city: "Seoul",
    languages: lang === "ko" ? [{ code: "ko", level: "native" }, { code: "en", level: "conversational" }] : [{ code: "en", level: "native" }, { code: "ko", level: "basic" }],
    goal: "serious", bio: "", interests: [], isVisible: true,
  });
  const [prefs, setPrefs] = useState<PrefsDraft>({ preferredGenders: ["male"], minAge: 22, maxAge: 40, lookingFor: "korean" });
  const [prefsTouched, setPrefsTouched] = useState(false);

  const setP = (patch: Partial<ProfileDraft>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    // Sensible defaults for "who to meet" until the user edits them: opposite gender, the other group.
    if (!prefsTouched) setPrefs((p) => ({ ...p, preferredGenders: opposite(next.gender), lookingFor: next.group === "korean" ? "foreigner" : "korean" }));
  };
  const setQ = (patch: Partial<PrefsDraft>) => { setPrefsTouched(true); setPrefs((p) => ({ ...p, ...patch })); };

  const steps = [
    { title: t("ob.basics"), body: <BasicsFields value={profile} set={setP} />, ok: profile.nickname.trim().length > 0 },
    { title: t("ob.languages"), body: <LanguagesField value={profile} set={setP} />, ok: profile.languages.length > 0 },
    { title: t("ob.photos"), sub: t("ob.photosSub"), body: <PhotoManager photos={photos} onChange={setPhotos} />, ok: photos.length > 0 },
    { title: t("ob.about"), body: <AboutFields value={profile} set={setP} />, ok: profile.interests.length > 0 },
    { title: t("ob.goal"), body: <GoalField value={profile} set={setP} />, ok: true },
    {
      title: t("ob.prefs"),
      body: (
        <div className="space-y-6">
          <PrefsFields value={prefs} set={setQ} />
          <label className="card flex items-start gap-3 p-4">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-500" checked={profile.isVisible} onChange={(e) => setP({ isVisible: e.target.checked })} />
            <span><span className="block font-semibold">{t("ob.visible")}</span><span className="text-sm text-ink-500">{t("ob.visibleSub")}</span></span>
          </label>
        </div>
      ),
      ok: true,
    },
  ];
  const s = steps[step];
  const last = step === steps.length - 1;

  async function finish() {
    setBusy(true);
    setError("");
    try {
      await api("/api/profile/me", { method: "PUT", body: { profile: { ...profile, nickname: profile.nickname.trim() }, preferences: prefs } });
      window.location.href = "/discover";
    } catch {
      setError(t("common.error"));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col">
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold text-ink-500">{t("ob.step", { n: step + 1, total: steps.length })}</div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-brand-500" : "bg-ink-100"}`} />)}
        </div>
      </div>
      <h1 className="text-2xl font-extrabold">{s.title}</h1>
      {s.sub && <p className="mt-1 text-sm text-ink-500">{s.sub}</p>}
      <div className="mt-6 flex-1">{s.body}</div>
      {error && <p className="mt-4 text-sm font-medium text-brand-600">{error}</p>}
      <div className="sticky bottom-0 mt-8 flex gap-3 bg-gradient-to-t from-white via-white pt-4">
        {step > 0 && <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>{t("ob.back")}</button>}
        <button type="button" className="btn-primary flex-1" disabled={!s.ok || busy} onClick={() => (last ? finish() : setStep(step + 1))}>
          {last ? t("ob.finish") : t("ob.next")}
        </button>
      </div>
    </div>
  );
}
