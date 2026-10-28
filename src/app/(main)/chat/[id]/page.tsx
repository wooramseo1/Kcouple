"use client";

import Link from "next/link";
import { use, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { api, ApiError } from "@/lib/api-client";
import { flag } from "@/lib/constants";
import type { Message, PublicProfile } from "@/lib/types";
import { Photo } from "@/components/Photo";
import { ProfileDetail } from "@/components/ProfileDetail";
import { ReportSheet } from "@/components/ReportSheet";
import { IconBack, IconMore, IconSend, IconShield } from "@/components/Icons";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [matchedAt, setMatchedAt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [reporting, setReporting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string>("");

  useEffect(() => {
    api<{ match: { status: string; createdAt: string }; profile: PublicProfile }>(`/api/matches/${id}`)
      .then((d) => { setProfile(d.profile); setStatus(d.match.status); setMatchedAt(d.match.createdAt); })
      .catch(() => router.replace("/chat"));
  }, [id, router]);

  // Polling stands in for Supabase Realtime in this local build.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const q = lastAt.current ? `?since=${encodeURIComponent(lastAt.current)}` : "";
        const d = await api<{ messages: Message[] }>(`/api/matches/${id}/messages${q}`);
        if (!alive || !d.messages.length) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          return [...prev, ...d.messages.filter((m) => !known.has(m.id))];
        });
        lastAt.current = d.messages[d.messages.length - 1].createdAt;
      } catch { /* ignore transient errors */ }
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => { alive = false; clearInterval(iv); };
  }, [id]);

  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setError("");
    setText("");
    try {
      const { message } = await api<{ message: Message }>(`/api/matches/${id}/messages`, { body: { content } });
      setMessages((m) => (m.some((x) => x.id === message.id) ? m : [...m, message]));
      lastAt.current = message.createdAt;
    } catch (err) {
      setText(content);
      const code = err instanceof ApiError ? err.code : "";
      setError(code === "links_not_allowed" ? (lang === "ko" ? "안전을 위해 채팅에서 링크는 보낼 수 없어요." : "Links aren't allowed in chat for safety.")
        : code === "chat_closed" ? t("chat.closed")
        : code === "rate_limited" ? (lang === "ko" ? "잠시 후 다시 보내주세요." : "Slow down a little and try again.")
        : t("common.error"));
    }
  }

  async function blockUser() {
    if (!profile || !confirm(t("chat.blockConfirm", { name: profile.nickname }))) return;
    await api(`/api/users/${profile.userId}/block`, { method: "POST" });
    router.replace("/chat");
  }

  async function unmatch() {
    if (!profile || !confirm(t("chat.unmatchConfirm", { name: profile.nickname }))) return;
    await api(`/api/matches/${id}`, { method: "DELETE" });
    router.replace("/chat");
  }

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
  const closed = status !== "active";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-ink-100 px-2 py-2">
        <Link href="/chat" className="grid h-10 w-10 place-items-center rounded-full text-brand-500 hover:bg-ink-100" aria-label="back"><IconBack /></Link>
        {profile && (
          <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => setShowProfile(true)}>
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full"><Photo src={profile.photos[0]} alt={profile.nickname} className="h-full w-full" emojiSize="text-xl" /></span>
            <span className="min-w-0">
              <span className="block truncate font-bold">{profile.nickname} {flag(profile.nationality)}</span>
              <span className="block truncate text-xs text-ink-500">{t(`goal.${profile.goal}`)}</span>
            </span>
          </button>
        )}
        <div className="relative">
          <button className="grid h-10 w-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100" onClick={() => setMenu(!menu)} aria-label="menu" aria-expanded={menu}><IconMore /></button>
          {menu && (
            <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card" onClick={() => setMenu(false)}>
              <MenuItem onClick={() => setShowProfile(true)}>{t("chat.viewProfile")}</MenuItem>
              <MenuItem onClick={() => setReporting(true)} danger>{t("chat.report")}</MenuItem>
              <MenuItem onClick={blockUser} danger>{t("chat.block")}</MenuItem>
              <MenuItem onClick={unmatch}>{t("chat.unmatch")}</MenuItem>
            </div>
          )}
        </div>
      </header>

      <div ref={scroller} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {profile && (
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-brand-50"><Photo src={profile.photos[0]} alt="" className="h-full w-full" emojiSize="text-4xl" /></div>
            <p className="mt-3 text-sm text-ink-500">{matchedAt && t("chat.matchedOn", { date: new Date(matchedAt).toLocaleDateString(lang) })}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800"><IconShield className="h-3.5 w-3.5" />{t("chat.safety")}</p>
          </div>
        )}
        <ul className="space-y-1.5">
          {messages.map((m, i) => {
            const mine = m.senderId !== profile?.userId;
            const nextSame = messages[i + 1]?.senderId === m.senderId;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`group max-w-[78%] ${nextSame ? "" : "mb-2"}`}>
                  <div className={`whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-snug ${mine ? "rounded-[20px] rounded-br-md text-white" : "rounded-[20px] rounded-bl-md bg-ink-100 text-ink-900"}`}
                    style={mine ? { backgroundImage: "var(--brand-gradient)" } : undefined}>
                    {m.content}
                  </div>
                  {!nextSame && <div className={`mt-1 text-[10px] text-ink-300 ${mine ? "text-right" : ""}`}>{fmtTime(m.createdAt)}</div>}
                </div>
              </li>
            );
          })}
        </ul>
        {profile && messages.length === 0 && <p className="text-center text-sm text-ink-500">{t("chat.startWith", { name: profile.nickname })}</p>}
      </div>

      {closed ? (
        <div className="safe-bottom border-t border-ink-100 p-4 text-center text-sm text-ink-500">{t("chat.closed")}</div>
      ) : (
        <form onSubmit={send} className="safe-bottom border-t border-ink-100 p-3">
          {error && <p className="mb-2 px-2 text-xs font-medium text-brand-600">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-ink-100 bg-ink-100/40 px-4 py-2.5 text-[15px] outline-none focus:border-brand-400 focus:bg-white"
              placeholder={t("chat.placeholder")}
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }}
            />
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-40" style={{ backgroundImage: "var(--brand-gradient)" }} disabled={!text.trim()} aria-label={t("chat.send")}>
              <IconSend className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}

      {showProfile && profile && <ProfileDetail profile={profile} onClose={() => setShowProfile(false)} />}
      {reporting && profile && (
        <ReportSheet name={profile.nickname} targetId={profile.userId} matchId={id} onClose={() => setReporting(false)}
          onDone={(blocked) => (blocked ? router.replace("/chat") : setReporting(false))} />
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`block w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-ink-100/60 ${danger ? "text-rose-600" : ""}`}>{children}</button>;
}
