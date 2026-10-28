"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { flag } from "@/lib/constants";
import { Photo } from "@/components/Photo";
import { useMatches } from "@/components/useMatches";
import { Empty } from "@/components/Empty";

export default function MatchesPage() {
  const { t, cityName } = useI18n();
  const matches = useMatches();
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto">
      <header className="px-5 pb-2 pt-5">
        <h1 className="text-2xl font-extrabold">{t("matches.title")}</h1>
        {matches && matches.length > 0 && <p className="text-sm text-ink-500">{matches.length}</p>}
      </header>
      {matches === null ? (
        <div className="grid grid-cols-2 gap-3 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />)}</div>
      ) : matches.length === 0 ? (
        <Empty title={t("matches.none")} sub={t("matches.noneSub")} cta={t("matches.go")} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {matches.map((m) => (
            <Link key={m.matchId} href={`/chat/${m.matchId}`} className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <Photo src={m.profile.photos[0]} alt={m.profile.nickname} className="h-full w-full transition group-hover:scale-105" emojiSize="text-6xl" />
              {!m.lastMessage && <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
              {m.unread > 0 && <span className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{m.unread}</span>}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
                <div className="font-bold">{m.profile.nickname} <span className="font-normal">{m.profile.age}</span> {flag(m.profile.nationality)}</div>
                <div className="text-xs opacity-85">{cityName(m.profile.city)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
