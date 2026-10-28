import { destroySession } from "@/lib/auth";
import { json, requireUser, route } from "@/lib/http";
import { deleteAccount } from "@/lib/services";

export const DELETE = route(async () => {
  const user = await requireUser({ allowIncomplete: true });
  deleteAccount(user.id);
  await destroySession();
  return json({ success: true });
});
