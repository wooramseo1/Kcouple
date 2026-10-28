import { db, save } from "@/lib/db";
import { HttpError, json, parse, requireAdmin, route } from "@/lib/http";
import { userStatusSchema } from "@/lib/schemas";
import { audit } from "@/lib/services";

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { status } = await parse(req, userStatusSchema);
  const { id } = await params;
  const d = db();
  const user = d.users.find((u) => u.id === id);
  if (!user || user.status === "deleted") throw new HttpError(404, "user_not_found");
  if (user.role === "admin") throw new HttpError(400, "cannot_change_admin");
  user.status = status;
  if (status === "suspended") d.sessions = d.sessions.filter((s) => s.userId !== user.id);
  save();
  audit(admin.id, `user.${status}`, user.id);
  return json({ success: true });
});
