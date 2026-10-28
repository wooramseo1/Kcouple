import { createSession } from "@/lib/auth";
import { db, id, now, save } from "@/lib/db";
import { HttpError, json, parse, rateLimit, route } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/schemas";
import { audit } from "@/lib/services";

export const POST = route(async (req) => {
  rateLimit(`register:${req.headers.get("x-forwarded-for") ?? "local"}`, 10, 60_000);
  const body = await parse(req, registerSchema);
  const d = db();
  if (d.users.some((u) => u.email === body.email)) throw new HttpError(409, "email_taken");
  const user = {
    id: id(), email: body.email, passwordHash: hashPassword(body.password), status: "pending" as const,
    role: "user" as const, ageVerified: false, birthDate: null, termsAcceptedAt: now(), createdAt: now(), lastActiveAt: now(),
  };
  d.users.push(user);
  save();
  audit(user.id, "auth.register", user.id);
  await createSession(user.id);
  return json({ success: true, next: "/verify-age" }, 201);
});
