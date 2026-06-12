import type { Fraction } from "@/lib/math/fraction";

/** Curriculum topics (KSSR Mathematics Year 5 — Fractions). */
export type Topic =
  | "compare"
  | "ordering"
  | "equivalent"
  | "addition"
  | "subtraction"
  | "mixedNumbers"
  | "wordProblem";

/** Misconception tags attached to distractors, used for error-pattern analytics. */
export type ErrorTag =
  | "lesser-value"
  | "greater-value"
  | "denominator-confusion"
  | "additive-misconception"
  | "scaled-numerator-only"
  | "scaled-denominator-only"
  | "added-denominators"
  | "subtracted-denominators"
  | "unconverted-numerators"
  | "off-by-one"
  | "swapped-parts"
  | "wrong-whole"
  | "reversed-order"
  | "random-near";

export interface Option {
  /** Display text in neutral fraction notation, e.g. "3/4", "1 2/5", "1/8, 1/4, 1/2". */
  text: string;
  /** Present on distractors only; classifies the misconception. */
  errorTag?: ErrorTag;
}

export type VisualKind = "bar" | "circle" | "numberline";

export interface Visual {
  kind: VisualKind;
  fractions: Fraction[];
  /** Optional labels matching each fraction. */
  labels?: string[];
}

export type TParams = Record<string, string | number>;

export interface PolyaStep {
  key: string;
  params: TParams;
}

export interface PolyaPlan {
  understand: PolyaStep;
  plan: PolyaStep;
  carryOut: PolyaStep;
  lookBack: PolyaStep;
}

export interface Question {
  id: string;
  topic: Topic;
  /** Game level 1–6 (see GAME_LEVELS). */
  level: number;
  /** Difficulty within the level, 1 (easiest) – 3 (hardest). */
  difficulty: 1 | 2 | 3;
  promptKey: string;
  promptParams: TParams;
  options: Option[];
  correctIndex: number;
  explanationKey: string;
  explanationParams: TParams;
  hintKey: string;
  hintParams: TParams;
  /** i18n key describing the KSSR learning objective. */
  objectiveKey: string;
  visual?: Visual;
  /** Polya problem-solving scaffold (word problems only). */
  polya?: PolyaPlan;
}

export const GAME_LEVELS: { level: number; topic: Topic; labelKey: string }[] = [
  { level: 1, topic: "compare", labelKey: "level.1" },
  { level: 2, topic: "equivalent", labelKey: "level.2" },
  { level: 3, topic: "addition", labelKey: "level.3" },
  { level: 4, topic: "subtraction", labelKey: "level.4" },
  { level: 5, topic: "mixedNumbers", labelKey: "level.5" },
  { level: 6, topic: "wordProblem", labelKey: "level.6" },
];
