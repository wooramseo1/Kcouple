import { db, now, save } from "@/lib/db";
import { HttpError, json, parse, requireUser, route } from "@/lib/http";
import { ageOn } from "@/lib/matching";
import { MIN_AGE } from "@/lib/constants";
import { verifyAgeSchema } from "@/lib/schemas";
import { audit } from "@/lib/services";

/**
 * Adult check. In this MVP build the method is a self-declaration placeholder;
 * production must plug in a real provider usable by both Koreans and foreigners
 * (PRD §3.1, §12.1) before launch.
 */
export const POST = route(async (req) => {
  const user = await requireUser({ allowIncomplete: true });
  const body = await parse(req, verifyAgeSchema);
  const age = ageOn(body.birthDate);
  const passed = age >= MIN_AGE && age < 100;
  const d = db();
  d.verifications.push({ userId: user.id, method: "self_declared_placeholder", status: passed ? "passed" : "failed", createdAt: now() });
  audit(user.id, "auth.verify_age", user.id, { passed });
  if (!passed) {
    save();
    throw new HttpError(403, "underage", `You must be at least ${MIN_AGE} to use K-Couple.`);
  }
  user.ageVerified = true;
  user.status = "active";
  // Onboarding reuses this birth date so it cannot be changed after the check.
  user.birthDate = body.birthDate;
  save();
  return json({ success: true, next: "/onboarding" });
});
