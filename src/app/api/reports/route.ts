import { json, parse, rateLimit, requireUser, route } from "@/lib/http";
import { reportSchema } from "@/lib/schemas";
import { block, report } from "@/lib/services";
import type { ReportReason } from "@/lib/types";

export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`report:${user.id}`, 10, 60_000);
  const b = await parse(req, reportSchema);
  const r = report(user.id, b.target_user_id, b.reason as ReportReason, b.detail, b.match_id ?? null);
  if (b.also_block) block(user.id, b.target_user_id);
  return json({ success: true, report_id: r.id }, 201);
});
