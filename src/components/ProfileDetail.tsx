"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { INTEREST_EMOJI, flag } from "@/lib/constants";
import type { PublicProfile } from "@/lib/types";
import { Photo } from "./Photo";
import { IconDown, IconPin } from "./Icons";

/** Full-screen scrollable profile view (Tinder's "expanded card"). */
export function ProfileDetail({ profile, onClose, footer, onReport }: { profile: PublicProfile; onClose: () => void; footer?: React.ReactNode; onReport?: () => void }) {
  const { t, langName, interestName, cityName, lang } = useI18n();
  const [idx, setIdx] = useState(0);
  const country = (() => { try { return new Intl.DisplayNames([lang], { type: "region" }).of(profile.nationality); } catch { return profile.nationality; } })();
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white animate-pop" role="dialog" aria-label={profile.nickname}>
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        <div className="relative aspect-[3/4] max-h-[60dvh] w-full">
          <Photo src={profile.photos[idx]} alt={profile.nickname} className="h-full w-full" emojiSize="text-[120px]" />
          {profile.photos.length > 1 && (
            <>
              <div className="absolute inset-x-2 top-2 flex gap-1">
                {profile.photos.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
              </div>
              <button className="absolute inset-y-0 left-0 w-1/2" aria-label="previous photo" onClick={() => setIdx(Math.max(0, idx - 1))} />
              <button className="absolute inset-y-0 right-0 w-1/2" aria-label="next photo" onClick={() => setIdx(Math.min(profile.photos.length - 1, idx + 1))} />
            </>
          )}
          <button onClick={onClose} aria-label={t("common.close")} className="absolute -bottom-6 right-5 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg" style={{ backgroundImage: "var(--brand-gradient)" }}>
            <IconDown />
          </button>
        </div>
        <div className="space-y-5 px-5 pt-5">
          <div>
            <h2 className="text-3xl font-extrabold">{profile.nickname} <span className="font-normal">{profile.age}</span></h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              <span>{flag(profile.nationality)} {country}</span>
              <span className="inline-flex items-center gap-1"><IconPin /> {cityName(profile.city)}</span>
              {profile.isDemo && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold">{t("discover.demo")}</span>}
            </div>
          </div>
          <Section title={t("discover.lookingFor")}>
            <span className="chip-on">{t(`goal.${profile.goal}`)}</span>
          </Section>
          {profile.bio && <Section title={t("ob.bio")}><p className="whitespace-pre-line leading-relaxed text-ink-700">{profile.bio}</p></Section>}
          <Section title={t("discover.speaks")}>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((l) => <span key={l.code} className="chip-off">{langName(l.code)} · <span className="text-ink-500">{t(`level.${l.level}`)}</span></span>)}
            </div>
          </Section>
          <Section title={t("ob.interests").replace(/\s*\(.*\)/, "")}>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => <span key={i} className="chip-off">{INTEREST_EMOJI[i]} {interestName(i)}</span>)}
            </div>
          </Section>
          {onReport && (
            <button onClick={onReport} className="w-full border-t border-ink-100 pt-5 text-center text-sm font-semibold text-ink-500 hover:text-rose-600">
              {t("discover.reportBlock", { name: profile.nickname })}
            </button>
          )}
        </div>
      </div>
      {footer && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pb-5 pt-8">{footer}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-500">{title}</h3>
      {children}
    </section>
  );
}
