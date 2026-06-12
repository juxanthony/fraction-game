/**
 * Tug-of-war match engine — a pure state machine consumed by the game UI.
 * Rope position runs from -WIN_AT (opponent wins) to +WIN_AT (player wins).
 * Correct answer: +1 pull. Wrong answer / timeout: −1 pull. In tournament
 * mode the AI opponent also answers each turn with probability `aiAccuracy`,
 * pulling the rope back.
 */

import type { Question } from "@/lib/question-generator/types";
import { questionForTurn } from "@/lib/question-generator/generator";
import type { GameMode } from "@/lib/storage/models";

export const WIN_AT = 5;

export interface MatchConfig {
  mode: GameMode;
  /** Fixed number of questions; Infinity for practice. */
  totalQuestions: number;
  /** Seconds per question; null = untimed. */
  timePerQuestion: number | null;
  /** Probability the AI opponent answers correctly each turn (tournament). */
  aiAccuracy: number;
  /** Restrict to one curriculum level (1–6); undefined = mixed sweep. */
  level?: number;
  /** Minimum difficulty floor (tournament rounds get harder). */
  minDifficulty?: 1 | 2 | 3;
  tournamentRound?: number;
}

export type MatchPhase = "playing" | "feedback" | "finished";

export interface TurnResult {
  correct: boolean;
  timedOut: boolean;
  aiCorrect: boolean;
  ropeDelta: number;
  streakBonusXp: number;
}

export interface MatchState {
  config: MatchConfig;
  phase: MatchPhase;
  question: Question;
  questionIndex: number;
  ropePosition: number; // -WIN_AT .. +WIN_AT, + = player side
  playerScore: number;
  opponentScore: number;
  correctCount: number;
  streak: number;
  bestStreak: number;
  lastResult: TurnResult | null;
  startedAt: number;
  result: "win" | "lose" | "draw" | null;
}

export function createMatch(config: MatchConfig): MatchState {
  return {
    config,
    phase: "playing",
    question: nextQuestion(config, 0),
    questionIndex: 0,
    ropePosition: 0,
    playerScore: 0,
    opponentScore: 0,
    correctCount: 0,
    streak: 0,
    bestStreak: 0,
    lastResult: null,
    startedAt: Date.now(),
    result: null,
  };
}

function nextQuestion(config: MatchConfig, index: number): Question {
  const total = Number.isFinite(config.totalQuestions) ? config.totalQuestions : 12;
  return questionForTurn(index % total, total, {
    level: config.level,
    minDifficulty: config.minDifficulty,
  });
}

/** Apply the player's answer (optionIndex null = timeout). */
export function answer(state: MatchState, optionIndex: number | null): MatchState {
  if (state.phase !== "playing") return state;
  const correct = optionIndex !== null && optionIndex === state.question.correctIndex;
  const timedOut = optionIndex === null;
  const aiCorrect = state.config.aiAccuracy > 0 && Math.random() < state.config.aiAccuracy;

  let ropeDelta = correct ? 1 : -1;
  if (aiCorrect) ropeDelta -= 1;

  const streak = correct ? state.streak + 1 : 0;
  const streakBonusXp = correct && streak > 0 && streak % 5 === 0 ? 5 : 0;

  const ropePosition = Math.max(-WIN_AT, Math.min(WIN_AT, state.ropePosition + ropeDelta));

  const next: MatchState = {
    ...state,
    phase: "feedback",
    ropePosition,
    playerScore: state.playerScore + (correct ? 1 : 0),
    opponentScore: state.opponentScore + (correct ? 0 : 1) + (aiCorrect ? 1 : 0),
    correctCount: state.correctCount + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastResult: { correct, timedOut, aiCorrect, ropeDelta, streakBonusXp },
  };

  return maybeFinish(next);
}

function maybeFinish(state: MatchState): MatchState {
  const { config, ropePosition, questionIndex } = state;
  const lastQuestion = questionIndex + 1 >= config.totalQuestions;
  const ropeDecided = Math.abs(ropePosition) >= WIN_AT && config.mode !== "practice";

  if (!ropeDecided && !lastQuestion) return state;
  if (config.mode === "practice" && !lastQuestion) return state;

  const result: MatchState["result"] =
    ropePosition > 0 ? "win" : ropePosition < 0 ? "lose" : "draw";
  return { ...state, result };
}

/** Advance after feedback: either next question or the finished screen. */
export function advance(state: MatchState): MatchState {
  if (state.phase !== "feedback") return state;
  if (state.result !== null) return { ...state, phase: "finished" };
  const questionIndex = state.questionIndex + 1;
  return {
    ...state,
    phase: "playing",
    questionIndex,
    question: nextQuestion(state.config, questionIndex),
    lastResult: null,
  };
}

/** End an open-ended practice session from the UI. */
export function endPractice(state: MatchState): MatchState {
  const result: MatchState["result"] =
    state.ropePosition > 0 ? "win" : state.ropePosition < 0 ? "lose" : "draw";
  return { ...state, phase: "finished", result };
}
