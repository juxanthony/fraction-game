"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { WIN_AT, timeAllowedSeconds } from "@/lib/game-engine/engine";
import { questionForTurn } from "@/lib/question-generator/generator";
import type { Question } from "@/lib/question-generator/types";
import { playCorrect, playTick, playWin, playWrong } from "@/lib/audio";
import TugOfWarScene from "./TugOfWarScene";
import QuestionCard from "./QuestionCard";
import FractionText from "@/components/fractions/FractionText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

/**
 * Two players, one device, alternating turns. Player 1 pulls right (red),
 * Player 2 pulls left (blue). A correct answer pulls the rope to your side;
 * a wrong answer hands the pull to your opponent.
 */

const TOTAL_QUESTIONS = 20;

interface Props {
  player1: string;
  player2: string;
  onExit: () => void;
}

type Phase = "handover" | "playing" | "feedback" | "finished";

export default function MultiplayerScreen({ player1, player2, onExit }: Props) {
  const { t } = useI18n();
  const [turn, setTurn] = useState<0 | 1>(0);
  const [rope, setRope] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => questionForTurn(0, TOTAL_QUESTIONS, {}));
  const [phase, setPhase] = useState<Phase>("handover");
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const wonRef = useRef(false);

  const names = [player1, player2];
  const currentName = names[turn];

  const finish = useCallback((finalRope: number) => {
    if (!wonRef.current) {
      wonRef.current = true;
      if (finalRope !== 0) playWin();
    }
    setPhase("finished");
  }, []);

  const handleAnswer = useCallback(
    (i: number | null) => {
      if (phase !== "playing") return;
      const correct = i !== null && i === question.correctIndex;
      const sign = turn === 0 ? 1 : -1;
      const delta = (correct ? 1 : -1) * sign;
      const newRope = Math.max(-WIN_AT, Math.min(WIN_AT, rope + delta));
      setSelected(i);
      setTimedOut(i === null);
      setRope(newRope);
      if (correct) {
        playCorrect();
        setScores((s) => (turn === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
      } else {
        playWrong();
      }
      setPhase("feedback");
    },
    [phase, question, turn, rope]
  );

  const handleNext = useCallback(() => {
    if (Math.abs(rope) >= WIN_AT || index + 1 >= TOTAL_QUESTIONS) {
      finish(rope);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setQuestion(questionForTurn(nextIndex, TOTAL_QUESTIONS, {}));
    setSelected(null);
    setTimedOut(false);
    setTurn((t0) => (t0 === 0 ? 1 : 0));
    setPhase("handover");
  }, [rope, index, finish]);

  /* Per-question countdown: 30 s easy / 60 s calculation questions. */
  useEffect(() => {
    if (phase !== "playing") return;
    const total = timeAllowedSeconds(question.topic);
    setTimeLeft(total);
    const started = Date.now();
    const id = window.setInterval(() => {
      const remaining = total - Math.floor((Date.now() - started) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 5 && remaining > 0) playTick();
      if (remaining <= 0) {
        window.clearInterval(id);
        handleAnswer(null);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, question, handleAnswer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "playing" && ["1", "2", "3", "4"].includes(e.key)) handleAnswer(Number(e.key) - 1);
      else if (phase === "feedback" && e.key === "Enter") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleAnswer, handleNext]);

  if (phase === "finished") {
    const headline =
      rope > 0 ? t("game.winner", { name: player1 }) : rope < 0 ? t("game.winner", { name: player2 }) : t("game.draw");
    return (
      <Card className="max-w-xl mx-auto text-center space-y-5">
        <div className="text-6xl">{rope === 0 ? "🤝" : "🏆"}</div>
        <h2 className="text-3xl font-extrabold text-slate-800">{headline}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-4">
            <div className="font-bold text-rose-700">🔴 {player1}</div>
            <div className="text-3xl font-extrabold">{scores[0]}</div>
          </div>
          <div className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-4">
            <div className="font-bold text-blue-700">🔵 {player2}</div>
            <div className="text-3xl font-extrabold">{scores[1]}</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onExit}>🏠 {t("game.backToMenu")}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button variant="ghost" onClick={onExit} className="!min-h-0 !py-2 !text-sm">
          ← {t("game.backToMenu")}
        </Button>
        <div className="flex gap-2">
          <span className="rounded-full bg-rose-100 border-2 border-rose-300 px-4 py-1.5 font-bold text-rose-700 text-sm">
            🔴 {player1}: {scores[0]}
          </span>
          <span className="rounded-full bg-blue-100 border-2 border-blue-300 px-4 py-1.5 font-bold text-blue-700 text-sm">
            🔵 {player2}: {scores[1]}
          </span>
          <span className="rounded-full bg-white/90 border-2 border-slate-200 px-4 py-1.5 font-bold text-slate-700 text-sm">
            {index + 1} / {TOTAL_QUESTIONS}
          </span>
          {phase === "playing" && timeLeft !== null && (
            <span
              className={`rounded-full px-4 py-1.5 font-extrabold text-sm border-2 ${
                timeLeft <= 5
                  ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                  : "bg-white/90 border-slate-200 text-slate-700"
              }`}
              aria-live="polite"
            >
              ⏱ {Math.max(0, timeLeft)}{t("common.seconds")}
            </span>
          )}
        </div>
      </div>

      <TugOfWarScene ropePosition={rope} playerName={player1} opponentName={player2} shake={phase === "feedback"} />

      <AnimatePresence mode="wait">
        {phase === "handover" ? (
          <motion.div key="handover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="text-center space-y-4">
              <div className="text-5xl">{turn === 0 ? "🔴" : "🔵"}</div>
              <h2 className="text-2xl font-extrabold text-slate-800">{t("mp.passDevice", { name: currentName })}</h2>
              <Button variant={turn === 0 ? "danger" : "primary"} onClick={() => setPhase("playing")}>
                {t("mp.ready")} →
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div key={`q-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div
              className={`rounded-full px-4 py-2 text-center font-extrabold ${
                turn === 0 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {t("mp.turn", { name: currentName })}
            </div>

            {phase === "feedback" && (
              <div
                className={`rounded-2xl border-2 p-4 space-y-2 ${
                  selected === question.correctIndex ? "bg-green-50 border-green-400" : "bg-rose-50 border-rose-300"
                }`}
              >
                <p className="font-extrabold">
                  {selected === question.correctIndex
                    ? `✅ ${t("game.correct")}`
                    : timedOut
                      ? `⏰ ${t("game.timeout")}`
                      : `❌ ${t("game.wrong")}`}
                </p>
                <p className="text-slate-700 text-sm">
                  <FractionText text={t(question.explanationKey, question.explanationParams)} />
                </p>
                <Button onClick={handleNext}>{t("game.next")} →</Button>
              </div>
            )}

            <Card>
              <QuestionCard
                key={question.id}
                question={question}
                selectedIndex={phase === "feedback" ? selected : null}
                revealed={phase === "feedback"}
                onAnswer={handleAnswer}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
