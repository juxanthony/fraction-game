import type { Topic, ErrorTag } from "@/lib/question-generator/types";

export type GameMode = "practice" | "challenge" | "tournament" | "multiplayer";

export interface StudentProfile {
  id: string;
  name: string;
  className: string;
  /** Teacher's class code — links this pupil to a teacher's cloud dashboard. */
  classCode?: string;
  avatar: string;
  createdAt: number;
  lastActiveAt: number;
  xp: number;
  badges: string[];
  matchesPlayed: number;
  matchesWon: number;
  /** Total active learning time in ms (sum of question response times). */
  totalTimeMs: number;
  /** Highest tournament round unlocked (0-based index, 0..5; 5 = champion). */
  tournamentRound: number;
}

/**
 * One question attempt — the unit of the research dataset. Captures the
 * pupil's problem-solving pathway: what was asked, what they chose, how long
 * they took, whether they used scaffolds, and how the error is classified.
 */
export interface AttemptRecord {
  id: string;
  profileId: string;
  timestamp: number;
  mode: GameMode;
  topic: Topic;
  level: number;
  difficulty: number;
  promptKey: string;
  correct: boolean;
  /** The option text the pupil selected ("" when timed out). */
  selectedText: string;
  correctText: string;
  /** Misconception classification when wrong; "timeout" when time expired. */
  errorTag?: ErrorTag | "timeout";
  responseTimeMs: number;
  hintUsed: boolean;
  polyaViewed: boolean;
  /** Consecutive-correct streak after this attempt. */
  streakAfter: number;
}

export interface MatchRecord {
  id: string;
  profileId: string;
  timestamp: number;
  mode: GameMode;
  /** Practice topic level (1–6) or undefined for mixed. */
  level?: number;
  result: "win" | "lose" | "draw";
  playerScore: number;
  opponentScore: number;
  questionsAnswered: number;
  correctCount: number;
  durationMs: number;
  xpEarned: number;
  bestStreak: number;
  tournamentRound?: number;
}

export interface MissionProgress {
  date: string; // YYYY-MM-DD
  counters: {
    answered: number;
    wins: number;
    bestMatchAccuracy: number;
    bestStreak: number;
    practiceAnswered: number;
  };
  claimed: string[]; // mission ids already rewarded
}
