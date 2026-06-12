"use client";

import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { MatchState } from "@/lib/game-engine/engine";
import type { MatchOutcome } from "@/lib/game-engine/recorder";
import { BADGES } from "@/lib/gamification/badges";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Props {
  state: MatchState;
  outcome: MatchOutcome | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function ResultsScreen({ state, outcome, onPlayAgain, onExit }: Props) {
  const { t } = useI18n();
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
          <Button variant="ghost" onClick={onExit}>
            🏠 {t("game.backToMenu")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
