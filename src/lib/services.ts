import { db, id, now, save } from "./db";
import { HttpError } from "./http";
import { ageOn, mutuallyEligible, normalizePair, score, type Member } from "./matching";
import { MAX_MESSAGE_LENGTH } from "./constants";
import type { Match, Message, PublicProfile, ReportReason, SwipeAction, User } from "./types";

export function member(userId: string): Member | null {
  const d = db();
  const user = d.users.find((u) => u.id === userId);
  const profile = d.profiles.find((p) => p.userId === userId);
  const prefs = d.preferences.find((p) => p.userId === userId);
  return user && profile && prefs ? { user, profile, prefs } : null;
}

export function toPublic(m: Member): PublicProfile {
  const p = m.profile;
  return {
    userId: p.userId, nickname: p.nickname, age: ageOn(p.birthDate), gender: p.gender, group: p.group,
    nationality: p.nationality, city: p.city, languages: p.languages, goal: p.goal, bio: p.bio,
    interests: p.interests, photos: p.photos, isDemo: m.user.isDemo,
  };
}

export function audit(actorId: string, action: string, targetId: string | null, meta?: Record<string, unknown>) {
  db().auditLogs.push({ id: id(), actorId, action, targetId, meta, createdAt: now() });
  save();
}

export function isBlockedEitherWay(a: string, b: string): boolean {
  return db().blocks.some((x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a));
}

/* ---------------- Discover ---------------- */

export function discover(userId: string, limit = 10): PublicProfile[] {
  const me = member(userId);
  if (!me) throw new HttpError(409, "profile_required");
  const d = db();
  const swiped = new Set(d.swipes.filter((s) => s.fromUserId === userId).map((s) => s.toUserId));
  const matched = new Set(
    d.matches.filter((m) => m.user1Id === userId || m.user2Id === userId).map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id)),
  );
  const t = new Date();
  return d.profiles
    .map((p) => member(p.userId))
    .filter((c): c is Member =>
      !!c && !swiped.has(c.user.id) && !matched.has(c.user.id) && !isBlockedEitherWay(userId, c.user.id) && mutuallyEligible(me, c, t))
    .map((c) => ({ c, s: score(me, c, t) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ c }) => toPublic(c));
}

/* ---------------- Swipes & matching (PRD §4.2) ---------------- */

function findMatch(a: string, b: string): Match | undefined {
  const [u1, u2] = normalizePair(a, b);
  return db().matches.find((m) => m.user1Id === u1 && m.user2Id === u2);
}

function upsertSwipe(from: string, to: string, action: SwipeAction) {
  const d = db();
  const existing = d.swipes.find((s) => s.fromUserId === from && s.toUserId === to);
  if (existing) {
    existing.action = action;
    existing.createdAt = now();
  } else {
    d.swipes.push({ fromUserId: from, toUserId: to, action, createdAt: now() });
  }
}

/** Demo profiles like back ~65% of eligible users, deterministically per pair. */
function demoLikesBack(demoId: string, userId: string): boolean {
  let h = 0;
  for (const ch of demoId + userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 100 < 65;
}

export function swipe(userId: string, targetId: string, action: SwipeAction): { matched: boolean; matchId: string | null } {
  if (userId === targetId) throw new HttpError(400, "cannot_swipe_self");
  const me = member(userId);
  const target = member(targetId);
  if (!me || !target) throw new HttpError(404, "user_not_found");
  if (isBlockedEitherWay(userId, targetId) || !mutuallyEligible(me, target)) throw new HttpError(403, "not_eligible");

  // Everything below runs synchronously on a single-threaded store, which plays the role of the DB transaction.
  upsertSwipe(userId, targetId, action);
  if (action === "pass") {
    save();
    return { matched: false, matchId: null };
  }
  if (target.user.isDemo && demoLikesBack(targetId, userId)) upsertSwipe(targetId, userId, "like");

  const theyLiked = db().swipes.some((s) => s.fromUserId === targetId && s.toUserId === userId && s.action === "like");
  if (!theyLiked) {
    save();
    return { matched: false, matchId: null };
  }
  // Normalized pair + lookup guarantees at most one match per pair.
  let match = findMatch(userId, targetId);
  if (!match) {
    const [user1Id, user2Id] = normalizePair(userId, targetId);
    match = { id: id(), user1Id, user2Id, status: "active", createdAt: now(), lastReadAt: {} };
    db().matches.push(match);
  }
  save();
  return { matched: match.status === "active", matchId: match.id };
}

/* ---------------- Matches & chat (PRD §4.3) ---------------- */

export function otherId(m: Match, userId: string) {
  return m.user1Id === userId ? m.user2Id : m.user1Id;
}

export function requireMatchParticipant(matchId: string, userId: string): Match {
  const m = db().matches.find((x) => x.id === matchId);
  if (!m || (m.user1Id !== userId && m.user2Id !== userId)) throw new HttpError(404, "match_not_found");
  return m;
}

export interface MatchSummary {
  matchId: string;
  status: Match["status"];
  createdAt: string;
  profile: PublicProfile;
  lastMessage: Pick<Message, "content" | "senderId" | "createdAt"> | null;
  unread: number;
}

export function listMatches(userId: string): MatchSummary[] {
  const d = db();
  return d.matches
    .filter((m) => (m.user1Id === userId || m.user2Id === userId) && m.status === "active")
    .map((m) => {
      const other = member(otherId(m, userId));
      if (!other || other.user.status !== "active") return null;
      const msgs = d.messages.filter((x) => x.matchId === m.id);
      const last = msgs[msgs.length - 1];
      const readAt = m.lastReadAt[userId] ?? "";
      return {
        matchId: m.id, status: m.status, createdAt: m.createdAt, profile: toPublic(other),
        lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt } : null,
        unread: msgs.filter((x) => x.senderId !== userId && x.createdAt > readAt).length,
      };
    })
    .filter((x): x is MatchSummary => !!x)
    .sort((a, b) => (b.lastMessage?.createdAt ?? b.createdAt).localeCompare(a.lastMessage?.createdAt ?? a.createdAt));
}

