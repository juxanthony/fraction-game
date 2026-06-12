/**
 * Learning-analytics aggregations computed over attempt records.
 * Used by both the student progress page and the teacher dashboard.
 */

import type { AttemptRecord } from "@/lib/storage/models";
import type { Topic } from "@/lib/question-generator/types";

export interface TopicStats {
  topic: Topic;
  attempts: number;
  correct: number;
  accuracy: number; // 0..100
  avgTimeMs: number;
  hintRate: number; // 0..100
}

export type MasteryLevel = "beginner" | "developing" | "proficient" | "mastered";

export const TOPICS: Topic[] = [
  "compare",
  "ordering",
  "equivalent",
  "addition",
  "subtraction",
  "mixedNumbers",
  "fractionOfQuantity",
  "wordProblem",
];

export function statsByTopic(attempts: AttemptRecord[]): TopicStats[] {
  return TOPICS.map((topic) => {
    const list = attempts.filter((a) => a.topic === topic);
    const correct = list.filter((a) => a.correct).length;
    const time = list.reduce((s, a) => s + a.responseTimeMs, 0);
    const hints = list.filter((a) => a.hintUsed).length;
    return {
      topic,
      attempts: list.length,
      correct,
      accuracy: list.length ? Math.round((correct / list.length) * 100) : 0,
      avgTimeMs: list.length ? Math.round(time / list.length) : 0,
      hintRate: list.length ? Math.round((hints / list.length) * 100) : 0,
    };
  }).filter((s) => s.attempts > 0);
}

/**
 * Mastery based on the most recent 10 attempts per topic — recency matters
 * more than lifetime average when measuring growth.
 */
export function masteryForTopic(attempts: AttemptRecord[], topic: Topic): MasteryLevel | null {
  const recent = attempts.filter((a) => a.topic === topic).slice(-10);
  if (recent.length < 3) return recent.length === 0 ? null : "beginner";
  const acc = recent.filter((a) => a.correct).length / recent.length;
  if (acc >= 0.85) return "mastered";
  if (acc >= 0.7) return "proficient";
  if (acc >= 0.5) return "developing";
  return "beginner";
}

export interface ErrorPatternStat {
  errorTag: string;
  count: number;
  share: number; // % of all errors
}

export function commonErrors(attempts: AttemptRecord[], limit = 6): ErrorPatternStat[] {
  const wrong = attempts.filter((a) => !a.correct && a.errorTag);
  const counts = new Map<string, number>();
  for (const a of wrong) counts.set(a.errorTag!, (counts.get(a.errorTag!) ?? 0) + 1);
  return [...counts.entries()]
    .map(([errorTag, count]) => ({
      errorTag,
      count,
      share: Math.round((count / wrong.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface DailyPoint {
  date: string;
  attempts: number;
  accuracy: number; // 0..100
}

/** Accuracy per day — the growth trend line. */
export function dailyTrend(attempts: AttemptRecord[], days = 14): DailyPoint[] {
  const byDay = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const d = new Date(a.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = byDay.get(key) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    byDay.set(key, entry);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, { total, correct }]) => ({
      date,
      attempts: total,
      accuracy: Math.round((correct / total) * 100),
    }));
}

export function overallAccuracy(attempts: AttemptRecord[]): number {
  if (attempts.length === 0) return 0;
  return Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100);
}

export function weakTopics(attempts: AttemptRecord[], threshold = 60): TopicStats[] {
  return statsByTopic(attempts).filter((s) => s.attempts >= 5 && s.accuracy < threshold);
}
