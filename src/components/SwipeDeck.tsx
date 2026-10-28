"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { flag } from "@/lib/constants";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import { Photo } from "./Photo";
import { ProfileDetail } from "./ProfileDetail";
import { IconHeart, IconInfo, IconPin, IconX } from "./Icons";

const SWIPE_THRESHOLD = 110;
const FLY_MS = 320;

type Drag = { x: number; y: number; startX: number; startY: number; t: number; active: boolean };

export function SwipeDeck({ me }: { me: { nickname: string; photo?: string } }) {
  const { t, lang, cityName, langName } = useI18n();
  const router = useRouter();
  const [queue, setQueue] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [drag, setDrag] = useState<Drag>({ x: 0, y: 0, startX: 0, startY: 0, t: 0, active: false });
  const [flying, setFlying] = useState<SwipeAction | null>(null);
  const [detail, setDetail] = useState(false);
  const [match, setMatch] = useState<{ profile: PublicProfile; matchId: string } | null>(null);
  const seen = useRef(new Set<string>());
  const fetching = useRef(false);

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const d = await api<{ profiles: PublicProfile[] }>("/api/discover?limit=10");
      setQueue((q) => [...q, ...d.profiles.filter((p) => !seen.current.has(p.userId) && !q.some((x) => x.userId === p.userId))]);
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const top = queue[0];
  const next = queue[1];

  const commit = useCallback((action: SwipeAction) => {
    if (!top || flying) return;
    setFlying(action);
    setDetail(false);
    seen.current.add(top.userId);
    const target = top;
    api<{ matched: boolean; match_id: string | null }>("/api/swipes", { body: { target_user_id: target.userId, action } })
      .then((r) => { if (r.matched && r.match_id) setMatch({ profile: target, matchId: r.match_id }); })
      .catch(() => {});
    setTimeout(() => {
      setQueue((q) => q.slice(1));
      setFlying(null);
      setPhotoIdx(0);
      setDrag({ x: 0, y: 0, startX: 0, startY: 0, t: 0, active: false });
    }, FLY_MS);
  }, [top, flying]);

  useEffect(() => {
    if (queue.length < 3 && !loading) load();
  }, [queue.length, loading, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") commit("like");
      else if (e.key === "ArrowLeft") commit("pass");
      else if (e.key === "ArrowUp") setDetail(true);
      else if (e.key === "ArrowDown" || e.key === "Escape") setDetail(false);
      else if (e.key === " " && top) { e.preventDefault(); setPhotoIdx((i) => (i + 1) % top.photos.length); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, match, top]);

  /* ---------- pointer handling ---------- */
  const onDown = (e: React.PointerEvent) => {
    if (flying) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, startX: e.clientX, startY: e.clientY, t: Date.now(), active: true });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag((d) => ({ ...d, x: e.clientX - d.startX, y: e.clientY - d.startY }));
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.active) return;
    const dist = Math.hypot(drag.x, drag.y);
    const velocity = Math.abs(drag.x) / Math.max(1, Date.now() - drag.t);
    if (dist < 6 && top) {
      // Tap: left/right third cycles photos, bottom area opens details.
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;
      if (ry > 0.72) setDetail(true);
      else if (rx < 0.4) setPhotoIdx((i) => Math.max(0, i - 1));
      else setPhotoIdx((i) => Math.min(top.photos.length - 1, i + 1));
      setDrag((d) => ({ ...d, x: 0, y: 0, active: false }));
      return;
    }
    if (Math.abs(drag.x) > SWIPE_THRESHOLD || (velocity > 0.6 && Math.abs(drag.x) > 40)) {
      setDrag((d) => ({ ...d, active: false }));
      commit(drag.x > 0 ? "like" : "pass");
    } else {
      setDrag({ x: 0, y: 0, startX: 0, startY: 0, t: 0, active: false });
    }
  };

  const flyX = flying === "like" ? 700 : flying === "pass" ? -700 : 0;
  const x = flying ? flyX : drag.x;
  const y = flying ? drag.y + 40 : drag.y;
  const rot = x / 18;
  const likeOpacity = Math.min(1, Math.max(0, x / SWIPE_THRESHOLD));
  const nopeOpacity = Math.min(1, Math.max(0, -x / SWIPE_THRESHOLD));
  const progress = Math.min(1, Math.abs(x) / SWIPE_THRESHOLD);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mx-3 mt-1 min-h-0 flex-1">
        {loading && !top && <CardSkeleton />}

        {!loading && !top && (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="relative mb-6 h-28 w-28">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-100" />
              <span className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full ring-4 ring-white shadow-card">
                <Photo src={me.photo} alt={me.nickname} className="h-full w-full" emojiSize="text-5xl" />
              </span>
            </div>
            <h2 className="text-xl font-bold">{t("discover.empty")}</h2>
            <p className="mt-2 text-sm text-ink-500">{t("discover.emptySub")}</p>
            <Link href="/settings" className="btn-ghost mt-6 h-11 text-sm">{t("discover.editPrefs")}</Link>
          </div>
        )}

        {next && (
          <Card key={next.userId} profile={next} photoIdx={0} style={{ transform: `scale(${0.94 + 0.06 * (flying ? 1 : progress)})`, transition: drag.active ? "none" : `transform ${FLY_MS}ms ease` }}
            lang={lang} cityName={cityName} langName={langName} t={t} />
        )}

        {top && (
          <Card
            key={top.userId}
            profile={top}
            photoIdx={photoIdx}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            style={{
              transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
              transition: drag.active ? "none" : `transform ${FLY_MS}ms cubic-bezier(.2,.8,.3,1)`,
              touchAction: "none",
              cursor: drag.active ? "grabbing" : "grab",
            }}
            stamps={{ like: likeOpacity, nope: nopeOpacity }}
            onInfo={() => setDetail(true)}
            lang={lang} cityName={cityName} langName={langName} t={t}
          />
        )}
      </div>

      {top && (
        <div className="flex items-center justify-center gap-6 py-4">
          <RoundButton label={t("discover.pass")} onClick={() => commit("pass")} active={nopeOpacity} className="text-rose-500" activeBg="#f43f5e">
            <IconX className="h-7 w-7" />
          </RoundButton>
          <RoundButton label={t("discover.like")} onClick={() => commit("like")} active={likeOpacity} className="text-emerald-500" activeBg="#10b981" big>
            <IconHeart className="h-9 w-9" />
          </RoundButton>
        </div>
      )}
      {top && <p className="hidden pb-2 text-center text-[11px] text-ink-300 md:block">{t("discover.hint")}</p>}

      {detail && top && (
        <ProfileDetail
          profile={top}
          onClose={() => setDetail(false)}
          footer={
            <div className="flex justify-center gap-6">
              <RoundButton label={t("discover.pass")} onClick={() => commit("pass")} className="text-rose-500"><IconX className="h-7 w-7" /></RoundButton>
              <RoundButton label={t("discover.like")} onClick={() => commit("like")} className="text-emerald-500" big><IconHeart className="h-9 w-9" /></RoundButton>
            </div>
          }
        />
      )}

      {match && (
        <MatchModal
          me={me}
          other={match.profile}
          onClose={() => setMatch(null)}
          onSend={async (text) => {
            if (text.trim()) await api(`/api/matches/${match.matchId}/messages`, { body: { content: text } }).catch(() => {});
            router.push(`/chat/${match.matchId}`);
          }}
        />
      )}
    </div>
  );
}

