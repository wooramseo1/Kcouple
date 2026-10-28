import { db, save } from "@/lib/db";
import { HttpError, json, parse, requireUser, route } from "@/lib/http";
import { ageOn } from "@/lib/matching";
import { onboardingSchema, profileUpdateSchema } from "@/lib/schemas";
import { audit, member } from "@/lib/services";
import type { Preferences, Profile } from "@/lib/types";

export const GET = route(async () => {
  const user = await requireUser();
  const m = member(user.id);
  return json({
    user: { id: user.id, email: user.email, role: user.role },
    profile: m ? { ...m.profile, age: ageOn(m.profile.birthDate) } : null,
    preferences: m?.prefs ?? null,
  });
});

/** First call (no profile yet) completes onboarding; later calls patch. */
export const PUT = route(async (req) => {
  const user = await requireUser();
  const d = db();
  const existing = member(user.id);

  if (!existing) {
    const body = await parse(req, onboardingSchema);
    if (!user.birthDate) throw new HttpError(403, "age_verification_required");
    const pending = d.profiles.find((p) => p.userId === user.id);
    const profile = { ...body.profile, userId: user.id, birthDate: user.birthDate, photos: pending?.photos ?? [] } as Profile;
    d.profiles = d.profiles.filter((p) => p.userId !== user.id);
    d.profiles.push(profile);
    d.preferences.push({ ...body.preferences, userId: user.id } as Preferences);
    save();
    audit(user.id, "profile.create", user.id);
    return json({ success: true });
  }

  const body = await parse(req, profileUpdateSchema);
  if (body.profile) Object.assign(existing.profile, body.profile);
  if (body.preferences) Object.assign(existing.prefs, body.preferences);
  save();
  return json({ success: true });
});
