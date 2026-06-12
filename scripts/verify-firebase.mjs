/**
 * Verifies Firebase connectivity using the values in .env.local:
 *   1. Anonymous Authentication sign-in
 *   2. Firestore write + read + delete (profiles/_healthcheck)
 *
 * Run:  node scripts/verify-firebase.mjs
 */
import { readFileSync } from "fs";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m) env[m[1]] = m[2];
}

const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
console.log("Config loaded from .env.local:");
for (const [k, v] of Object.entries(config)) {
  console.log(`  ${k}: ${v ? (v === "..." ? "PLACEHOLDER (...)" : "set") : "MISSING"}`);
}

if (Object.values(config).some((v) => !v || v === "...")) {
  console.log("\nRESULT: cannot test — fill in real values in .env.local first.");
  process.exit(2);
}

const { initializeApp } = await import("firebase/app");
const { getAuth, signInAnonymously } = await import("firebase/auth");
const { getFirestore, doc, setDoc, getDoc, deleteDoc } = await import("firebase/firestore");

const app = initializeApp(config);
try {
  const cred = await signInAnonymously(getAuth(app));
  console.log("\n1. Anonymous Authentication: OK (uid:", cred.user.uid + ")");
} catch (e) {
  console.log("\n1. Anonymous Authentication: FAILED —", e.code || e.message);
  console.log("   Hint: enable Authentication → Sign-in method → Anonymous in the Firebase console.");
  process.exit(1);
}
try {
  const db = getFirestore(app);
  const ref = doc(db, "profiles", "_healthcheck");
  await setDoc(ref, { ping: Date.now() });
  const snap = await getDoc(ref);
  console.log("2. Firestore write/read: OK (ping:", snap.data()?.ping + ")");
  await deleteDoc(ref).catch(() => {});
} catch (e) {
  console.log("2. Firestore write/read: FAILED —", e.code || e.message);
  console.log("   Hint: create the Firestore database and check your security rules (docs/DATABASE_SCHEMA.md).");
  process.exit(1);
}
console.log("\nRESULT: Firebase is fully working.");
process.exit(0);
