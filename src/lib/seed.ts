import type { Database } from "./db";
import type { Gender, Goal, Preferences, Profile, SpokenLanguage, User, UserGroup } from "./types";
import { hashPassword } from "./password";

type Row = [nickname: string, gender: Gender, group: UserGroup, nat: string, age: number, city: string, goal: Goal,
  langs: string, interests: string, bio: string];

// langs: "ko:native,en:fluent"
const ROWS: Row[] = [
  ["지민", "female", "korean", "KR", 27, "Seoul", "serious", "ko:native,en:fluent", "cafe,travel,photography,books", "Marketing designer in Seongsu. Looking for someone to explore hidden cafés with ☕ 영어로 대화 환영해요!"],
  ["서연", "female", "korean", "KR", 25, "Seoul", "long_term", "ko:native,en:conversational", "kpop,dance,food,fitness", "Pilates instructor 🧘‍♀️ Let's practice English & Korean together!"],
  ["하은", "female", "korean", "KR", 30, "Seoul", "serious", "ko:native,en:fluent,ja:conversational", "hiking,cooking,movies,travel", "Weekend hiker, weekday developer. I'll show you the best spots on Bukhansan ⛰️"],
  ["유나", "female", "korean", "KR", 24, "Incheon", "open", "ko:native,en:conversational", "art,music,cafe,fashion", "Illustrator from Incheon. Galleries > clubs 🎨"],
  ["민지", "female", "korean", "KR", 29, "Busan", "long_term", "ko:native,en:fluent", "travel,food,photography,pets", "Busan local 🌊 Can recommend the best dwaeji-gukbap in town."],
  ["수아", "female", "korean", "KR", 32, "Seoul", "serious", "ko:native,en:fluent,fr:basic", "books,language,cooking,movies", "Translator. Love slow dinners and long conversations."],
  ["예린", "female", "korean", "KR", 26, "Suwon", "casual", "ko:native,en:basic", "kdrama,gaming,food,music", "게임이랑 드라마 좋아해요 🎮 English is basic but I try hard!"],
  ["도윤", "male", "korean", "KR", 29, "Seoul", "serious", "ko:native,en:fluent", "fitness,travel,food,tech", "Product manager in Gangnam. Lived in Toronto for 2 years 🇨🇦"],
  ["준호", "male", "korean", "KR", 31, "Seoul", "long_term", "ko:native,en:conversational", "photography,hiking,cafe,music", "Film camera guy 📷 Let me show you old Seoul."],
  ["현우", "male", "korean", "KR", 27, "Seoul", "open", "ko:native,en:fluent,es:basic", "dance,nightlife,music,travel", "Salsa on Fridays, Han river bike rides on Sundays 🚲"],
  ["지훈", "male", "korean", "KR", 34, "Daejeon", "serious", "ko:native,en:fluent", "books,cooking,tech,movies", "Researcher. Good cook, better listener."],
  ["태민", "male", "korean", "KR", 25, "Seoul", "casual", "ko:native,en:conversational", "kpop,fashion,gaming,cafe", "Fashion student. Always down for a café hop."],
  ["Emily", "female", "foreigner", "US", 28, "Seoul", "serious", "en:native,ko:conversational", "kdrama,cafe,books,travel", "English teacher in Mapo, 3 years in Korea 🇺🇸 Learning Korean every day."],
  ["Sophie", "female", "foreigner", "FR", 26, "Seoul", "long_term", "fr:native,en:fluent,ko:basic", "art,food,photography,cooking", "Exchange researcher at SNU 🇫🇷 Croissants vs. hotteok — debate me."],
  ["Hana", "female", "foreigner", "JP", 27, "Seoul", "serious", "ja:native,ko:fluent,en:conversational", "music,cafe,fashion,kpop", "Tokyo → Seoul. Working at a design studio."],
  ["Olivia", "female", "foreigner", "AU", 30, "Busan", "open", "en:native,ko:basic", "hiking,fitness,travel,pets", "Surfing in Songjeong when the waves are good 🏄‍♀️"],
  ["Linh", "female", "foreigner", "VN", 24, "Seoul", "long_term", "vi:native,ko:fluent,en:conversational", "food,kdrama,dance,language", "Grad student at Yonsei 🇻🇳 Let's trade phở and kimchi-jjigae recipes!"],
  ["Maria", "female", "foreigner", "ES", 31, "Seoul", "casual", "es:native,en:fluent,ko:basic", "nightlife,dance,music,travel", "Madrileña in Itaewon 💃 Always up for live music."],
  ["Alex", "male", "foreigner", "US", 29, "Seoul", "serious", "en:native,ko:conversational", "travel,food,hiking,photography", "Software engineer from Seattle, 2 years in Seoul. 한국어 공부 중이에요!"],
  ["James", "male", "foreigner", "GB", 32, "Seoul", "long_term", "en:native,ko:basic", "books,movies,cafe,cooking", "Londoner, works in finance. Slowly conquering Korean BBQ etiquette."],
  ["Lukas", "male", "foreigner", "DE", 27, "Seoul", "open", "de:native,en:fluent,ko:conversational", "fitness,tech,gaming,music", "Startup founder in Pangyo 🇩🇪 Gym, games, good beer."],
  ["Daniel", "male", "foreigner", "CA", 30, "Incheon", "serious", "en:native,fr:fluent,ko:conversational", "hiking,pets,cooking,travel", "Canadian teacher with a very spoiled shiba 🐕"],
  ["Mateo", "male", "foreigner", "MX", 26, "Seoul", "casual", "es:native,en:fluent,ko:basic", "dance,food,nightlife,kpop", "Chef in Hannam 🌮 I'll cook you the best tacos in Seoul."],
  ["Ethan", "male", "foreigner", "NZ", 34, "Busan", "serious", "en:native,ko:fluent", "travel,photography,hiking,books", "Photographer, 6 years in Korea. Busan sunsets are unbeatable."],
];

