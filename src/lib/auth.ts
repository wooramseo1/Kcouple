import { cookies } from "next/headers";
import { db, id, now, save } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "kc_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = id() + id().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db().sessions.push({ token, userId, expiresAt: expiresAt.toISOString() });
  save();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const d = db();
    d.sessions = d.sessions.filter((s) => s.token !== token);
    save();
  }
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const d = db();
  const session = d.sessions.find((s) => s.token === token);
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  const user = d.users.find((u) => u.id === session.userId);
  if (!user || user.status === "deleted") return null;
  const last = new Date(user.lastActiveAt).getTime();
  if (Date.now() - last > 60_000) {
    user.lastActiveAt = now();
    save();
  }
  return user;
}

/** Where a signed-in user still needs to go before the main app. */
export function nextStep(user: User): string | null {
  if (user.role === "admin") return null;
  if (!user.ageVerified) return "/verify-age";
  if (!db().preferences.some((p) => p.userId === user.id)) return "/onboarding";
  return null;
}
