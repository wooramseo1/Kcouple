export type UserStatus = "pending" | "active" | "suspended" | "deleted";
export type Role = "user" | "admin";
export type Gender = "male" | "female" | "nonbinary";
export type UserGroup = "korean" | "foreigner";
export type GroupPreference = UserGroup | "any";
export type Goal = "serious" | "long_term" | "casual" | "open";
export type LangLevel = "basic" | "conversational" | "fluent" | "native";
export type SwipeAction = "like" | "pass";
export type MatchStatus = "active" | "unmatched" | "blocked";
export type ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";
export type ReportReason = "fake" | "harassment" | "sexual" | "scam" | "spam" | "underage" | "other";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  role: Role;
  ageVerified: boolean;
  /** Birth date captured by the adult check; private. */
  birthDate: string | null;
  termsAcceptedAt: string | null;
  createdAt: string;
  lastActiveAt: string;
  /** Seeded demo profile that auto-responds so the MVP can be tried alone. */
  isDemo?: boolean;
}

export interface SpokenLanguage {
  code: string;
  level: LangLevel;
}

export interface Profile {
  userId: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD, never exposed publicly
  gender: Gender;
  group: UserGroup;
  nationality: string; // ISO 3166-1 alpha-2
  city: string;
  languages: SpokenLanguage[];
  goal: Goal;
  bio: string;
  interests: string[];
  /** data: URLs for uploads, or "demo:<hue>:<emoji>" placeholders for seeded users. */
  photos: string[];
  isVisible: boolean;
}

export interface Preferences {
  userId: string;
  preferredGenders: Gender[];
  minAge: number;
  maxAge: number;
  lookingFor: GroupPreference;
}

export interface Swipe {
  fromUserId: string;
  toUserId: string;
  action: SwipeAction;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string; // user1Id < user2Id (normalized pair)
  user2Id: string;
  status: MatchStatus;
  createdAt: string;
  lastReadAt: Record<string, string>;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  matchId: string | null;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  handledBy: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRecord {
  userId: string;
  method: string;
  status: "passed" | "failed";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

/** Shape returned to other users — no email, birth date or verification data. */
export interface PublicProfile {
  userId: string;
  nickname: string;
  age: number;
  gender: Gender;
  group: UserGroup;
  nationality: string;
  city: string;
  languages: SpokenLanguage[];
  goal: Goal;
  bio: string;
  interests: string[];
  photos: string[];
  isDemo?: boolean;
}