export function listMessages(matchId: string, userId: string, since?: string): Message[] {
  const m = requireMatchParticipant(matchId, userId);
  m.lastReadAt[userId] = now();
  save();
  return db().messages.filter((x) => x.matchId === matchId && (!since || x.createdAt > since));
}

const URL_RE = /(https?:\/\/|www\.)\S+|\b[\w-]+\.(com|net|org|io|ly|me|kr|xyz|link)\b/i;

export function sendMessage(matchId: string, user: User, raw: string): Message {
  const m = requireMatchParticipant(matchId, user.id);
  const content = raw.trim();
  if (!content) throw new HttpError(400, "empty_message");
  if (content.length > MAX_MESSAGE_LENGTH) throw new HttpError(400, "message_too_long");
  if (URL_RE.test(content)) throw new HttpError(400, "links_not_allowed", "Links are not allowed in chat for safety.");
  const other = otherId(m, user.id);
  const otherUser = db().users.find((u) => u.id === other);
  if (m.status !== "active" || isBlockedEitherWay(user.id, other) || otherUser?.status !== "active") {
    throw new HttpError(403, "chat_closed");
  }
  const msg: Message = { id: id(), matchId, senderId: user.id, content, createdAt: now() };
  db().messages.push(msg);
  m.lastReadAt[user.id] = msg.createdAt;
  save();
  if (otherUser.isDemo) scheduleDemoReply(m, other);
  return msg;
}

const DEMO_REPLIES = {
  ko: ["안녕하세요! 매칭돼서 반가워요 😊", "오 그거 재밌네요! 주말엔 보통 뭐 하세요?", "저도 그거 좋아해요 ㅎㅎ 다음에 같이 가요!", "한국 생활은 어때요?"],
  en: ["Hey! So nice to match with you 😊", "Haha that's fun! What do you usually do on weekends?", "Oh I love that too! We should go sometime.", "How long have you been in Korea?"],
};

function scheduleDemoReply(m: Match, demoId: string) {
  const sent = db().messages.filter((x) => x.matchId === m.id && x.senderId === demoId).length;
  const demo = member(demoId);
  if (!demo || sent >= DEMO_REPLIES.en.length) return;
  const lang = demo.profile.group === "korean" && !demo.profile.languages.some((l) => l.code === "en" && l.level !== "basic") ? "ko" : "en";
  setTimeout(() => {
    if (m.status !== "active") return;
    db().messages.push({ id: id(), matchId: m.id, senderId: demoId, content: DEMO_REPLIES[lang][sent], createdAt: now() });
    save();
  }, 1800 + Math.random() * 1500);
}

export function unmatch(matchId: string, userId: string) {
  const m = requireMatchParticipant(matchId, userId);
  m.status = "unmatched";
  audit(userId, "match.unmatch", matchId);
}

/* ---------------- Safety (PRD §4.4) ---------------- */

export function block(userId: string, targetId: string) {
  if (userId === targetId) throw new HttpError(400, "cannot_block_self");
  const d = db();
  if (!d.users.some((u) => u.id === targetId)) throw new HttpError(404, "user_not_found");
  if (!d.blocks.some((b) => b.blockerId === userId && b.blockedId === targetId)) {
    d.blocks.push({ blockerId: userId, blockedId: targetId, createdAt: now() });
  }
  const m = findMatch(userId, targetId);
  if (m) m.status = "blocked";
  audit(userId, "user.block", targetId);
}

export function report(userId: string, targetId: string, reason: ReportReason, detail: string, matchId: string | null) {
  if (userId === targetId) throw new HttpError(400, "cannot_report_self");
  if (!db().users.some((u) => u.id === targetId)) throw new HttpError(404, "user_not_found");
  const r = {
    id: id(), reporterId: userId, targetId, matchId, reason, detail, status: "open" as const,
    handledBy: null, resolution: null, createdAt: now(), updatedAt: now(),
  };
  db().reports.push(r);
  audit(userId, "report.create", targetId, { reportId: r.id, reason });
  return r;
}

export function deleteAccount(userId: string) {
  const d = db();
  const user = d.users.find((u) => u.id === userId);
  if (!user) return;
  // Keep a tombstone + reports/audit (legal retention); drop personal profile data and content.
  user.status = "deleted";
  user.email = `deleted+${userId}@invalid`;
  d.profiles = d.profiles.filter((p) => p.userId !== userId);
  d.preferences = d.preferences.filter((p) => p.userId !== userId);
  d.swipes = d.swipes.filter((s) => s.fromUserId !== userId && s.toUserId !== userId);
  for (const m of d.matches) if (m.user1Id === userId || m.user2Id === userId) m.status = "unmatched";
  d.messages = d.messages.filter((x) => x.senderId !== userId);
  d.sessions = d.sessions.filter((s) => s.userId !== userId);
  audit(userId, "account.delete", userId);
}
