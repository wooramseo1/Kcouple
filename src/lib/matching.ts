/**
 * Candidate filtering and ranking (PRD §4.1).
 * Pure functions only, so they can be unit-tested without the data store.
 */
import { CITIES } from "./constants.ts";
import type { Goal, Preferences, Profile, SpokenLanguage, User } from "./types.ts";

export interface Member {
  user: User;
  profile: Profile;
  prefs: Preferences;
}

export function ageOn(birthDate: string, now: Date = new Date()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

/** True when `a`'s preferences accept `b`. */
export function accepts(a: Member, b: Member, now: Date = new Date()): boolean {
  const age = ageOn(b.profile.birthDate, now);
  if (!a.prefs.preferredGenders.includes(b.profile.gender)) return false;
  if (age < a.prefs.minAge || age > a.prefs.maxAge) return false;
  if (a.prefs.lookingFor !== "any" && a.prefs.lookingFor !== b.profile.group) return false;
  return true;
}

export function isDiscoverable(m: Member): boolean {
  return m.user.status === "active" && m.user.ageVerified && m.profile.isVisible && m.profile.photos.length > 0;
}

/** Hard filters: both eligible and both sides' preferences satisfied. */
export function mutuallyEligible(a: Member, b: Member, now: Date = new Date()): boolean {
  if (a.user.id === b.user.id) return false;
  if (!isDiscoverable(a) || !isDiscoverable(b)) return false;
  return accepts(a, b, now) && accepts(b, a, now);
}

export function regionScore(a: string, b: string): number {
  if (a === b) return 100;
  if (CITIES[a] && CITIES[a] === CITIES[b]) return 70;
  return 30;
}

const GOAL_MATRIX: Record<Goal, Record<Goal, number>> = {
  serious: { serious: 100, long_term: 80, open: 60, casual: 10 },
  long_term: { serious: 80, long_term: 100, open: 70, casual: 30 },
  open: { serious: 60, long_term: 70, open: 100, casual: 70 },
  casual: { serious: 10, long_term: 30, open: 70, casual: 100 },
};

export function goalScore(a: Goal, b: Goal): number {
  return GOAL_MATRIX[a][b];
}

const LEVEL_RANK = { basic: 1, conversational: 2, fluent: 3, native: 4 } as const;

/** Best shared language: both conversational+ → 100, otherwise partial credit. */
export function languageScore(a: SpokenLanguage[], b: SpokenLanguage[]): number {
  let best = 0;
  for (const la of a) {
    const lb = b.find((x) => x.code === la.code);
    if (!lb) continue;
    const weakest = Math.min(LEVEL_RANK[la.level], LEVEL_RANK[lb.level]);
    best = Math.max(best, weakest >= 2 ? 100 : 50);
  }
  return best;
}

export function interestScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const shared = a.filter((x) => b.includes(x)).length;
  return Math.round((shared / Math.min(a.length, b.length)) * 100);
}

export function activityScore(lastActiveAt: string, now: Date = new Date()): number {
  const days = (now.getTime() - new Date(lastActiveAt).getTime()) / 86_400_000;
  if (days <= 1) return 100;
  if (days <= 3) return 80;
  if (days <= 7) return 50;
  return 20;
}

export function weightedScore(s: { region: number; goal: number; language: number; interest: number; activity: number }): number {
  return 0.25 * s.region + 0.25 * s.goal + 0.2 * s.language + 0.2 * s.interest + 0.1 * s.activity;
}

/** Internal sort score (0–100). Not a probability of relationship success. */
export function score(viewer: Member, candidate: Member, now: Date = new Date()): number {
  return weightedScore({
    region: regionScore(viewer.profile.city, candidate.profile.city),
    goal: goalScore(viewer.profile.goal, candidate.profile.goal),
    language: languageScore(viewer.profile.languages, candidate.profile.languages),
    interest: interestScore(viewer.profile.interests, candidate.profile.interests),
    activity: activityScore(candidate.user.lastActiveAt, now),
  });
}

export function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
