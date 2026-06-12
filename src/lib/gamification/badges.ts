import type { AttemptRecord, StudentProfile } from "@/lib/storage/models";

export interface BadgeDef {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
}

export const BADGES: BadgeDef[] = [
  { id: "beginner", icon: "🌱", nameKey: "badge.beginner", descKey: "badge.beginner.desc" },
  { id: "explorer", icon: "🧭", nameKey: "badge.explorer", descKey: "badge.explorer.desc" },
  { id: "warrior", icon: "⚔️", nameKey: "badge.warrior", descKey: "badge.warrior.desc" },
  { id: "master", icon: "🎓", nameKey: "badge.master", descKey: "badge.master.desc" },
  { id: "champion", icon: "🏆", nameKey: "badge.champion", descKey: "badge.champion.desc" },
];

/** Evaluate badge conditions; returns ids newly earned (not yet on profile). */
export function evaluateBadges(profile: StudentProfile, attempts: AttemptRecord[]): string[] {
  const correct = attempts.filter((a) => a.correct).length;
  const total = attempts.length;
  const accuracy = total > 0 ? correct / total : 0;

  const earned: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && !profile.badges.includes(id)) earned.push(id);
  };

  check("beginner", correct >= 10);
  check("explorer", correct >= 50);
  check("warrior", profile.matchesWon >= 5);
  check("master", total >= 100 && accuracy >= 0.8);
  check("champion", profile.tournamentRound >= 5);
  return earned;
}
