import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accepts, ageOn, goalScore, interestScore, languageScore, mutuallyEligible, normalizePair, regionScore, weightedScore, type Member,
} from "../src/lib/matching.ts";

const NOW = new Date("2026-10-28T12:00:00Z");

function m(over: { id: string; gender?: "male" | "female"; group?: "korean" | "foreigner"; birth?: string; prefs?: Partial<Member["prefs"]>; visible?: boolean; status?: "active" | "suspended" }): Member {
  return {
    user: {
      id: over.id, email: `${over.id}@x`, passwordHash: "", status: over.status ?? "active", role: "user", ageVerified: true,
      birthDate: null, termsAcceptedAt: null, createdAt: "", lastActiveAt: NOW.toISOString(),
    },
    profile: {
      userId: over.id, nickname: over.id, birthDate: over.birth ?? "1997-01-01", gender: over.gender ?? "female",
      group: over.group ?? "korean", nationality: "KR", city: "Seoul", languages: [{ code: "en", level: "fluent" }],
      goal: "serious", bio: "", interests: ["food"], photos: ["demo:1:x"], isVisible: over.visible ?? true,
    },
    prefs: { userId: over.id, preferredGenders: ["male"], minAge: 19, maxAge: 45, lookingFor: "foreigner", ...over.prefs },
  };
}

const korean = m({ id: "a", gender: "female", group: "korean" });
const foreigner = m({ id: "b", gender: "male", group: "foreigner", prefs: { preferredGenders: ["female"], lookingFor: "korean" } });

test("PRD example score: 90/100/85/70/90 → 87.5", () => {
  assert.equal(weightedScore({ region: 90, goal: 100, language: 85, interest: 70, activity: 90 }), 87.5);
});

test("age is computed in full years", () => {
  assert.equal(ageOn("2007-10-29", NOW), 18);
  assert.equal(ageOn("2007-10-28", NOW), 19);
});

test("mutual preferences produce eligibility both ways", () => {
  assert.ok(mutuallyEligible(korean, foreigner, NOW));
  assert.ok(mutuallyEligible(foreigner, korean, NOW));
});

test("one-sided gender preference is not enough", () => {
  const picky = m({ id: "c", gender: "male", group: "foreigner", prefs: { preferredGenders: ["male"], lookingFor: "korean" } });
  assert.ok(accepts(korean, picky, NOW));
  assert.ok(!mutuallyEligible(korean, picky, NOW));
});

test("age range and group preference are enforced", () => {
  const old = m({ id: "d", gender: "male", group: "foreigner", birth: "1970-01-01", prefs: { preferredGenders: ["female"], lookingFor: "korean" } });
  assert.ok(!mutuallyEligible(korean, old, NOW));
  const koreanMale = m({ id: "e", gender: "male", group: "korean", prefs: { preferredGenders: ["female"], lookingFor: "any" } });
  assert.ok(!mutuallyEligible(korean, koreanMale, NOW), "korean user looking for foreigners should not see Koreans");
});

test("hidden, suspended or self profiles are excluded", () => {
  assert.ok(!mutuallyEligible(korean, korean, NOW));
  assert.ok(!mutuallyEligible(korean, { ...foreigner, profile: { ...foreigner.profile, isVisible: false } }, NOW));
  assert.ok(!mutuallyEligible(korean, { ...foreigner, user: { ...foreigner.user, status: "suspended" } }, NOW));
});

test("component scores", () => {
  assert.equal(regionScore("Seoul", "Seoul"), 100);
  assert.equal(regionScore("Seoul", "Incheon"), 70);
  assert.equal(regionScore("Seoul", "Busan"), 30);
  assert.equal(goalScore("serious", "casual"), 10);
  assert.equal(languageScore([{ code: "en", level: "fluent" }], [{ code: "en", level: "native" }]), 100);
  assert.equal(languageScore([{ code: "ko", level: "basic" }], [{ code: "ko", level: "native" }]), 50);
  assert.equal(languageScore([{ code: "ko", level: "native" }], [{ code: "en", level: "native" }]), 0);
  assert.equal(interestScore(["a", "b"], ["b", "c", "d"]), 50);
});

test("pairs normalize so (a,b) and (b,a) map to one match", () => {
  assert.deepEqual(normalizePair("b", "a"), normalizePair("a", "b"));
});
