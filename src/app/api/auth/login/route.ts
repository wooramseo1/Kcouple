import { createSession, nextStep } from "@/lib/auth";
import { db } from "@/lib/db";
import { HttpError, json, parse, rateLimit, route } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/schemas";

export const POST = route(async (req) => {
  const body = await parse(req, loginSchema);
  rateLimit(`login:${body.email}`, 8, 60_000);
  const user = db().users.find((u) => u.email === body.email);
  if (!user || user.status === "deleted" || !verifyPassword(body.password, user.passwordHash)) {
    throw new HttpError(401, "invalid_credentials");
  }
  if (user.status === "suspended") throw new HttpError(403, "suspended");
  await createSession(user.id);
  return json({ success: true, next: nextStep(user) ?? (user.role === "admin" ? "/admin" : "/discover") });
});
