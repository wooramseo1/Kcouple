import { HttpError, json, requireUser, route } from "@/lib/http";
import { member, otherId, requireMatchParticipant, toPublic, unmatch } from "@/lib/services";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const m = requireMatchParticipant((await params).id, user.id);
  const other = member(otherId(m, user.id));
  if (!other) throw new HttpError(404, "user_not_found");
  return json({ match: { id: m.id, status: m.status, createdAt: m.createdAt }, profile: toPublic(other) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  unmatch((await params).id, user.id);
  return json({ success: true });
});
