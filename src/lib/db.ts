/**
 * Development data store.
 *
 * The MVP target is Supabase PostgreSQL (see supabase/migrations). This in-memory
 * store mirrors that schema so the whole product can run locally without
 * credentials; it is snapshotted to .data/db.json so restarts keep state.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  AuditLog, Block, Match, Message, Preferences, Profile, Report, Session, Swipe, User, VerificationRecord,
} from "./types";
import { emptyDatabase, seed } from "./seed";
import { isDemoMode } from "./config";
import { hashPassword } from "./password";

export interface Database {
  users: User[];
  profiles: Profile[];
  preferences: Preferences[];
  swipes: Swipe[];
  matches: Match[];
  messages: Message[];
  blocks: Block[];
  reports: Report[];
  verifications: VerificationRecord[];
  auditLogs: AuditLog[];
  sessions: Session[];
}

// Point DATA_DIR at a persistent disk in production; container filesystems are wiped on restart.
const FILE = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"), "db.json");

const g = globalThis as unknown as { __kcoupleDb?: Database; __kcoupleSaveTimer?: NodeJS.Timeout };

function initial(): Database {
  return isDemoMode() ? seed() : emptyDatabase();
}

function load(): Database {
  let db: Database;
  try {
    db = JSON.parse(fs.readFileSync(FILE, "utf8")) as Database;
  } catch {
    db = initial();
  }
  ensureAdmin(db);
  persist(db);
  return db;
}

/** Creates (or re-keys) the operator account from ADMIN_EMAIL / ADMIN_PASSWORD. */
function ensureAdmin(db: Database) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) {
    console.warn("[db] ADMIN_PASSWORD must be at least 12 characters; admin account not created.");
    return;
  }
  const t = new Date().toISOString();
  const existing = db.users.find((u) => u.email === email);
  if (existing) {
    existing.role = "admin";
    existing.status = "active";
    existing.passwordHash = hashPassword(password);
    return;
  }
  db.users.push({
    id: crypto.randomUUID(), email, passwordHash: hashPassword(password), status: "active", role: "admin",
    ageVerified: true, birthDate: null, termsAcceptedAt: t, createdAt: t, lastActiveAt: t,
  });
}

function persist(db: Database) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db));
  } catch (err) {
    console.warn("[db] could not persist snapshot:", err);
  }
}

export function db(): Database {
  if (!g.__kcoupleDb) g.__kcoupleDb = load();
  return g.__kcoupleDb;
}

/** Call after any mutation; writes are debounced. */
export function save() {
  if (g.__kcoupleSaveTimer) clearTimeout(g.__kcoupleSaveTimer);
  g.__kcoupleSaveTimer = setTimeout(() => persist(db()), 200);
}

export function id(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
