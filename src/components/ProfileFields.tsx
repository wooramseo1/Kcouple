"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { api, ApiError, resizeImage } from "@/lib/api-client";
import { CITIES, COUNTRIES, GENDERS, GOALS, INTERESTS, INTEREST_EMOJI, LANGUAGES, LANG_LEVELS, MAX_PHOTOS, flag } from "@/lib/constants";
import type { Gender, Goal, GroupPreference, LangLevel, SpokenLanguage, UserGroup } from "@/lib/types";
import { Photo } from "./Photo";

export interface ProfileDraft {
  nickname: string;
  gender: Gender;
  group: UserGroup;
  nationality: string;
  city: string;
  languages: SpokenLanguage[];
  goal: Goal;
  bio: string;
  interests: string[];
  isVisible: boolean;
}

export interface PrefsDraft {
  preferredGenders: Gender[];
  minAge: number;
  maxAge: number;
  lookingFor: GroupPreference;
}

type Set<T> = (patch: Partial<T>) => void;

function Seg<T extends string>({ options, value, onChange, label }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button type="button" role="radio" aria-checked={value === o.v} key={o.v} onClick={() => onChange(o.v)} className={value === o.v ? "chip-on" : "chip-off"}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function BasicsFields({ value, set }: { value: ProfileDraft; set: Set<ProfileDraft> }) {
  const { t, cityName, lang } = useI18n();
  const countryName = (c: string) => {
    try { return new Intl.DisplayNames([lang], { type: "region" }).of(c) ?? c; } catch { return c; }
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="nick">{t("ob.nickname")}</label>
        <input id="nick" className="input" maxLength={30} value={value.nickname} onChange={(e) => set({ nickname: e.target.value })} />
      </div>
      <div>
        <div className="label">{t("ob.group")}</div>
        <Seg label={t("ob.group")} value={value.group} onChange={(group) => set({ group, nationality: group === "korean" ? "KR" : value.nationality === "KR" ? "US" : value.nationality })}
          options={[{ v: "foreigner", label: t("group.foreigner") }, { v: "korean", label: t("group.korean") }]} />
      </div>
      <div>
        <div className="label">{t("ob.gender")}</div>
        <Seg label={t("ob.gender")} value={value.gender} onChange={(gender) => set({ gender })} options={GENDERS.map((g) => ({ v: g, label: t(`gender.${g}`) }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="nat">{t("ob.nationality")}</label>
          <select id="nat" className="input" value={value.nationality} onChange={(e) => set({ nationality: e.target.value })}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{flag(c)} {countryName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">{t("ob.city")}</label>
          <select id="city" className="input" value={value.city} onChange={(e) => set({ city: e.target.value })}>
            {Object.keys(CITIES).map((c) => <option key={c} value={c}>{cityName(c)}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export function LanguagesField({ value, set }: { value: ProfileDraft; set: Set<ProfileDraft> }) {
  const { t, langName } = useI18n();
  const used = new Set(value.languages.map((l) => l.code));
  const update = (i: number, patch: Partial<SpokenLanguage>) => set({ languages: value.languages.map((l, k) => (k === i ? { ...l, ...patch } : l)) });
  return (
    <div className="space-y-3">
      {value.languages.map((l, i) => (
        <div key={i} className="card p-3">
          <div className="flex items-center gap-2">
            <select className="input h-10 flex-1" value={l.code} onChange={(e) => update(i, { code: e.target.value })} aria-label={t("ob.languages")}>
              {LANGUAGES.filter((c) => c === l.code || !used.has(c)).map((c) => <option key={c} value={c}>{langName(c)}</option>)}
            </select>
            {value.languages.length > 1 && (
              <button type="button" className="h-10 w-10 rounded-full text-ink-500 hover:bg-ink-100" aria-label="remove" onClick={() => set({ languages: value.languages.filter((_, k) => k !== i) })}>✕</button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LANG_LEVELS.map((lv) => (
              <button type="button" key={lv} onClick={() => update(i, { level: lv as LangLevel })} className={`${l.level === lv ? "chip-on" : "chip-off"} h-8 px-2.5 text-xs`}>
                {t(`level.${lv}`)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {value.languages.length < 5 && (
        <button type="button" className="btn-ghost h-10 w-full text-sm" onClick={() => {
          const code = LANGUAGES.find((c) => !used.has(c));
          if (code) set({ languages: [...value.languages, { code, level: "conversational" }] });
        }}>+ {t("ob.addLanguage")}</button>
      )}
    </div>
  );
}

export function AboutFields({ value, set }: { value: ProfileDraft; set: Set<ProfileDraft> }) {
  const { t, interestName } = useI18n();
  const toggle = (i: string) =>
    set({ interests: value.interests.includes(i) ? value.interests.filter((x) => x !== i) : value.interests.length < 8 ? [...value.interests, i] : value.interests });
  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="bio">{t("ob.bio")}</label>
        <textarea id="bio" className="input h-32 resize-none py-3" maxLength={500} placeholder={t("ob.bioPh")} value={value.bio} onChange={(e) => set({ bio: e.target.value })} />
        <div className="mt-1 text-right text-xs text-ink-500">{value.bio.length}/500</div>
      </div>
      <div>
        <div className="label">{t("ob.interests")}</div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button type="button" key={i} onClick={() => toggle(i)} className={value.interests.includes(i) ? "chip-on" : "chip-off"}>
              {INTEREST_EMOJI[i]} {interestName(i)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const GOAL_EMOJI: Record<Goal, string> = { serious: "💍", long_term: "💞", casual: "🥂", open: "✨" };

export function GoalField({ value, set }: { value: ProfileDraft; set: Set<ProfileDraft> }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2.5">
      {GOALS.map((g) => (
        <button type="button" key={g} onClick={() => set({ goal: g })}
          className={`card flex w-full items-center gap-3 p-4 text-left transition ${value.goal === g ? "border-brand-500 bg-brand-50 ring-4 ring-brand-100" : "hover:border-ink-300"}`}>
          <span className="text-2xl">{GOAL_EMOJI[g]}</span>
          <span className="font-semibold">{t(`goal.${g}`)}</span>
        </button>
      ))}
      <p className="pt-1 text-xs text-ink-500">{t("ob.goalNote")}</p>
    </div>
  );
}

export function PrefsFields({ value, set }: { value: PrefsDraft; set: Set<PrefsDraft> }) {
  const { t } = useI18n();
  const toggleGender = (g: Gender) => {
    const next = value.preferredGenders.includes(g) ? value.preferredGenders.filter((x) => x !== g) : [...value.preferredGenders, g];
    if (next.length) set({ preferredGenders: next });
  };
  return (
    <div className="space-y-6">
      <div>
        <div className="label">{t("ob.showMe")}</div>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button type="button" key={g} onClick={() => toggleGender(g)} className={value.preferredGenders.includes(g) ? "chip-on" : "chip-off"}>{t(`genderPl.${g}`)}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">{t("ob.lookingFor")}</div>
        <Seg label={t("ob.lookingFor")} value={value.lookingFor} onChange={(lookingFor) => set({ lookingFor })}
          options={(["korean", "foreigner", "any"] as const).map((v) => ({ v, label: t(`lookingFor.${v}`) }))} />
      </div>
      <div>
        <div className="label flex justify-between"><span>{t("ob.ageRange")}</span><span className="text-brand-600">{value.minAge} – {value.maxAge}</span></div>
        <div className="space-y-2">
          <input type="range" className="w-full accent-brand-500" min={19} max={70} value={value.minAge} aria-label="min age"
            onChange={(e) => { const v = Number(e.target.value); set({ minAge: v, maxAge: Math.max(v, value.maxAge) }); }} />
          <input type="range" className="w-full accent-brand-500" min={19} max={70} value={value.maxAge} aria-label="max age"
            onChange={(e) => { const v = Number(e.target.value); set({ maxAge: v, minAge: Math.min(v, value.minAge) }); }} />
        </div>
      </div>
    </div>
  );
}

export function PhotoManager({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const { t, lang } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const next = [...photos];
    try {
      for (const f of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && f.type) throw new ApiError(400, "invalid_image");
        const dataUrl = await resizeImage(f);
        await api("/api/profile/photos", { body: { dataUrl } });
        next.push(dataUrl);
        onChange([...next]);
      }
    } catch (err) {
      setError(err instanceof ApiError && err.code === "photo_too_large" ? (lang === "ko" ? "사진 용량이 너무 커요." : "Photo is too large.")
        : err instanceof ApiError && err.code === "invalid_image" ? (lang === "ko" ? "JPG, PNG, WEBP 이미지만 가능해요." : "Only JPG, PNG or WEBP images.")
        : t("common.error"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(i: number) {
    try {
      await api(`/api/profile/photos?index=${i}`, { method: "DELETE" });
      onChange(photos.filter((_, k) => k !== i));
    } catch {
      setError(lang === "ko" ? "사진은 최소 1장 필요해요." : "You need at least one photo.");
    }
  }

  async function makeMain(i: number) {
    const order = [i, ...photos.map((_, k) => k).filter((k) => k !== i)];
    await api("/api/profile/photos", { method: "PATCH", body: { order } });
    onChange(order.map((k) => photos[k]));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const p = photos[i];
          if (p) {
            return (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-xl">
                <Photo src={p} alt="" className="h-full w-full" emojiSize="text-4xl" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
                <button type="button" onClick={() => remove(i)} aria-label="remove photo" className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs font-bold text-ink-700 shadow">✕</button>
                {i > 0 && (
                  <button type="button" onClick={() => makeMain(i)} className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-white/90 py-1 text-[11px] font-semibold text-ink-700 shadow">{t("me.makeMain")}</button>
                )}
              </div>
            );
          }
          return (
            <button key={i} type="button" disabled={busy || i !== photos.length} onClick={() => input.current?.click()}
              className="grid aspect-[3/4] place-items-center rounded-xl border-2 border-dashed border-ink-100 bg-white text-ink-300 transition enabled:hover:border-brand-400 enabled:hover:text-brand-500">
              {i === photos.length ? (busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> : <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ backgroundImage: "var(--brand-gradient)" }}>+</span>) : null}
            </button>
          );
        })}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <p className="mt-2 text-sm font-medium text-brand-600">{error}</p>}
    </div>
  );
}
