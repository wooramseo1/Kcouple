import { json, requireUser, route } from "@/lib/http";
import { listMatches } from "@/lib/services";

export const GET = route(async () => {
  const user = await requireUser();
  return json({ matches: listMatches(user.id) });
});
