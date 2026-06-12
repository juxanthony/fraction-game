"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import MultiplayerScreen from "@/components/game/MultiplayerScreen";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function MultiplayerPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <MultiplayerScreen
          player1={name1 || t("mp.player1")}
          player2={name2 || t("mp.player2")}
          onExit={() => router.push("/")}
        />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <Card className="max-w-md mx-auto space-y-4">
        <div className="text-center text-5xl">🤜🤛</div>
        <h1 className="text-2xl font-extrabold text-slate-800 text-center">{t("mp.title")}</h1>
        <p className="text-center font-bold text-slate-600">{t("mp.enterNames")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStarted(true);
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="font-bold text-rose-700">🔴 {t("mp.player1")}</span>
            <input
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              required
              maxLength={20}
              className="mt-1 w-full rounded-2xl border-2 border-rose-200 px-4 py-3 text-lg focus:border-rose-500 outline-none"
            />
          </label>
          <label className="block">
            <span className="font-bold text-blue-700">🔵 {t("mp.player2")}</span>
            <input
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              required
              maxLength={20}
              className="mt-1 w-full rounded-2xl border-2 border-blue-200 px-4 py-3 text-lg focus:border-blue-500 outline-none"
            />
          </label>
          <Button type="submit" className="w-full">🚀 {t("game.start")}</Button>
        </form>
        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push("/")}>← {t("game.backToMenu")}</Button>
        </div>
      </Card>
    </main>
  );
}
