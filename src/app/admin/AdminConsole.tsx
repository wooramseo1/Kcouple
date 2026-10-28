"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { flag } from "@/lib/constants";
import type { AuditLog, PublicProfile, Report } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { Photo } from "@/components/Photo";

type AdminReport = Report & { target: PublicProfile | null; targetStatus: string; targetReportCount: number; reporterName: string };
type Log = AuditLog & { actorName: string; targetName: string };
type Stats = { users: number; demoUsers: number; matches: number; messages: number; openReports: number; suspended: number };

const STATUS_STYLE: Record<string, string> = {
  open: "bg-rose-100 text-rose-700", reviewing: "bg-amber-100 text-amber-800", actioned: "bg-emerald-100 text-emerald-700", dismissed: "bg-ink-100 text-ink-500",
};
const SEVERE = new Set(["underage", "sexual", "scam"]);

export function AdminConsole() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<"reports" | "audit">("reports");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const [r, a] = await Promise.all([api<{ reports: AdminReport[] }>("/api/admin/reports"), api<{ logs: Log[]; stats: Stats }>("/api/admin/audit")]);
    setReports(r.reports);
    setLogs(a.logs);
    setStats(a.stats);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(r: AdminReport, status: "reviewing" | "actioned" | "dismissed", user_action: "none" | "warn" | "suspend" = "none") {
    const resolution = status === "reviewing" ? undefined : (prompt(lang === "ko" ? "처리 메모" : "Resolution note") ?? "");
    await api(`/api/admin/reports/${r.id}`, { method: "PATCH", body: { status, resolution, user_action } });
    load();
  }

  async function reactivate(userId: string) {
    await api(`/api/admin/users/${userId}`, { method: "PATCH", body: { status: "active" } });
    load();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(lang, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-dvh bg-[#f6f4f8]">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <Logo className="text-lg" />
          <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Admin</span>
          <div className="flex-1" />
          <LangToggle />
          <button onClick={logout} className="text-sm font-semibold text-ink-500">{t("settings.logout")}</button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6">
        <h1 className="text-2xl font-extrabold">{t("admin.title")}</h1>
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {([["Users", stats.users], ["Demo", stats.demoUsers], ["Matches", stats.matches], ["Messages", stats.messages], ["Open reports", stats.openReports], ["Suspended", stats.suspended]] as const).map(([k, v]) => (
              <div key={k} className="card p-3">
                <div className="text-xs font-semibold text-ink-500">{k}</div>
                <div className="text-2xl font-extrabold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {(["reports", "audit"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={tab === k ? "chip-on" : "chip-off"}>{t(`admin.${k}`)}</button>
          ))}
        </div>

        {tab === "reports" ? (
          <div className="mt-4 space-y-3">
            {reports.length === 0 && <div className="card p-8 text-center text-ink-500">{t("admin.empty")}</div>}
            {reports.map((r) => (
              <article key={r.id} className={`card p-4 ${SEVERE.has(r.reason) && r.status === "open" ? "border-rose-300" : ""}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Photo src={r.target?.photos[0]} alt="" className="h-full w-full" emojiSize="text-2xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${SEVERE.has(r.reason) ? "bg-rose-600 text-white" : "bg-ink-100 text-ink-700"}`}>{t(`reason.${r.reason}`)}</span>
                      <span className="text-xs text-ink-500">{fmt(r.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 font-bold">
                      {r.target ? <>{r.target.nickname}, {r.target.age} {flag(r.target.nationality)}</> : "(deleted)"}
                      <span className="ml-2 text-xs font-medium text-ink-500">account: {r.targetStatus} · reports: {r.targetReportCount}</span>
                    </div>
                    <div className="text-xs text-ink-500">by {r.reporterName}</div>
                    {r.detail && <p className="mt-2 rounded-lg bg-ink-100/60 p-2 text-sm">{r.detail}</p>}
                    {r.resolution && <p className="mt-2 text-xs text-ink-500">→ {r.resolution}</p>}
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
                    {r.status === "open" && <button className="btn-ghost h-9 px-3 text-xs" onClick={() => act(r, "reviewing")}>{t("admin.review")}</button>}
                    {(r.status === "open" || r.status === "reviewing") && (
                      <>
                        <button className="btn h-9 bg-rose-600 px-3 text-xs text-white" onClick={() => act(r, "actioned", "suspend")}>{t("admin.suspend")}</button>
                        <button className="btn-ghost h-9 px-3 text-xs" onClick={() => act(r, "actioned", "warn")}>{t("admin.warn")}</button>
                        <button className="btn-ghost h-9 px-3 text-xs" onClick={() => act(r, "dismissed")}>{t("admin.dismiss")}</button>
                      </>
                    )}
                    {r.targetStatus === "suspended" && <button className="btn-ghost h-9 px-3 text-xs" onClick={() => reactivate(r.targetId)}>{t("admin.reactivate")}</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase text-ink-500">
                <tr><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Target</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap p-3 text-ink-500">{fmt(l.createdAt)}</td>
                    <td className="p-3 font-medium">{l.actorName}</td>
                    <td className="p-3"><code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{l.action}</code></td>
                    <td className="p-3">{l.targetName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
