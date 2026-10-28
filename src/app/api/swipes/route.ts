import { json, parse, rateLimit, requireUser, route } from "@/lib/http";
import { swipeSchema } from "@/lib/schemas";
import { swipe } from "@/lib/services";

export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`swipe:${user.id}`, 120, 60_000);
  const body = await parse(req, swipeSchema);
  const r = swipe(user.id, body.target_user_id, body.action);
  return json({ success: true, matched: r.matched, match_id: r.matchId });
});
