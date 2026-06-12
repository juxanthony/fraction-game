"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { TOURNAMENT_ROUNDS, tournamentMatchConfig, type TournamentRound } from "@/lib/game-engine/tournament";
import { getActiveProfile } from "@/lib/storage/local";
import GameScreen from "@/components/game/GameScreen";
import ProfileGate from "@/components/profile/ProfileGate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function TournamentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeRound, setActiveRound] = useState<TournamentRound | null>(null);
  const [unlocked, setUnlocked] = useState(0);

  const refresh = () => setUnlocked(getActiveProfile()?.tournamentRound ?? 0);
  useEffect(refresh, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <ProfileGate>
        {(profile) =>
          activeRound ? (
            <GameScreen
              key={activeRound.index}
              config={tournamentMatchConfig(activeRound)}
              profile={profile}
              opponentName={t(activeRound.opponentKey)}
              onExit={() => {
                refresh();
                setActiveRound(null);
              }}
            />
          ) : (
            <div className="max-w-lg mx-auto space-y-4">
              <Card className="text-center space-y-2">
                <div className="text-5xl">🏆</div>
                <h1 className="text-3xl font-extrabold text-slate-800">{t("tour.title")}</h1>
                <p className="font-bold text-slate-600">{t("tour.subtitle")}</p>
                {unlocked >= TOURNAMENT_ROUNDS.length && (
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="rounded-2xl bg-amber-100 border-2 border-amber-300 p-3 font-extrabold text-amber-800"
                  >
                    {t("tour.champion")}
                  </motion.p>
                )}
              </Card>

              <div className="space-y-3">
                {TOURNAMENT_ROUNDS.map((round) => {
                  const isUnlocked = round.index <= unlocked;
                  const isBeaten = round.index < unlocked;
                  return (
                    <motion.div
                      key={round.index}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: round.index * 0.07 }}
                    >
                      <Card
                        className={`flex items-center gap-4 !p-4 ${
                          isUnlocked ? "" : "opacity-60 grayscale"
                        }`}
                      >
                        <span className="text-4xl">{isBeaten ? "✅" : isUnlocked ? round.icon : "🔒"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-slate-800">{t(round.nameKey)}</div>
                          <div className="text-sm text-slate-500 font-bold">
                            {t("common.vs")} {t(round.opponentKey)} · {round.totalQuestions} {t("common.questions")}
                          </div>
                          {!isUnlocked && <div className="text-xs text-slate-400">{t("tour.locked")}</div>}
                          {isBeaten && <div className="text-xs text-green-600 font-bold">{t("tour.completed")}</div>}
                        </div>
                        {isUnlocked && (
                          <Button
                            variant={isBeaten ? "ghost" : "secondary"}
                            onClick={() => setActiveRound(round)}
                            className="!min-h-0 !py-2 !text-sm shrink-0"
                          >
                            {t("tour.play")}
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="text-center">
                <Button variant="ghost" onClick={() => router.push("/")}>← {t("game.backToMenu")}</Button>
              </div>
            </div>
          )
        }
      </ProfileGate>
    </main>
  );
}
