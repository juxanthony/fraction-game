/**
 * Teacher-side cloud reads: load every pupil linked to a class code.
 * Pupils enter the teacher's class code once when creating their player;
 * all their records are mirrored to Firestore tagged with that code, so the
 * teacher dashboard can monitor the whole class from any device.
 */

import { getFirebaseConfig } from "./config";
import type { AttemptRecord, MatchRecord, StudentProfile } from "@/lib/storage/models";

export interface ClassData {
  classCode: string;
  profiles: StudentProfile[];
  attemptsByProfile: Map<string, AttemptRecord[]>;
  matchesByProfile: Map<string, MatchRecord[]>;
}

export function normalizeClassCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Fetch all cloud data for one class code. Returns null when Firebase is not
 * configured or the network/rules reject the query.
 */
export async function fetchClassData(rawCode: string): Promise<ClassData | null> {
  const config = getFirebaseConfig();
  const classCode = normalizeClassCode(rawCode);
  if (!config || !classCode) return null;
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth, signInAnonymously } = await import("firebase/auth");
    const { getFirestore, collection, query, where, getDocs, limit } = await import(
      "firebase/firestore"
    );
    const app = getApps()[0] ?? initializeApp(config);
    await signInAnonymously(getAuth(app)).catch(() => undefined);
    const db = getFirestore(app);

    const byCode = (name: string, max: number) =>
      getDocs(query(collection(db, name), where("classCode", "==", classCode), limit(max)));

    const [pSnap, aSnap, mSnap] = await Promise.all([
      byCode("profiles", 300),
      byCode("attempts", 10000),
      byCode("matches", 3000),
    ]);

    const profiles = pSnap.docs
      .map((d) => d.data() as StudentProfile)
      .sort((a, b) => a.name.localeCompare(b.name));

    const attemptsByProfile = new Map<string, AttemptRecord[]>();
    for (const doc of aSnap.docs) {
      const a = doc.data() as AttemptRecord;
      const list = attemptsByProfile.get(a.profileId) ?? [];
      list.push(a);
      attemptsByProfile.set(a.profileId, list);
    }
    for (const list of attemptsByProfile.values()) list.sort((a, b) => a.timestamp - b.timestamp);

    const matchesByProfile = new Map<string, MatchRecord[]>();
    for (const doc of mSnap.docs) {
      const m = doc.data() as MatchRecord;
      const list = matchesByProfile.get(m.profileId) ?? [];
      list.push(m);
      matchesByProfile.set(m.profileId, list);
    }
    for (const list of matchesByProfile.values()) list.sort((a, b) => a.timestamp - b.timestamp);

    return { classCode, profiles, attemptsByProfile, matchesByProfile };
  } catch {
    return null;
  }
}
