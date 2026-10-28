import { db, now, save } from "@/lib/db";
import { HttpError, json, parse, requireAdmin, route } from "@/lib/http";
import { reportUpdateSchema } from "@/lib/schemas";
import { audit } from "@/lib/services";

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const body = await parse(req, reportUpdateSchema);
  const { id } = await params;
  const d = db();
  const r = d.reports.find((x) => x.id === id);
  if (!r) throw new HttpError(404, "report_not_found");
  r.status = body.status;
  r.resolution = body.resolution ?? r.resolution;
  r.handledBy = admin.id;
  r.updatedAt = now();
  const target = d.users.find((u) => u.id === r.targetId);
  if (target && (body.user_action === "suspend" || body.user_action === "ban")) {
    target.status = "suspended";
    d.sessions = d.sessions.filter((s) => s.userId !== target.id);
  }
  save();
  audit(admin.id, `report.${body.status}`, r.targetId, { reportId: r.id, userAction: body.user_action });
  return json({ success: true });
});
