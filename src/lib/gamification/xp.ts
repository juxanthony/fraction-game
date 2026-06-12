/** XP economy: 10 XP per correct answer, 50 per match win, 100 per completed challenge, streak bonuses every 5 in a row. */

export const XP_CORRECT = 10;
export const XP_WIN = 50;
export const XP_CHALLENGE_COMPLETE = 100;
export const XP_STREAK_BONUS = 5;
export const STREAK_BONUS_EVERY = 5;

/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForNextLevel(level) && level < 99) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return { level, intoLevel: remaining, needed: xpForNextLevel(level) };
}
