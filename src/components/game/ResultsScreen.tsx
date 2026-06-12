"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { MatchState } from "@/lib/game-engine/engine";
import type { MatchOutcome } from "@/lib/game-engine/recorder";
import type { Question } from "@/lib/question-generator/types";
import { BADGES } from "@/lib/gamification/badges";
import FractionText from "@/components/fractions/FractionText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export interface QuestionHistoryEntry {
  question: Question;
  selectedIndex: number | null;
  correct: boolean;
}

interface Props {
  state: MatchState;
  outcome: MatchOutcome | null;
  history?: QuestionHistoryEntry[];
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function ResultsScreen({ state, outcome, history = [], onPlayAgain, onExit }: Props) {
  const { t } = useI18n();
  const [showReview, setShowReview] = useState(false);
  const answered = state.questionIndex + 1;
  const accuracy = answered > 0 ? Math.round((state.correctCount / answered) * 100) : 0;
  const avgTimeS = ((Date.now() - state.startedAt) / Math.max(1, answered) / 1000).toFixed(1);

  const headline =
    state.result === "win" ? t("game.win") : state.result === "lose" ? t("game.lose") : t("game.draw");

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="max-w-xl mx-auto text-center space-y-5">
        <motion.div
          initial={{ y: -30 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl"
        >
          {state.result === "win" ? "🏆" : state.result === "lose" ? "💪" : "🤝"}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{headline}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            [t("game.score"), `${state.correctCount}/${answered}`],
            [t("game.accuracy"), `${accuracy}%`],
            [t("game.bestStreak"), `🔥 ${state.bestStreak}`],
            [t("game.avgTime"), `${avgTimeS}${t("common.seconds")}`],
          ].map(([label, val]) => (
            <div key={label} className="rounded-2xl bg-slate-100 p-3">
              <div className="text-xs text-slate-500 font-bold">{label}</div>
              <div className="text-lg font-extrabold text-slate-800">{val}</div>
            </div>
          ))}
        </div>

        {outcome && (
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-3 font-extrabold text-amber-800 text-xl">
            ⭐ {t("game.xpEarned")}: +{outcome.xpEarned} XP
          </div>
        )}

        {outcome && outcome.newBadges.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-violet-700">{t("badge.new")}</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {outcome.newBadges.map((id) => {
                const def = BADGES.find((b) => b.id === id);
                return def ? (
                  <motion.div
                    key={id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="rounded-2xl bg-violet-100 border-2 border-violet-300 px-4 py-2"
                  >
                    <span className="text-3xl">{def.icon}</span>
                    <div className="font-bold text-violet-900 text-sm">{t(def.nameKey)}</div>
                  </motion.div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {outcome && outcome.completedMissions.length > 0 && (
          <div className="text-sm font-bold text-green-700">
            ✅ {t("mission.done")}{" "}
            {outcome.completedMissions.map((m) => `+${m.xp} XP`).join(" · ")}
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="success" onClick={onPlayAgain}>
            🔄 {t("game.playAgain")}
          </Button>
          {history.length > 0 && (
            <Button variant="secondary" onClick={() => setShowReview((v) => !v)}>
              📖 {t("game.review")}
            </Button>
          )}
          <Button variant="ghost" onClick={onExit}>
            🏠 {t("game.backToMenu")}
          </Button>
        </div>

        {/* per-question review: every question with its explanation */}
        {showReview && (
          <div className="text-left space-y-3 pt-2">
            <h3 className="font-extrabold text-slate-800 text-lg text-center">📖 {t("game.review")}</h3>
            {history.map((h, i) => {
              const selectedText =
                h.selectedIndex !== null ? h.question.options[h.selectedIndex].text : null;
              const correctText = h.question.options[h.question.correctIndex].text;
              return (
                <div
                  key={h.question.id}
                  className={`rounded-2xl border-2 p-3 space-y-1.5 ${
                    h.correct ? "bg-green-50 border-green-200" : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <p className="font-bold text-slate-800">
                    <span className={h.correct ? "text-green-600" : "text-rose-600"}>
                      {h.correct ? "✓" : "✗"}
                    </span>{" "}
                    {i + 1}. <FractionText text={t(h.question.promptKey, h.question.promptParams)} />
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    {selectedText === null ? (
                      <span className="text-rose-600">⏰ {t("err.timeout")}</span>
                    ) : (
                      !h.correct && (
                        <span className="text-rose-600 line-through mr-2">
                          <FractionText text={selectedText} />
                        </span>
                      )
                    )}{" "}
                    <span className="text-green-700">
                      ✓ <FractionText text={correctText} />
                    </span>
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold">{t("game.explanation")}: </span>
                    <FractionText
                      text={t(h.question.explanationKey, h.question.explanationParams)}
                    />
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
