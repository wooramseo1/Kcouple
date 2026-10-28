"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { IconChat, IconFlame, IconMatches, IconUser } from "./Icons";

export function BottomTabs() {
  const path = usePathname();
  const { t } = useI18n();
  const [unread, setUnread] = useState(0);
  const [newMatches, setNewMatches] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/matches", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => {
        if (!alive || !d) return;
        setUnread(d.matches.reduce((n: number, m: { unread: number }) => n + m.unread, 0));
        setNewMatches(d.matches.filter((m: { lastMessage: unknown }) => !m.lastMessage).length);
      }).catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [path]);

  if (/^\/chat\/./.test(path)) return null;
  const tabs = [
    { href: "/discover", label: t("tab.discover"), icon: IconFlame, badge: 0 },
    { href: "/matches", label: t("tab.matches"), icon: IconMatches, badge: newMatches },
    { href: "/chat", label: t("tab.chat"), icon: IconChat, badge: unread },
    { href: "/me", label: t("tab.me"), icon: IconUser, badge: 0 },
  ];
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link href={href} className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${active ? "text-brand-500" : "text-ink-300 hover:text-ink-500"}`}>
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge > 9 ? "9+" : badge}</span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
