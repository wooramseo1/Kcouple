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
import { seed } from "./seed";

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

const FILE = path.join(process.cwd(), ".data", "db.json");

const g = globalThis as unknown as { __kcoupleDb?: Database; __kcoupleSaveTimer?: NodeJS.Timeout };

function load(): Database {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Database;
  } catch {
    const db = seed();
    persist(db);
    return db;
  }
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

export function resetDatabase() {
  g.__kcoupleDb = seed();
  persist(g.__kcoupleDb);
}

export function id(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
