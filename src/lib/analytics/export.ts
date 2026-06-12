/**
 * Export utilities for teachers and researchers.
 * CSV files are generated with a UTF-8 BOM so Chinese text opens correctly
 * in Microsoft Excel. PDF reports use the browser's print-to-PDF on the
 * print-styled report view.
 */

import type { AttemptRecord, MatchRecord, StudentProfile } from "@/lib/storage/models";

function toCsv(rows: (string | number | boolean | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell === undefined ? "" : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\r\n");
}

export function downloadCsv(filename: string, rows: (string | number | boolean | undefined)[][]): void {
  const csv = "﻿" + toCsv(rows); // BOM → Excel-friendly UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function attemptsCsvRows(
  attempts: AttemptRecord[],
  profileById: Map<string, StudentProfile>
): (string | number | boolean | undefined)[][] {
  const header = [
    "attempt_id",
    "student_name",
    "class",
    "timestamp_iso",
    "mode",
    "topic",
    "level",
    "difficulty",
    "correct",
    "selected_answer",
    "correct_answer",
    "error_pattern",
    "response_time_ms",
    "hint_used",
    "polya_viewed",
    "streak_after",
  ];
  const rows = attempts.map((a) => {
    const p = profileById.get(a.profileId);
    return [
      a.id,
      p?.name ?? a.profileId,
      p?.className ?? "",
      new Date(a.timestamp).toISOString(),
      a.mode,
      a.topic,
      a.level,
      a.difficulty,
      a.correct,
      a.selectedText,
      a.correctText,
      a.errorTag ?? "",
      a.responseTimeMs,
      a.hintUsed,
      a.polyaViewed,
      a.streakAfter,
    ];
  });
  return [header, ...rows];
}

export function classSummaryCsvRows(
  profiles: StudentProfile[],
  attemptsByProfile: Map<string, AttemptRecord[]>,
  matchesByProfile: Map<string, MatchRecord[]>
): (string | number | boolean | undefined)[][] {
  const header = [
    "student_name",
    "class",
    "xp",
    "badges",
    "questions_answered",
    "correct",
    "accuracy_pct",
    "avg_response_time_s",
    "hint_usage_pct",
    "matches_played",
    "matches_won",
    "time_spent_min",
    "last_active_iso",
  ];
  const rows = profiles.map((p) => {
    const attempts = attemptsByProfile.get(p.id) ?? [];
    const matches = matchesByProfile.get(p.id) ?? [];
    const correct = attempts.filter((a) => a.correct).length;
    const hint = attempts.filter((a) => a.hintUsed).length;
    const avgTime = attempts.length
      ? attempts.reduce((s, a) => s + a.responseTimeMs, 0) / attempts.length / 1000
      : 0;
    return [
      p.name,
      p.className,
      p.xp,
      p.badges.join("|"),
      attempts.length,
      correct,
      attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
      avgTime.toFixed(1),
      attempts.length ? Math.round((hint / attempts.length) * 100) : 0,
      matches.length,
      p.matchesWon,
      Math.round(p.totalTimeMs / 60000),
      new Date(p.lastActiveAt).toISOString(),
    ];
  });
  return [header, ...rows];
}

/**
 * Research-grade dataset: one row per attempt with anonymised student ids,
 * suitable for statistical analysis of problem-solving development
 * (see docs/RESEARCH_DATA.md for the codebook).
 */
export function researchCsvRows(
  attempts: AttemptRecord[],
  profiles: StudentProfile[]
): (string | number | boolean | undefined)[][] {
  const anonId = new Map<string, string>();
  profiles.forEach((p, i) => anonId.set(p.id, `S${String(i + 1).padStart(3, "0")}`));
  const header = [
    "participant_id",
    "class",
    "timestamp_iso",
    "session_mode",
    "topic",
    "curriculum_level",
    "item_difficulty",
    "is_correct",
    "error_pattern",
    "response_time_ms",
    "hint_used",
    "polya_scaffold_viewed",
    "streak_after",
  ];
  const rows = attempts
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((a) => {
      const p = profiles.find((x) => x.id === a.profileId);
      return [
        anonId.get(a.profileId) ?? "S000",
        p?.className ?? "",
        new Date(a.timestamp).toISOString(),
        a.mode,
        a.topic,
        a.level,
        a.difficulty,
        a.correct ? 1 : 0,
        a.errorTag ?? "",
        a.responseTimeMs,
        a.hintUsed ? 1 : 0,
        a.polyaViewed ? 1 : 0,
        a.streakAfter,
      ];
    });
  return [header, ...rows];
}