type CardProps = {
  profile: PublicProfile;
  photoIdx: number;
  style?: React.CSSProperties;
  stamps?: { like: number; nope: number };
  onInfo?: () => void;
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  cityName: (c: string) => string;
  langName: (c: string) => string;
} & Pick<React.HTMLAttributes<HTMLDivElement>, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel">;

function Card({ profile, photoIdx, style, stamps, onInfo, t, cityName, langName, ...handlers }: CardProps) {
  const p = profile;
  return (
    <div className="absolute inset-0 select-none overflow-hidden rounded-3xl bg-ink-900 shadow-card will-change-transform" style={style} {...handlers}>
      <Photo src={p.photos[photoIdx]} alt={p.nickname} className="pointer-events-none h-full w-full" emojiSize="text-[120px]" />

      {p.photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex gap-1">
          {p.photos.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/40"}`} />)}
        </div>
      )}

      {stamps && (
        <>
          <div className="pointer-events-none absolute left-6 top-10 -rotate-[18deg] rounded-xl border-[5px] border-emerald-400 px-3 py-0.5 text-4xl font-black tracking-wider text-emerald-400" style={{ opacity: stamps.like }}>LIKE</div>
          <div className="pointer-events-none absolute right-6 top-10 rotate-[18deg] rounded-xl border-[5px] border-rose-500 px-3 py-0.5 text-4xl font-black tracking-wider text-rose-500" style={{ opacity: stamps.nope }}>NOPE</div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-24 text-white">
        {p.isDemo && <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">{t("discover.demo")}</span>}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[28px] font-extrabold leading-tight">
              {p.nickname} <span className="font-normal">{p.age}</span> <span className="text-2xl">{flag(p.nationality)}</span>
            </h2>
            <div className="mt-1 flex items-center gap-1 text-sm opacity-90"><IconPin /> {cityName(p.city)} · {p.languages.slice(0, 3).map((l) => langName(l.code)).join(" · ")}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-brand-500/90 px-2.5 py-1 text-xs font-semibold">{t(`goal.${p.goal}`)}</span>
            </div>
            {photoIdx === 0 && p.bio && <p className="mt-2 line-clamp-2 text-sm opacity-90">{p.bio}</p>}
          </div>
          {onInfo && (
            <button
              className="pointer-events-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={onInfo}
              aria-label="profile details"
            >
              <IconInfo className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoundButton({ children, onClick, label, className = "", big, active = 0, activeBg }: {
  children: React.ReactNode; onClick: () => void; label: string; className?: string; big?: boolean; active?: number; activeBg?: string;
}) {
  const size = big ? "h-[72px] w-[72px]" : "h-16 w-16";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${size} ${className} grid place-items-center rounded-full bg-white shadow-[0_6px_24px_-6px_rgba(22,19,26,.3)] ring-1 ring-ink-100 transition hover:scale-105 active:scale-95`}
      style={active > 0.05 && activeBg ? { background: activeBg, color: "white", transform: `scale(${1 + active * 0.12})` } : undefined}
    >
      {children}
    </button>
  );
}

function CardSkeleton() {
  return <div className="absolute inset-0 animate-pulse rounded-3xl bg-ink-100" />;
}

function MatchModal({ me, other, onClose, onSend }: { me: { nickname: string; photo?: string }; other: PublicProfile; onClose: () => void; onSend: (text: string) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-ink-900/95 to-brand-700/95 px-6 text-white" role="dialog" aria-label={t("match.title")}>
      <h2 className="animate-pop text-[42px] font-black italic tracking-tight" style={{ textShadow: "0 4px 24px rgba(253,74,108,.6)" }}>{t("match.title")}</h2>
      <p className="mt-2 text-center opacity-90">{t("match.sub", { name: other.nickname })}</p>
      <div className="my-8 flex items-center">
        <div className="h-32 w-32 -rotate-6 overflow-hidden rounded-full ring-4 ring-white shadow-2xl animate-pop">
          <Photo src={me.photo} alt={me.nickname} className="h-full w-full" emojiSize="text-5xl" />
        </div>
        <div className="-ml-6 h-32 w-32 rotate-6 overflow-hidden rounded-full ring-4 ring-white shadow-2xl animate-pop" style={{ animationDelay: ".1s" }}>
          <Photo src={other.photos[0]} alt={other.nickname} className="h-full w-full" emojiSize="text-5xl" />
        </div>
      </div>
      <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); onSend(text); }}>
        <input className="h-12 min-w-0 flex-1 rounded-full bg-white/95 px-5 text-ink-900 outline-none" placeholder={t("chat.startWith", { name: other.nickname })} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} autoFocus />
        <button className="h-12 shrink-0 rounded-full bg-white px-4 font-bold text-brand-600">{t("chat.send")}</button>
      </form>
      <button className="btn mt-4 w-full max-w-sm border-2 border-white/70 text-white" onClick={() => onSend("")}>{t("match.send")}</button>
      <button className="mt-3 h-12 text-sm font-semibold opacity-80" onClick={onClose}>{t("match.keep")}</button>
    </div>
  );
}
