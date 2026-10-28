import { NextResponse } from "next/server";
import type { ZodError, ZodType, ZodTypeDef } from "zod";
import { currentUser } from "./auth";
import type { User } from "./types";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform error handling. */
export function route<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.code, message: err.message }, err.status);
      console.error(err);
      return json({ error: "internal_error" }, 500);
    }
  };
}

export async function requireUser(opts: { allowIncomplete?: boolean } = {}): Promise<User> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "unauthorized");
  if (user.status === "suspended") throw new HttpError(403, "suspended");
  if (!opts.allowIncomplete && !user.ageVerified) throw new HttpError(403, "age_verification_required");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "forbidden");
  return user;
}

export async function parse<T>(req: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = (result.error as ZodError).issues[0];
    throw new HttpError(400, "validation_error", `${issue.path.join(".")}: ${issue.message}`);
  }
  return result.data;
}

const buckets = new Map<string, { tokens: number; at: number }>();

/** Simple per-key token bucket: `limit` requests per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const t = Date.now();
  const b = buckets.get(key) ?? { tokens: limit, at: t };
  b.tokens = Math.min(limit, b.tokens + ((t - b.at) / windowMs) * limit);
  b.at = t;
  if (b.tokens < 1) throw new HttpError(429, "rate_limited");
  b.tokens -= 1;
  buckets.set(key, b);
}
