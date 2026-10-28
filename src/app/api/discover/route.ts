import { json, requireUser, route } from "@/lib/http";
import { discover } from "@/lib/services";

export const GET = route(async (req) => {
  const user = await requireUser();
  const limit = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 10));
  return json({ profiles: discover(user.id, limit), next_cursor: null });
});
