"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { Photo } from "@/components/Photo";
import { useMatches } from "@/components/useMatches";
import { Empty } from "@/components/Empty";

function ago(iso: string, lang: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  if (s < 60) return rtf.format(0, "minute");
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}

export default function ChatListPage() {
  const { t, lang } = useI18n();
  const matches = useMatches();
  const fresh = matches?.filter((m) => !m.lastMessage) ?? [];
  const convos = matches?.filter((m) => m.lastMessage) ?? [];
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto">
      <header className="px-5 pb-2 pt-5"><h1 className="text-2xl font-extrabold">{t("chat.title")}</h1></header>
      {matches === null ? (
        <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />)}</div>
      ) : matches.length === 0 ? (
        <Empty title={t("chat.none")} sub={t("matches.noneSub")} cta={t("matches.go")} />
      ) : (
        <>
          {fresh.length > 0 && (
            <section className="pb-2">
              <h2 className="px-5 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-brand-600">{t("matches.new")}</h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
                {fresh.map((m) => (
                  <Link key={m.matchId} href={`/chat/${m.matchId}`} className="w-[76px] shrink-0 text-center">
                    <div className="mx-auto h-[76px] w-[76px] overflow-hidden rounded-full p-[3px]" style={{ backgroundImage: "var(--brand-gradient)" }}>
                      <div className="h-full w-full overflow-hidden rounded-full ring-2 ring-white">
                        <Photo src={m.profile.photos[0]} alt={m.profile.nickname} className="h-full w-full" emojiSize="text-3xl" />
                      </div>
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold">{m.profile.nickname}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <ul className="divide-y divide-ink-100">
            {convos.map((m) => (
              <li key={m.matchId}>
                <Link href={`/chat/${m.matchId}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-ink-100/40">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <Photo src={m.profile.photos[0]} alt={m.profile.nickname} className="h-full w-full" emojiSize="text-2xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-bold">{m.profile.nickname}</span>
                      <span className="shrink-0 text-xs text-ink-300">{ago(m.lastMessage!.createdAt, lang)}</span>
                    </div>
                    <div className={`truncate text-sm ${m.unread ? "font-semibold text-ink-900" : "text-ink-500"}`}>
                      {m.lastMessage!.senderId !== m.profile.userId && t("chat.you")}{m.lastMessage!.content}
                    </div>
                  </div>
                  {m.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
