import { db } from "@/lib/db";
import { json, requireAdmin, route } from "@/lib/http";
import { member, toPublic } from "@/lib/services";

export const GET = route(async () => {
  await requireAdmin();
  const d = db();
  const severity: Record<string, number> = { underage: 0, sexual: 1, scam: 2, harassment: 3, fake: 4, spam: 5, other: 6 };
  const reports = [...d.reports]
    .sort((a, b) => Number(a.status !== "open") - Number(b.status !== "open") || severity[a.reason] - severity[b.reason] || b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const target = member(r.targetId);
      const targetUser = d.users.find((u) => u.id === r.targetId);
      return {
        ...r,
        target: target ? toPublic(target) : null,
        targetStatus: targetUser?.status ?? "deleted",
        targetReportCount: d.reports.filter((x) => x.targetId === r.targetId).length,
        reporterName: member(r.reporterId)?.profile.nickname ?? "—",
      };
    });
  return json({ reports });
});