const DEMO_HUES = [340, 12, 28, 200, 265, 160, 300, 220, 45, 185, 0, 280];
const EMOJI: Record<string, string> = {
  travel: "✈️", food: "🍜", cafe: "☕", kpop: "🎤", kdrama: "📺", hiking: "⛰️", fitness: "💪", music: "🎧",
  movies: "🎬", gaming: "🎮", photography: "📷", art: "🎨", books: "📚", cooking: "🍳", dance: "💃",
  language: "🗣️", pets: "🐶", nightlife: "🌃", fashion: "👗", tech: "💻",
};

function birthDate(age: number, i: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setDate(d.getDate() - 30 - (i * 11) % 300);
  return d.toISOString().slice(0, 10);
}

function langs(s: string): SpokenLanguage[] {
  return s.split(",").map((p) => {
    const [code, level] = p.split(":");
    return { code, level: level as SpokenLanguage["level"] };
  });
}

const opposite = (g: Gender): Gender[] => (g === "male" ? ["female"] : g === "female" ? ["male"] : ["female", "male", "nonbinary"]);
const otherGroup = (g: UserGroup): UserGroup => (g === "korean" ? "foreigner" : "korean");

export function emptyDatabase(): Database {
  return {
    users: [], profiles: [], preferences: [], swipes: [], matches: [], messages: [], blocks: [],
    reports: [], verifications: [], auditLogs: [], sessions: [],
  };
}

/** Demo data only: sample profiles and shared logins with published passwords. */
export function seed(): Database {
  const db = emptyDatabase();
  const created = new Date().toISOString();
  const demoHash = hashPassword("demo1234");

  ROWS.forEach(([nickname, gender, group, nationality, age, city, goal, l, ints, bio], i) => {
    const id = crypto.randomUUID();
    const interests = ints.split(",");
    const lastActive = new Date(Date.now() - ((i * 7) % 96) * 3_600_000).toISOString();
    const user: User = {
      id, email: `bot${i + 1}@demo.kcouple.dev`, passwordHash: demoHash, status: "active", role: "user",
      ageVerified: true, birthDate: null, termsAcceptedAt: created, createdAt: created, lastActiveAt: lastActive, isDemo: true,
    };
    const photos = [0, 1, 2].map((k) => `demo:${(DEMO_HUES[i % DEMO_HUES.length] + k * 35) % 360}:${EMOJI[interests[k]] ?? "✨"}`);
    const profile: Profile = {
      userId: id, nickname, birthDate: birthDate(age, i), gender, group, nationality, city,
      languages: langs(l), goal, bio, interests, photos, isVisible: true,
    };
    user.birthDate = profile.birthDate;
    const prefs: Preferences = { userId: id, preferredGenders: opposite(gender), minAge: 19, maxAge: 45, lookingFor: otherGroup(group) };
    db.users.push(user);
    db.profiles.push(profile);
    db.preferences.push(prefs);
    db.verifications.push({ userId: id, method: "seed", status: "passed", createdAt: created });
  });

  // Two ready-made accounts so the product can be tried from either side, plus an operator.
  const accounts: Array<{ email: string; pw: string; role: User["role"]; profile?: Omit<Profile, "userId">; prefs?: Omit<Preferences, "userId"> }> = [
    {
      email: "sam@kcouple.dev", pw: "demo1234", role: "user",
      profile: {
        nickname: "Sam", birthDate: birthDate(29, 3), gender: "male", group: "foreigner", nationality: "US", city: "Seoul",
        languages: langs("en:native,ko:conversational"), goal: "serious",
        bio: "Moved to Seoul for work last year. Looking for someone to show me their favourite neighbourhood.",
        interests: ["travel", "food", "cafe", "hiking"], photos: ["demo:210:🧭"], isVisible: true,
      },
      prefs: { preferredGenders: ["female"], minAge: 22, maxAge: 36, lookingFor: "korean" },
    },
    {
      email: "jiwoo@kcouple.dev", pw: "demo1234", role: "user",
      profile: {
        nickname: "지우", birthDate: birthDate(27, 5), gender: "female", group: "korean", nationality: "KR", city: "Seoul",
        languages: langs("ko:native,en:conversational"), goal: "long_term",
        bio: "서울 토박이 🌸 외국 친구들과 이야기하는 걸 좋아해요. Let's grab coffee!",
        interests: ["cafe", "travel", "movies", "photography"], photos: ["demo:330:🌸"], isVisible: true,
      },
      prefs: { preferredGenders: ["male"], minAge: 24, maxAge: 38, lookingFor: "foreigner" },
    },
    { email: "admin@kcouple.dev", pw: "admin1234", role: "admin" },
  ];
  for (const a of accounts) {
    const id = crypto.randomUUID();
    db.users.push({
      id, email: a.email, passwordHash: hashPassword(a.pw), status: "active", role: a.role,
      ageVerified: true, birthDate: a.profile?.birthDate ?? null, termsAcceptedAt: created, createdAt: created, lastActiveAt: created,
    });
    db.verifications.push({ userId: id, method: "seed", status: "passed", createdAt: created });
    if (a.profile && a.prefs) {
      db.profiles.push({ userId: id, ...a.profile });
      db.preferences.push({ userId: id, ...a.prefs });
    }
  }
  return db;
}
