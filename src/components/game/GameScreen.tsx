"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import {
  MatchConfig,
  MatchState,
  WIN_AT,
  advance,
  answer as applyAnswer,
  createMatch,
  endPractice,
  timeAllowedSeconds,
} from "@/lib/game-engine/engine";
import type { Question } from "@/lib/question-generator/types";
import { finalizeMatch, recordAttempt, type MatchOutcome } from "@/lib/game-engine/recorder";
import type { StudentProfile } from "@/lib/storage/models";
import { getActiveProfile } from "@/lib/storage/local";
import { playCorrect, playTick, playWin, playWrong } from "@/lib/audio";
import TugOfWarScene from "./TugOfWarScene";
import QuestionCard from "./QuestionCard";
import ResultsScreen from "./ResultsScreen";
import FractionText from "@/components/fractions/FractionText";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Props {
  config: MatchConfig;
  profile: StudentProfile;
  opponentName: string;
  allowHints?: boolean;
  showEndButton?: boolean;
  onExit: () => void;
}

export default function GameScreen({
  config,
  profile,
  opponentName,
  allowHints = false,
  showEndButton = false,
  onExit,
}: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<MatchState>(() => createMatch(config));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);

  const questionStartRef = useRef<number>(Date.now());
  const hintUsedRef = useRef(false);
  const polyaViewedRef = useRef(false);
  const streakBonusRef = useRef(0);
  const selectedRef = useRef<number | null>(null);
  const finalizedRef = useRef(false);

  // Mirror of `state` so handlers can run side effects (recording, audio)
  // exactly once, outside React's setState updaters.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Per-question history so the results screen can show every question's
  // explanation for review.
  const historyRef = useRef<{ question: Question; selectedIndex: number | null; correct: boolean }[]>([]);

  /* ---------------- answer handling ---------------- */

  const handleAnswer = useCallback(
    (index: number | null) => {
      const prev = stateRef.current;
      if (prev.phase !== "playing") return;
      recordAttempt({
        profile,
        state: prev,
        question: prev.question,
        selectedIndex: index,
        responseTimeMs: Date.now() - questionStartRef.current,
        hintUsed: hintUsedRef.current,
        polyaViewed: polyaViewedRef.current,
      });
      selectedRef.current = index;
      historyRef.current.push({
        question: prev.question,
        selectedIndex: index,
        correct: index !== null && index === prev.question.correctIndex,
      });
      const next = applyAnswer(prev, index);
      streakBonusRef.current += next.lastResult?.streakBonusXp ?? 0;
      if (next.lastResult?.correct) playCorrect();
      else playWrong();
      stateRef.current = next;
      setState(next);
    },
    [profile]
  );

  const handleAdvance = useCallback(() => {
    const prev = stateRef.current;
    if (prev.phase !== "feedback") return;
    hintUsedRef.current = false;
    polyaViewedRef.current = false;
    selectedRef.current = null;
    questionStartRef.current = Date.now();
    let next = advance(prev);
    // Practice: a full pull is a mini-victory — celebrate and reset the rope.
    if (next.phase === "playing" && config.mode === "practice" && Math.abs(next.ropePosition) >= WIN_AT) {
      next = { ...next, ropePosition: 0 };
    }
    stateRef.current = next;
    setState(next);
  }, [config.mode]);

  const handleEndPractice = useCallback(() => {
    const prev = stateRef.current;
    if (prev.phase === "finished") return;
    const next = endPractice(prev);
    stateRef.current = next;
    setState(next);
  }, []);

  /* ---------------- per-question countdown ---------------- */
  // 30 s for recognition questions, 60 s for calculation questions.

  useEffect(() => {
    if (state.phase !== "playing" || !config.timed) return;
    const total = timeAllowedSeconds(stateRef.current.question.topic);
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
  }, [state.questionIndex, state.phase, config.timed, handleAnswer]);

  /* ---------------- keyboard navigation ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.phase === "playing" && ["1", "2", "3", "4"].includes(e.key)) {
        handleAnswer(Number(e.key) - 1);
      } else if (state.phase === "feedback" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, handleAnswer, handleAdvance]);

  /* ---------------- match finalisation ---------------- */

  useEffect(() => {
    if (state.phase !== "finished" || finalizedRef.current) return;
    finalizedRef.current = true;
    if (state.result === "win") playWin();
    const fresh = getActiveProfile() ?? profile;
    setOutcome(finalizeMatch(fresh, state, streakBonusRef.current));
  }, [state, profile]);

  const restart = useCallback(() => {
    finalizedRef.current = false;
    streakBonusRef.current = 0;
    hintUsedRef.current = false;
    polyaViewedRef.current = false;
    selectedRef.current = null;
    historyRef.current = [];
    questionStartRef.current = Date.now();
    setOutcome(null);
    setState(createMatch(config));
  }, [config]);

  /* ---------------- render ---------------- */

  if (state.phase === "finished") {
    return (
      <ResultsScreen
        state={state}
        outcome={outcome}
        history={historyRef.current}
        onPlayAgain={restart}
        onExit={onExit}
      />
    );
  }

  const total = Number.isFinite(config.totalQuestions) ? config.totalQuestions : null;
  const last = state.lastResult;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button variant="ghost" onClick={onExit} className="!min-h-0 !py-2 !text-sm no-print">
          ← {t("game.backToMenu")}
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-white/90 border-2 border-slate-200 px-4 py-1.5 font-bold text-slate-700 text-sm">
            {t("game.question")} {state.questionIndex + 1}
            {total ? ` / ${total}` : ""}
          </span>
          <span className="rounded-full bg-white/90 border-2 border-slate-200 px-4 py-1.5 font-bold text-slate-700 text-sm">
            {t("game.score")}: {state.correctCount}
          </span>
          {state.streak >= 2 && (
            <motion.span
              key={state.streak}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-orange-100 border-2 border-orange-300 px-4 py-1.5 font-bold text-orange-700 text-sm"
            >
              🔥 {t("game.streak")} {state.streak}
            </motion.span>
          )}
          {timeLeft !== null && config.timed && state.phase === "playing" && (
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

      <TugOfWarScene
        ropePosition={state.ropePosition}
        playerName={profile.name || t("game.you")}
        opponentName={opponentName}
        shake={state.phase === "feedback"}
      />

      {/* feedback banner */}
      <AnimatePresence>
        {state.phase === "feedback" && last && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl border-2 p-4 space-y-2 ${
              last.correct ? "bg-green-50 border-green-400" : "bg-rose-50 border-rose-300"
            }`}
            role="status"
          >
            <p className={`font-extrabold text-lg ${last.correct ? "text-green-700" : "text-rose-700"}`}>
              {last.correct ? `✅ ${t("game.correct")}` : last.timedOut ? `⏰ ${t("game.timeout")}` : `❌ ${t("game.wrong")}`}
              {last.streakBonusXp > 0 && (
                <span className="ml-2 text-amber-600">{t("game.streakBonus", { xp: last.streakBonusXp })}</span>
              )}
            </p>
            {last.aiCorrect && (
              <p className="text-sm font-bold text-blue-700">💪 {t("game.opponentPulls", { name: opponentName })}</p>
            )}
            <p className="text-slate-700">
              <span className="font-bold">{t("game.explanation")}: </span>
              <FractionText text={t(state.question.explanationKey, state.question.explanationParams)} />
            </p>
            <p className="text-xs text-slate-500">
              📚 {t("game.objective")}: {t(state.question.objectiveKey)}
            </p>
            <Button variant="primary" onClick={handleAdvance} className="w-full sm:w-auto">
              {state.result !== null ? t("game.finish") : t("game.next")} →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* question */}
      <Card>
        <QuestionCard
          key={state.question.id}
          question={state.question}
          selectedIndex={state.phase === "feedback" ? selectedRef.current : null}
          revealed={state.phase === "feedback"}
          onAnswer={(i) => handleAnswer(i)}
          allowHints={allowHints}
          onHintUsed={() => (hintUsedRef.current = true)}
          onPolyaViewed={() => (polyaViewedRef.current = true)}
        />
      </Card>

      {showEndButton && (
        <div className="text-center">
          <Button variant="ghost" onClick={handleEndPractice}>
            🏁 {t("practice.endSession")}
          </Button>
        </div>
      )}
    </div>
  );
}
