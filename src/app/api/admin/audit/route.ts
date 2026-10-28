import { db } from "@/lib/db";
import { json, requireAdmin, route } from "@/lib/http";
import { member } from "@/lib/services";

export const GET = route(async () => {
  await requireAdmin();
  const d = db();
  const name = (uid: string | null) =>
    !uid ? "—" : (member(uid)?.profile.nickname ?? (d.users.find((u) => u.id === uid)?.role === "admin" ? "admin" : uid.slice(0, 8)));
  const logs = d.auditLogs.slice(-200).reverse().map((l) => ({ ...l, actorName: name(l.actorId), targetName: name(l.targetId) }));
  const stats = {
    users: d.users.filter((u) => u.status === "active" && u.role === "user").length,
    demoUsers: d.users.filter((u) => u.isDemo).length,
    matches: d.matches.length,
    messages: d.messages.length,
    openReports: d.reports.filter((r) => r.status === "open" || r.status === "reviewing").length,
    suspended: d.users.filter((u) => u.status === "suspended").length,
  };
  return json({ logs, stats });
});
