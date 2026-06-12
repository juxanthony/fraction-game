/**
 * Match recording service: persists attempt-level research data, awards XP,
 * updates missions and badges, and unlocks tournament rounds. This is the
 * single write-path from gameplay into the data layer.
 */

import { uid } from "@/lib/math/random";
import type { Question } from "@/lib/question-generator/types";
import type { MatchState } from "./engine";
import {
  addAttempt,
  addMatch,
  getAttempts,
  getMissionProgress,
  saveMissionProgress,
  updateProfile,
} from "@/lib/storage/local";
import type { AttemptRecord, StudentProfile } from "@/lib/storage/models";
import { XP_CHALLENGE_COMPLETE, XP_CORRECT, XP_WIN } from "@/lib/gamification/xp";
import { evaluateBadges } from "@/lib/gamification/badges";
import { newlyCompleted } from "@/lib/gamification/missions";

export interface AttemptContext {
  profile: StudentProfile;
  state: MatchState;
  question: Question;
  selectedIndex: number | null;
  responseTimeMs: number;
  hintUsed: boolean;
  polyaViewed: boolean;
}

export function recordAttempt(ctx: AttemptContext): AttemptRecord {
  const { question, selectedIndex } = ctx;
  const correct = selectedIndex !== null && selectedIndex === question.correctIndex;
  const selected = selectedIndex !== null ? question.options[selectedIndex] : null;
  const attempt: AttemptRecord = {
    id: uid(),
    profileId: ctx.profile.id,
    timestamp: Date.now(),
    mode: ctx.state.config.mode,
    topic: question.topic,
    level: question.level,
    difficulty: question.difficulty,
    promptKey: question.promptKey,
    correct,
    selectedText: selected?.text ?? "",
    correctText: question.options[question.correctIndex].text,
    errorTag: correct ? undefined : selectedIndex === null ? "timeout" : selected?.errorTag ?? "random-near",
    responseTimeMs: ctx.responseTimeMs,
    hintUsed: ctx.hintUsed,
    polyaViewed: ctx.polyaViewed,
    streakAfter: correct ? ctx.state.streak + 1 : 0,
  };
  addAttempt(attempt);
  return attempt;
}

export interface MatchOutcome {
  xpEarned: number;
  newBadges: string[];
  completedMissions: { id: string; xp: number }[];
  leveledUp: boolean;
}

/**
 * Close out a finished match: XP, profile stats, missions, badges,
 * tournament progression. Returns everything the results screen shows.
 */
export function finalizeMatch(
  profile: StudentProfile,
  state: MatchState,
  streakBonusXpTotal: number
): MatchOutcome {
  const durationMs = Date.now() - state.startedAt;
  const isWin = state.result === "win";
  const accuracy =
    state.questionIndex + 1 > 0
      ? Math.round((state.correctCount / (state.questionIndex + 1)) * 100)
      : 0;

  let xp = state.correctCount * XP_CORRECT + streakBonusXpTotal;
  if (isWin) xp += XP_WIN;
  if (state.config.mode === "challenge") xp += XP_CHALLENGE_COMPLETE;

  /* mission progress */
  const missions = getMissionProgress(profile.id);
  missions.counters.answered += state.questionIndex + 1;
  if (state.config.mode === "practice") missions.counters.practiceAnswered += state.questionIndex + 1;
  if (isWin) missions.counters.wins += 1;
  missions.counters.bestMatchAccuracy = Math.max(missions.counters.bestMatchAccuracy, accuracy);
  missions.counters.bestStreak = Math.max(missions.counters.bestStreak, state.bestStreak);
  const completed = newlyCompleted(missions);
  for (const m of completed) {
    missions.claimed.push(m.id);
    xp += m.xp;
  }
  saveMissionProgress(profile.id, missions);

  /* profile updates */
  const updated: StudentProfile = {
    ...profile,
    xp: profile.xp + xp,
    matchesPlayed: profile.matchesPlayed + 1,
    matchesWon: profile.matchesWon + (isWin ? 1 : 0),
    totalTimeMs: profile.totalTimeMs + durationMs,
    lastActiveAt: Date.now(),
    tournamentRound:
      isWin && state.config.tournamentRound !== undefined
        ? Math.max(profile.tournamentRound, state.config.tournamentRound + 1)
        : profile.tournamentRound,
  };

  /* badges (need updated stats) */
  const attempts = getAttempts(profile.id);
  const newBadges = evaluateBadges(updated, attempts);
  updated.badges = [...updated.badges, ...newBadges];
  updateProfile(updated);

  addMatch({
    id: uid(),
    profileId: profile.id,
    timestamp: Date.now(),
    mode: state.config.mode,
    level: state.config.level,
    result: state.result ?? "draw",
    playerScore: state.playerScore,
    opponentScore: state.opponentScore,
    questionsAnswered: state.questionIndex + 1,
    correctCount: state.correctCount,
    durationMs,
    xpEarned: xp,
    bestStreak: state.bestStreak,
    tournamentRound: state.config.tournamentRound,
  });

  const before = Math.floor(profile.xp / 100);
  const after = Math.floor(updated.xp / 100);

  return {
    xpEarned: xp,
    newBadges,
    completedMissions: completed.map((m) => ({ id: m.id, xp: m.xp })),
    leveledUp: after > before,
  };
}
