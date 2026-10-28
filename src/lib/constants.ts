import type { Gender, Goal, LangLevel, ReportReason } from "./types.ts";

export const MIN_AGE = 19;
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 1_500_000;
export const MAX_MESSAGE_LENGTH = 1000;

/** City → metro area. Same metro area counts as "nearby" for ranking. */
export const CITIES: Record<string, string> = {
  Seoul: "capital",
  Incheon: "capital",
  Suwon: "capital",
  Seongnam: "capital",
  Goyang: "capital",
  Yongin: "capital",
  Busan: "southeast",
  Ulsan: "southeast",
  Daegu: "southeast",
  Daejeon: "central",
  Sejong: "central",
  Gwangju: "southwest",
  Jeonju: "southwest",
  Gangneung: "east",
  Jeju: "jeju",
};

export const LANGUAGES = ["ko", "en", "ja", "zh", "es", "fr", "de", "vi", "ru", "pt", "it", "th"] as const;
export const LANG_LEVELS: LangLevel[] = ["basic", "conversational", "fluent", "native"];
export const GOALS: Goal[] = ["serious", "long_term", "casual", "open"];
export const GENDERS: Gender[] = ["female", "male", "nonbinary"];
export const REPORT_REASONS: ReportReason[] = ["fake", "harassment", "sexual", "scam", "spam", "underage", "other"];

export const INTERESTS = [
  "travel", "food", "cafe", "kpop", "kdrama", "hiking", "fitness", "music", "movies", "gaming",
  "photography", "art", "books", "cooking", "dance", "language", "pets", "nightlife", "fashion", "tech",
] as const;

export const INTEREST_EMOJI: Record<string, string> = {
  travel: "✈️", food: "🍜", cafe: "☕", kpop: "🎤", kdrama: "📺", hiking: "⛰️", fitness: "💪",
  music: "🎧", movies: "🎬", gaming: "🎮", photography: "📷", art: "🎨", books: "📚", cooking: "🍳",
  dance: "💃", language: "🗣️", pets: "🐶", nightlife: "🌃", fashion: "👗", tech: "💻",
};

export const COUNTRIES = [
  "KR", "US", "CA", "GB", "AU", "NZ", "IE", "FR", "DE", "ES", "IT", "NL", "SE", "RU",
  "JP", "CN", "TW", "VN", "TH", "PH", "ID", "MY", "SG", "IN", "MX", "BR", "AR", "ZA",
] as const;

export function flag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
