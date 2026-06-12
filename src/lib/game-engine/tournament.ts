import type { MatchConfig } from "./engine";

export interface TournamentRound {
  index: number;
  nameKey: string;
  opponentKey: string;
  icon: string;
  aiAccuracy: number;
  minDifficulty: 1 | 2 | 3;
  totalQuestions: number;
}

/** Championship ladder: School → District → State → National → Champion Cup. */
export const TOURNAMENT_ROUNDS: TournamentRound[] = [
  { index: 0, nameKey: "tour.round.school", opponentKey: "tour.opponent.school", icon: "🏫", aiAccuracy: 0.25, minDifficulty: 1, totalQuestions: 10 },
  { index: 1, nameKey: "tour.round.district", opponentKey: "tour.opponent.district", icon: "🏘️", aiAccuracy: 0.35, minDifficulty: 1, totalQuestions: 10 },
  { index: 2, nameKey: "tour.round.state", opponentKey: "tour.opponent.state", icon: "🌆", aiAccuracy: 0.45, minDifficulty: 2, totalQuestions: 12 },
  { index: 3, nameKey: "tour.round.national", opponentKey: "tour.opponent.national", icon: "🇲🇾", aiAccuracy: 0.55, minDifficulty: 2, totalQuestions: 12 },
  { index: 4, nameKey: "tour.round.champion", opponentKey: "tour.opponent.champion", icon: "👑", aiAccuracy: 0.65, minDifficulty: 3, totalQuestions: 14 },
];

export function tournamentMatchConfig(round: TournamentRound): MatchConfig {
  return {
    mode: "tournament",
    totalQuestions: round.totalQuestions,
    timePerQuestion: 30,
    aiAccuracy: round.aiAccuracy,
    minDifficulty: round.minDifficulty,
    tournamentRound: round.index,
  };
}
