/**
 * Optional Firestore mirroring. Firebase modules are loaded lazily so the
 * bundle stays light and the app never breaks when Firebase is not
 * configured. Writes are fire-and-forget: localStorage remains the source of
 * truth on the device; Firestore is the aggregation layer for teachers and
 * researchers (see docs/DATABASE_SCHEMA.md for the collection design and
 * security rules).
 */

import { getFirebaseConfig } from "./config";

type CollectionName = "profiles" | "attempts" | "matches";

let initPromise: Promise<{
  db: import("firebase/firestore").Firestore;
} | null> | null = null;

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const config = getFirebaseConfig();
    if (!config || typeof window === "undefined") return null;
    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const app = getApps()[0] ?? initializeApp(config);
      // Anonymous auth keeps pupil data writable without accounts while
      // security rules can still scope access (see docs/DATABASE_SCHEMA.md).
      await signInAnonymously(getAuth(app)).catch(() => undefined);
      return { db: getFirestore(app) };
    } catch {
      return null;
    }
  })();
  return initPromise;
}

/**
 * Mirror a record to Firestore. No-op when Firebase is not configured.
 * Failures are swallowed — the game must never block on the network.
 */
export function queueCloudWrite(
  collectionName: CollectionName,
  id: string,
  data: Record<string, unknown>
): void {
  if (!getFirebaseConfig() || typeof window === "undefined") return;
  void (async () => {
    try {
      const ctx = await init();
      if (!ctx) return;
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(ctx.db, collectionName, id), { ...data, syncedAt: Date.now() }, { merge: true });
    } catch {
      /* offline or rules denied — local data remains authoritative */
    }
  })();
}
