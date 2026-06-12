"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import GameScreen from "@/components/game/GameScreen";
import ProfileGate from "@/components/profile/ProfileGate";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ChallengePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [started, setStarted] = useState(false);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <ProfileGate>
        {(profile) =>
          !started ? (
            <Card className="max-w-lg mx-auto text-center space-y-5">
              <div className="text-5xl">⚡</div>
              <h1 className="text-3xl font-extrabold text-slate-800">{t("challenge.title")}</h1>
              <p className="text-slate-600 font-bold">{t("challenge.rules")}</p>
              <Button variant="secondary" onClick={() => setStarted(true)} className="w-full">
                🚀 {t("game.start")}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")}>← {t("game.backToMenu")}</Button>
            </Card>
          ) : (
            <GameScreen
              config={{
                mode: "challenge",
                totalQuestions: 20,
                timePerQuestion: 30,
                aiAccuracy: 0,
              }}
              profile={profile}
              opponentName={t("game.teamBlue")}
              onExit={() => router.push("/")}
            />
          )
        }
      </ProfileGate>
    </main>
  );
}
