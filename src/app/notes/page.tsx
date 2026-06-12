"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import type { Topic, Visual } from "@/lib/question-generator/types";
import { timeAllowedSeconds } from "@/lib/game-engine/engine";
import { speak } from "@/lib/audio";
import FractionText from "@/components/fractions/FractionText";
import FractionVisual from "@/components/fractions/FractionVisual";
import Card from "@/components/ui/Card";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

/**
 * Study notes for every fraction subtopic: key idea, method steps, a worked
 * example with a visual model, and a tip. Content lives in the locale files
 * under notes.<topic>.* so it switches language instantly.
 */

const NOTE_TOPICS: { topic: Topic; icon: string; visual: Visual }[] = [
  {
    topic: "compare",
    icon: "⚖️",
    visual: { kind: "bar", fractions: [{ num: 3, den: 8 }, { num: 5, den: 8 }], labels: ["3/8", "5/8"] },
  },
  {
    topic: "ordering",
    icon: "📶",
    visual: { kind: "numberline", fractions: [{ num: 1, den: 4 }, { num: 1, den: 2 }, { num: 3, den: 4 }] },
  },
  {
    topic: "equivalent",
    icon: "🟰",
    visual: {
      kind: "bar",
      fractions: [{ num: 1, den: 2 }, { num: 2, den: 4 }, { num: 4, den: 8 }],
      labels: ["1/2", "2/4", "4/8"],
    },
  },
  {
    topic: "addition",
    icon: "➕",
    visual: {
      kind: "bar",
      fractions: [{ num: 1, den: 4 }, { num: 2, den: 4 }, { num: 3, den: 4 }],
      labels: ["1/4", "2/4", "3/4"],
    },
  },
  {
    topic: "subtraction",
    icon: "➖",
    visual: {
      kind: "bar",
      fractions: [{ num: 4, den: 5 }, { num: 2, den: 5 }, { num: 2, den: 5 }],
      labels: ["4/5", "2/5", "2/5"],
    },
  },
  {
    topic: "mixedNumbers",
    icon: "🔁",
    visual: { kind: "circle", fractions: [{ num: 7, den: 4 }] },
  },
  {
    topic: "wordProblem",
    icon: "📖",
    visual: {
      kind: "bar",
      fractions: [{ num: 2, den: 5 }, { num: 1, den: 5 }, { num: 3, den: 5 }],
      labels: ["2/5", "1/5", "3/5"],
    },
  },
];

export default function NotesPage() {
  const { t, speechLang } = useI18n();
  const [open, setOpen] = useState<Topic | null>(NOTE_TOPICS[0].topic);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-white/70 hover:bg-white border-2 border-slate-300 px-4 py-2 font-bold text-slate-700 text-sm"
        >
          ← {t("game.backToMenu")}
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="text-center space-y-1">
        <div className="text-5xl">📖</div>
        <h1 className="text-3xl font-extrabold text-blue-900">{t("notes.title")}</h1>
        <p className="font-bold text-slate-600">{t("notes.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {NOTE_TOPICS.map(({ topic, icon, visual }, i) => {
          const isOpen = open === topic;
          const sections: { labelKey: string; emoji: string; contentKey: string }[] = [
            { labelKey: "notes.concept", emoji: "💡", contentKey: `notes.${topic}.concept` },
            { labelKey: "notes.steps", emoji: "🪜", contentKey: `notes.${topic}.steps` },
            { labelKey: "notes.example", emoji: "✏️", contentKey: `notes.${topic}.example` },
            { labelKey: "notes.tip", emoji: "⭐", contentKey: `notes.${topic}.tip` },
          ];
          const spokenText = sections.map((s) => `${t(s.labelKey)}. ${t(s.contentKey)}`).join(" ");

          return (
            <motion.div
              key={topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="!p-0 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : topic)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-blue-50/60"
                >
                  <span className="text-3xl">{icon}</span>
                  <span className="flex-1 text-lg font-extrabold text-slate-800">{t(`topic.${topic}`)}</span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                    ⏱ {timeAllowedSeconds(topic)}{t("common.seconds")}
                  </span>
                  <span className="text-slate-400 text-xl">{isOpen ? "▴" : "▾"}</span>
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 space-y-3 border-t-2 border-slate-100 pt-3"
                  >
                    <div className="flex justify-end">
                      <button
                        onClick={() => speak(spokenText, speechLang)}
                        aria-label={t("game.speak")}
                        title={t("game.speak")}
                        className="rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 w-10 h-10 text-lg"
                      >
                        🔊
                      </button>
                    </div>

                    {sections.map((s) => (
                      <div key={s.contentKey} className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                        <p className="font-extrabold text-slate-700 text-sm mb-1">
                          {s.emoji} {t(s.labelKey)}
                        </p>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                          <FractionText text={t(s.contentKey)} />
                        </p>
                      </div>
                    ))}

                    <FractionVisual visual={visual} />

                    <Link
                      href="/play/practice"
                      className="block text-center rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                    >
                      🎮 {t("notes.practiceThis")}
                    </Link>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
