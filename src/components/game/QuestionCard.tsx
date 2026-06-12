"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/lib/question-generator/types";
import { useI18n } from "@/lib/i18n";
import FractionText from "@/components/fractions/FractionText";
import FractionVisual from "@/components/fractions/FractionVisual";
import { speak } from "@/lib/audio";

interface Props {
  question: Question;
  /** Index the pupil chose; null until answered. */
  selectedIndex: number | null;
  revealed: boolean;
  onAnswer: (index: number) => void;
  /** Practice-mode scaffolds. */
  allowHints?: boolean;
  onHintUsed?: () => void;
  onPolyaViewed?: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onAnswer,
  allowHints = false,
  onHintUsed,
  onPolyaViewed,
}: Props) {
  const { t, speechLang } = useI18n();
  const [showHint, setShowHint] = useState(false);
  const [showPolya, setShowPolya] = useState(false);

  const promptText = t(question.promptKey, question.promptParams);

  const optionClass = (i: number): string => {
    if (!revealed) {
      return "bg-white hover:bg-blue-50 border-slate-300 hover:border-blue-400 active:scale-[0.98]";
    }
    if (i === question.correctIndex) return "bg-green-100 border-green-500 ring-4 ring-green-200";
    if (i === selectedIndex) return "bg-rose-100 border-rose-500";
    return "bg-white border-slate-200 opacity-60";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="space-y-3"
    >
      {/* prompt */}
      <div className="flex items-start gap-2">
        <h2 className="flex-1 text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed">
          <FractionText text={promptText} />
        </h2>
        <button
          onClick={() => speak(promptText, speechLang)}
          aria-label={t("game.speak")}
          title={t("game.speak")}
          className="shrink-0 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 w-12 h-12 text-xl"
        >
          🔊
        </button>
      </div>

      {/* visual model */}
      {question.visual && <FractionVisual visual={question.visual} />}

      {/* scaffolds (practice mode) */}
      {allowHints && !revealed && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowHint(true);
              onHintUsed?.();
            }}
            className="rounded-full bg-amber-300 hover:bg-amber-400 px-4 py-2 font-bold text-amber-950 text-sm"
          >
            💡 {t("practice.showHint")}
          </button>
          {question.polya && (
            <button
              onClick={() => {
                setShowPolya((v) => !v);
                onPolyaViewed?.();
              }}
              className="rounded-full bg-violet-200 hover:bg-violet-300 px-4 py-2 font-bold text-violet-900 text-sm"
            >
              🪜 {t("practice.showPolya")}
            </button>
          )}
        </div>
      )}

      {showHint && !revealed && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-3 text-amber-900 font-semibold"
        >
          💡 <FractionText text={t(question.hintKey, question.hintParams)} />
        </motion.div>
      )}

      {showPolya && question.polya && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-violet-50 border-2 border-violet-300 p-4 space-y-2"
        >
          <p className="font-extrabold text-violet-900">{t("polya.title")}</p>
          {(
            [
              ["polya.step1", question.polya.understand],
              ["polya.step2", question.polya.plan],
              ["polya.step3", question.polya.carryOut],
              ["polya.step4", question.polya.lookBack],
            ] as const
          ).map(([titleKey, step]) => (
            <div key={titleKey} className="text-sm">
              <span className="font-bold text-violet-800">{t(titleKey)}: </span>
              <span className="text-violet-900">
                <FractionText text={t(step.key, step.params)} />
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* answer options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={t("game.question")}>
        {question.options.map((opt, i) => {
          const isWrongPick = revealed && i === selectedIndex && i !== question.correctIndex;
          const isCorrect = revealed && i === question.correctIndex;
          return (
            <motion.button
              key={i}
              disabled={revealed}
              onClick={() => onAnswer(i)}
              whileHover={revealed ? undefined : { scale: 1.03, y: -2 }}
              whileTap={revealed ? undefined : { scale: 0.95 }}
              animate={
                isWrongPick
                  ? { x: [0, -10, 10, -6, 6, 0] }
                  : isCorrect
                    ? { scale: [1, 1.07, 1] }
                    : {}
              }
              transition={{ duration: 0.45 }}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 min-h-[3.5rem] text-lg sm:text-xl font-bold text-slate-800 transition-colors ${optionClass(i)}`}
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">
                {OPTION_LABELS[i]}
              </span>
              <FractionText text={opt.text} />
              {isCorrect && <span className="ml-auto text-green-600 text-2xl">✓</span>}
              {isWrongPick && <span className="ml-auto text-rose-600 text-2xl">✗</span>}
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center hidden sm:block">{t("game.keyboardTip")}</p>
    </motion.div>
  );
}
