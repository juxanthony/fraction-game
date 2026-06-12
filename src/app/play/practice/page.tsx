"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { GAME_LEVELS } from "@/lib/question-generator/types";
import GameScreen from "@/components/game/GameScreen";
import ProfileGate from "@/components/profile/ProfileGate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PracticePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [level, setLevel] = useState<number | "mixed" | null>(null);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <ProfileGate>
        {(profile) =>
          level === null ? (
            <Card className="max-w-lg mx-auto space-y-4">
              <h1 className="text-2xl font-extrabold text-slate-800 text-center">📘 {t("practice.title")}</h1>
              <p className="text-center text-slate-600 font-semibold">{t("menu.practice.desc")}</p>
              <h2 className="font-bold text-slate-700">{t("menu.chooseLevel")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GAME_LEVELS.map((l) => (
                  <button
                    key={l.level}
                    onClick={() => setLevel(l.level)}
                    className="rounded-2xl border-2 border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 p-3 font-bold text-slate-700 text-left"
                  >
                    <span className="inline-block w-7 h-7 rounded-full bg-blue-600 text-white text-center text-sm leading-7 mr-2">
                      {l.level}
                    </span>
                    {t(l.labelKey)}
                  </button>
                ))}
                <button
                  onClick={() => setLevel("mixed")}
                  className="rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 p-3 font-bold text-amber-800 text-left sm:col-span-2"
                >
                  🎲 {t("menu.mixedTopics")}
                </button>
              </div>
              <div className="text-center">
                <Button variant="ghost" onClick={() => router.push("/")}>← {t("game.backToMenu")}</Button>
              </div>
            </Card>
          ) : (
            <GameScreen
              key={String(level)}
              config={{
                mode: "practice",
                totalQuestions: Infinity,
                timePerQuestion: null,
                aiAccuracy: 0,
                level: level === "mixed" ? undefined : level,
              }}
              profile={profile}
              opponentName={t("game.teamBlue")}
              allowHints
              showEndButton
              onExit={() => router.push("/")}
            />
          )
        }
      </ProfileGate>
    </main>
  );
}
