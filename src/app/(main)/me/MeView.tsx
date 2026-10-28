"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { flag } from "@/lib/constants";
import type { PublicProfile } from "@/lib/types";
import { Photo } from "@/components/Photo";
import { ProfileDetail } from "@/components/ProfileDetail";
import { LangToggle } from "@/components/LangToggle";
import { IconGear, IconUser } from "@/components/Icons";

export function MeView({ profile }: { profile: PublicProfile }) {
  const { t, cityName } = useI18n();
  const [preview, setPreview] = useState(false);
  return (
    <div className="no-scrollbar relative flex-1 overflow-y-auto">
      <div className="flex justify-end p-4"><LangToggle /></div>
      <div className="flex flex-col items-center px-6 text-center">
        <button onClick={() => setPreview(true)} className="h-36 w-36 overflow-hidden rounded-full p-1" style={{ backgroundImage: "var(--brand-gradient)" }} aria-label={t("me.preview")}>
          <span className="block h-full w-full overflow-hidden rounded-full ring-4 ring-white">
            <Photo src={profile.photos[0]} alt={profile.nickname} className="h-full w-full" emojiSize="text-6xl" />
          </span>
        </button>
        <h1 className="mt-4 text-2xl font-extrabold">{profile.nickname}, {profile.age} {flag(profile.nationality)}</h1>
        <p className="text-sm text-ink-500">{cityName(profile.city)} · {t(`goal.${profile.goal}`)}</p>

        <div className="mt-8 flex w-full justify-center gap-10">
          <Action href="/settings" label={t("me.settings")}><IconGear className="h-6 w-6" /></Action>
          <Action href="/me/edit" label={t("me.edit")} primary>✎</Action>
          <Action onClick={() => setPreview(true)} label={t("me.preview")}><IconUser className="h-6 w-6" /></Action>
        </div>
      </div>
      {preview && <ProfileDetail profile={profile} onClose={() => setPreview(false)} />}
    </div>
  );
}

function Action({ href, onClick, label, primary, children }: { href?: string; onClick?: () => void; label: string; primary?: boolean; children: React.ReactNode }) {
  const cls = `grid h-16 w-16 place-items-center rounded-full text-2xl shadow-[0_6px_24px_-6px_rgba(22,19,26,.3)] transition hover:scale-105 ${primary ? "text-white" : "bg-white text-ink-500 ring-1 ring-ink-100"}`;
  const style = primary ? { backgroundImage: "var(--brand-gradient)" } : undefined;
  const inner = <span className={cls} style={style}>{children}</span>;
  return (
    <div className="flex flex-col items-center gap-2">
      {href ? <Link href={href} aria-label={label}>{inner}</Link> : <button onClick={onClick} aria-label={label}>{inner}</button>}
      <span className="text-xs font-semibold text-ink-500">{label}</span>
    </div>
  );
}
