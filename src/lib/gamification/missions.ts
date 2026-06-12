import type { MissionProgress } from "@/lib/storage/models";

export interface MissionDef {
  id: string;
  nameKey: string;
  target: number;
  xp: number;
  progress: (p: MissionProgress) => number;
}

const ALL_MISSIONS: MissionDef[] = [
  { id: "answer10", nameKey: "mission.answer10", target: 10, xp: 30, progress: (p) => p.counters.answered },
  { id: "win3", nameKey: "mission.win3", target: 3, xp: 50, progress: (p) => p.counters.wins },
  { id: "score80", nameKey: "mission.score80", target: 1, xp: 40, progress: (p) => (p.counters.bestMatchAccuracy >= 80 ? 1 : 0) },
  { id: "streak5", nameKey: "mission.streak5", target: 1, xp: 30, progress: (p) => (p.counters.bestStreak >= 5 ? 1 : 0) },
  { id: "practice15", nameKey: "mission.practice15", target: 15, xp: 30, progress: (p) => p.counters.practiceAnswered },
];

/** Deterministic set of 3 daily missions, rotating with the date. */
export function dailyMissions(dateKey: string): MissionDef[] {
  let hash = 0;
  for (const ch of dateKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const start = hash % ALL_MISSIONS.length;
  return [0, 1, 2].map((i) => ALL_MISSIONS[(start + i * 2) % ALL_MISSIONS.length])
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
    .slice(0, 3);
}

/** Returns mission ids that just completed (to be rewarded once). */
export function newlyCompleted(progress: MissionProgress): MissionDef[] {
  return dailyMissions(progress.date).filter(
    (m) => m.progress(progress) >= m.target && !progress.claimed.includes(m.id)
  );
}
