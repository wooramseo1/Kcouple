import { json, requireUser, route } from "@/lib/http";
import { block } from "@/lib/services";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  block(user.id, (await params).id);
  return json({ success: true });
});
