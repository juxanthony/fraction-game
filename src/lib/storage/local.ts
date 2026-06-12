/**
 * Local-first data layer. Everything is persisted to localStorage so the game
 * works fully offline (important for classroom devices with patchy network).
 * When Firebase is configured, the cloud-sync module mirrors writes to
 * Firestore — see src/lib/firebase/sync.ts and docs/DATABASE_SCHEMA.md.
 */

import { uid } from "@/lib/math/random";
import type { AttemptRecord, MatchRecord, MissionProgress, StudentProfile } from "./models";
import { queueCloudWrite } from "@/lib/firebase/sync";

const KEYS = {
  profiles: "ftw:profiles",
  active: "ftw:active",
  attempts: (pid: string) => `ftw:attempts:${pid}`,
  matches: (pid: string) => `ftw:matches:${pid}`,
  missions: (pid: string, date: string) => `ftw:missions:${pid}:${date}`,
};

const MAX_ATTEMPTS_STORED = 5000;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or private mode — keep playing without persistence */
  }
}

/* ----------------------------- profiles ----------------------------- */

export function getProfiles(): StudentProfile[] {
  return read<StudentProfile[]>(KEYS.profiles, []);
}

export function getActiveProfile(): StudentProfile | null {
  const id = read<string | null>(KEYS.active, null);
  if (!id) return null;
  return getProfiles().find((p) => p.id === id) ?? null;
}

export function setActiveProfile(id: string): void {
  write(KEYS.active, id);
}

export function createProfile(name: string, className: string, avatar: string): StudentProfile {
  const profile: StudentProfile = {
    id: uid(),
    name: name.trim(),
    className: className.trim(),
    avatar,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    xp: 0,
    badges: [],
    matchesPlayed: 0,
    matchesWon: 0,
    totalTimeMs: 0,
    tournamentRound: 0,
  };
  const profiles = getProfiles();
  profiles.push(profile);
  write(KEYS.profiles, profiles);
  write(KEYS.active, profile.id);
  queueCloudWrite("profiles", profile.id, profile);
  return profile;
}

export function updateProfile(updated: StudentProfile): void {
  const profiles = getProfiles().map((p) => (p.id === updated.id ? updated : p));
  write(KEYS.profiles, profiles);
  queueCloudWrite("profiles", updated.id, updated);
}

/* ----------------------------- attempts ----------------------------- */

export function getAttempts(profileId: string): AttemptRecord[] {
  return read<AttemptRecord[]>(KEYS.attempts(profileId), []);
}

export function addAttempt(attempt: AttemptRecord): void {
  const list = getAttempts(attempt.profileId);
  list.push(attempt);
  if (list.length > MAX_ATTEMPTS_STORED) list.splice(0, list.length - MAX_ATTEMPTS_STORED);
  write(KEYS.attempts(attempt.profileId), list);
  queueCloudWrite("attempts", attempt.id, attempt);
}

/* ------------------------------ matches ----------------------------- */

export function getMatches(profileId: string): MatchRecord[] {
  return read<MatchRecord[]>(KEYS.matches(profileId), []);
}

export function addMatch(match: MatchRecord): void {
  const list = getMatches(match.profileId);
  list.push(match);
  write(KEYS.matches(match.profileId), list);
  queueCloudWrite("matches", match.id, match);
}

/* ------------------------------ missions ---------------------------- */

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function getMissionProgress(profileId: string): MissionProgress {
  const date = todayKey();
  return read<MissionProgress>(KEYS.missions(profileId, date), {
    date,
    counters: { answered: 0, wins: 0, bestMatchAccuracy: 0, bestStreak: 0, practiceAnswered: 0 },
    claimed: [],
  });
}

export function saveMissionProgress(profileId: string, progress: MissionProgress): void {
  write(KEYS.missions(profileId, progress.date), progress);
}
