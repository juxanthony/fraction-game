/**
 * Unlimited random question generator, aligned to KSSR Mathematics Year 5
 * (Fractions). Every question carries: prompt, 4 unique options (1 correct +
 * 3 misconception-based distractors), explanation, hint, difficulty level,
 * learning objective and (where relevant) a visual fraction model.
 */

import {
  Fraction,
  add,
  sub,
  simplify,
  equals,
  compare,
  value,
  toMixed,
  fromMixed,
  mixedToString,
  toString as fToString,
  lcm,
  gcd,
} from "@/lib/math/fraction";
import { pick, randInt, shuffle, uid } from "@/lib/math/random";
import type {
  ErrorTag,
  Option,
  Question,
  Topic,
  Visual,
  PolyaPlan,
} from "./types";
import { WORD_PROBLEM_TEMPLATES, PUPIL_NAMES } from "./word-problems";

type Difficulty = 1 | 2 | 3;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const SIMPLE_DENS = [2, 3, 4, 5, 6, 8];
const ALL_DENS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

function properFraction(maxDen: number, minDen = 2): Fraction {
  const den = randInt(minDen, maxDen);
  const num = randInt(1, den - 1);
  return { num, den };
}

/** Build 4 unique options (by displayed text AND value where comparable). */
function buildOptions(
  correct: string,
  distractorPool: { text: string; errorTag: ErrorTag }[],
  fallback: () => string
): { options: Option[]; correctIndex: number } {
  const seen = new Set<string>([correct]);
  const distractors: Option[] = [];
  for (const d of distractorPool) {
    if (distractors.length >= 3) break;
    if (!d.text || seen.has(d.text)) continue;
    seen.add(d.text);
    distractors.push(d);
  }
  let guard = 0;
  while (distractors.length < 3 && guard++ < 100) {
    const t = fallback();
    if (!seen.has(t)) {
      seen.add(t);
      distractors.push({ text: t, errorTag: "random-near" });
    }
  }
  const options = shuffle<Option>([{ text: correct }, ...distractors]);
  return { options, correctIndex: options.findIndex((o) => !o.errorTag && o.text === correct) };
}

function nearbyFraction(f: Fraction): string {
  const t = randInt(0, 2);
  if (t === 0 && f.num + 1 < f.den * 3) return fToString(simplify({ num: f.num + 1, den: f.den }));
  if (t === 1 && f.num - 1 >= 1) return fToString(simplify({ num: f.num - 1, den: f.den }));
  return fToString(simplify({ num: f.num, den: f.den + 1 }));
}

/* ------------------------------------------------------------------ */
/* Level 1 — Compare fractions (incl. ordering variant)                */
/* ------------------------------------------------------------------ */

function genCompare(difficulty: Difficulty): Question {
  // difficulty 1: same denominator; 2: same numerator; 3: unlike fractions
  let fracs: Fraction[] = [];
  if (difficulty === 1) {
    const den = pick(SIMPLE_DENS.filter((d) => d >= 5));
    const nums = shuffle(Array.from({ length: den - 1 }, (_, i) => i + 1)).slice(0, 4);
    fracs = nums.map((num) => ({ num, den }));
  } else if (difficulty === 2) {
    const num = randInt(1, 3);
    const dens = shuffle(ALL_DENS.filter((d) => d > num)).slice(0, 4);
    fracs = dens.map((den) => ({ num, den }));
  } else {
    const seen = new Set<number>();
    while (fracs.length < 4) {
      const f = properFraction(10, 2);
      const v = Math.round(value(f) * 10000);
      if (!seen.has(v)) {
        seen.add(v);
        fracs.push(f);
      }
    }
  }

  const askGreatest = Math.random() < 0.5;
  const sorted = [...fracs].sort((a, b) => compare(a, b));
  const correct = askGreatest ? sorted[sorted.length - 1] : sorted[0];
  const wrongTag: ErrorTag = askGreatest ? "lesser-value" : "greater-value";

  const options = shuffle<Option>(
    fracs.map((f) => ({
      text: fToString(f),
      ...(equals(f, correct) ? {} : { errorTag: wrongTag }),
    }))
  );
  const correctIndex = options.findIndex((o) => !o.errorTag);

  const visual: Visual = {
    kind: difficulty === 3 ? "numberline" : "bar",
    fractions: fracs,
    labels: fracs.map(fToString),
  };

  return {
    id: uid(),
    topic: "compare",
    level: 1,
    difficulty,
    promptKey: askGreatest ? "q.compare.greatest" : "q.compare.smallest",
    promptParams: {},
    options,
    correctIndex,
    explanationKey:
      difficulty === 1 ? "exp.compare.sameDen" : difficulty === 2 ? "exp.compare.sameNum" : "exp.compare.unlike",
    explanationParams: { answer: fToString(correct) },
    hintKey: difficulty === 1 ? "hint.compare.sameDen" : difficulty === 2 ? "hint.compare.sameNum" : "hint.compare.unlike",
    hintParams: {},
    objectiveKey: "obj.compare",
    visual,
  };
}

function genOrdering(difficulty: Difficulty): Question {
  const sameDen = difficulty < 3;
  let fracs: Fraction[] = [];
  if (sameDen) {
    const den = pick([6, 8, 10, 12]);
    const nums = shuffle(Array.from({ length: den - 1 }, (_, i) => i + 1)).slice(0, 3);
    fracs = nums.map((num) => ({ num, den }));
  } else {
    const seen = new Set<number>();
    while (fracs.length < 3) {
      const f = properFraction(8, 2);
      const v = Math.round(value(f) * 10000);
      if (!seen.has(v)) {
        seen.add(v);
        fracs.push(f);
      }
    }
  }
  const ascending = Math.random() < 0.5;
  const sorted = [...fracs].sort((a, b) => compare(a, b));
  const ordered = ascending ? sorted : [...sorted].reverse();
  const correct = ordered.map(fToString).join(", ");
  const seq = (fs: Fraction[]) => fs.map(fToString).join(", ");

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: seq([...ordered].reverse()), errorTag: "reversed-order" },
    { text: seq([ordered[1], ordered[0], ordered[2]]), errorTag: "random-near" },
    { text: seq([ordered[0], ordered[2], ordered[1]]), errorTag: "random-near" },
  ];
  const { options, correctIndex } = buildOptions(correct, distractorPool, () =>
    seq(shuffle([...fracs]))
  );

  return {
    id: uid(),
    topic: "ordering",
    level: 1,
    difficulty,
    promptKey: ascending ? "q.order.asc" : "q.order.desc",
    promptParams: {},
    options,
    correctIndex,
    explanationKey: "exp.order",
    explanationParams: { answer: correct },
    hintKey: "hint.order",
    hintParams: {},
    objectiveKey: "obj.order",
    visual: { kind: "bar", fractions: fracs, labels: fracs.map(fToString) },
  };
}

/* ------------------------------------------------------------------ */
/* Level 2 — Equivalent fractions                                      */
/* ------------------------------------------------------------------ */

function genEquivalent(difficulty: Difficulty): Question {
  const base = simplify(properFraction(difficulty === 1 ? 4 : difficulty === 2 ? 6 : 9, 2));
  const k = difficulty === 1 ? 2 : randInt(2, difficulty === 2 ? 3 : 5);
  const correctF = { num: base.num * k, den: base.den * k };
  const correct = fToString(correctF);

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString({ num: base.num + k, den: base.den + k }), errorTag: "additive-misconception" },
    { text: fToString({ num: base.num * k, den: base.den }), errorTag: "scaled-numerator-only" },
    { text: fToString({ num: base.num, den: base.den * k }), errorTag: "scaled-denominator-only" },
    { text: fToString({ num: base.num * k + 1, den: base.den * k }), errorTag: "off-by-one" },
  ].filter((d) => {
    const [n, dd] = d.text.split("/").map(Number);
    return !dd || !equals({ num: n, den: dd }, base);
  });

  const { options, correctIndex } = buildOptions(correct, distractorPool, () =>
    nearbyFraction(correctF)
  );

  return {
    id: uid(),
    topic: "equivalent",
    level: 2,
    difficulty,
    promptKey: "q.equivalent",
    promptParams: { a: fToString(base) },
    options,
    correctIndex,
    explanationKey: "exp.equivalent",
    explanationParams: { a: fToString(base), k, answer: correct },
    hintKey: "hint.equivalent",
    hintParams: { a: fToString(base) },
    objectiveKey: "obj.equivalent",
    visual: { kind: "bar", fractions: [base, correctF], labels: [fToString(base), "?"] },
  };
}

/* ------------------------------------------------------------------ */
/* Levels 3 & 4 — Addition / Subtraction                               */
/* ------------------------------------------------------------------ */

function additionPair(difficulty: Difficulty): [Fraction, Fraction] {
  if (difficulty === 1) {
    // same denominator, proper result
    const den = pick(SIMPLE_DENS.filter((d) => d >= 4));
    const n1 = randInt(1, den - 2);
    const n2 = randInt(1, den - n1 - 1);
    return [
      { num: n1, den },
      { num: n2, den },
    ];
  }
  if (difficulty === 2) {
    // related denominators (one is a multiple of the other)
    const den1 = pick([2, 3, 4, 5, 6]);
    const den2 = den1 * pick([2, 3]);
    return [properInDen(den1), properInDen(den2)];
  }
  // unlike denominators
  let d1 = pick(SIMPLE_DENS);
  let d2 = pick(SIMPLE_DENS);
  while (d2 === d1) d2 = pick(SIMPLE_DENS);
  return [properInDen(d1), properInDen(d2)];
}

function properInDen(den: number): Fraction {
  return { num: randInt(1, den - 1), den };
}

function genAddition(difficulty: Difficulty): Question {
  const [a, b] = additionPair(difficulty);
  const result = add(a, b);
  const correct = isImproperDisplay(result);

  const common = lcm(a.den, b.den);
  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString(simplify({ num: a.num + b.num, den: a.den + b.den })), errorTag: "added-denominators" },
    ...(a.den !== b.den
      ? [{ text: fToString(simplify({ num: a.num + b.num, den: common })), errorTag: "unconverted-numerators" as ErrorTag }]
      : []),
    { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
    { text: fToString(simplify({ num: Math.max(1, result.num - 1), den: result.den })), errorTag: "off-by-one" },
  ];

  const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, result), () =>
    nearbyFraction(result)
  );

  return {
    id: uid(),
    topic: "addition",
    level: 3,
    difficulty,
    promptKey: "q.addition",
    promptParams: { a: fToString(a), b: fToString(b) },
    options,
    correctIndex,
    explanationKey: a.den === b.den ? "exp.add.sameDen" : "exp.add.unlike",
    explanationParams: {
      a: fToString(a),
      b: fToString(b),
      common,
      ca: fToString({ num: (a.num * common) / a.den, den: common }),
      cb: fToString({ num: (b.num * common) / b.den, den: common }),
      answer: correct,
    },
    hintKey: a.den === b.den ? "hint.add.sameDen" : "hint.add.unlike",
    hintParams: { common },
    objectiveKey: "obj.add",
    visual: a.den === b.den ? { kind: "bar", fractions: [a, b, result], labels: [fToString(a), fToString(b), "?"] } : undefined,
  };
}

function genSubtraction(difficulty: Difficulty): Question {
  let a: Fraction, b: Fraction;
  if (difficulty === 1) {
    const den = pick(SIMPLE_DENS.filter((d) => d >= 4));
    const n1 = randInt(2, den - 1);
    const n2 = randInt(1, n1 - 1);
    a = { num: n1, den };
    b = { num: n2, den };
  } else {
    const den1 = pick(difficulty === 2 ? [2, 3, 4, 5, 6] : SIMPLE_DENS);
    const den2 = difficulty === 2 ? den1 * pick([2, 3]) : pick(SIMPLE_DENS.filter((d) => d !== den1));
    let x = properInDen(den1);
    let y = properInDen(den2);
    if (compare(x, y) < 0) [x, y] = [y, x];
    if (equals(x, y)) x = { num: Math.min(x.num + 1, x.den - 1) || x.num, den: x.den };
    a = x;
    b = y;
    if (compare(a, b) <= 0) {
      // last-resort safe pair
      a = { num: 3, den: 4 };
      b = { num: 1, den: 4 };
    }
  }
  const result = sub(a, b);
  const correct = fToString(result);
  const common = lcm(a.den, b.den);

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    ...(a.den !== b.den
      ? [
          { text: safeFrac(a.num - b.num, Math.abs(a.den - b.den)), errorTag: "subtracted-denominators" as ErrorTag },
          { text: fToString(simplify({ num: Math.abs(a.num - b.num) || 1, den: common })), errorTag: "unconverted-numerators" as ErrorTag },
        ]
      : []),
    { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
    { text: fToString(simplify({ num: a.num + b.num, den: a.den === b.den ? a.den : a.den + b.den })), errorTag: "denominator-confusion" },
  ].filter((d) => d.text !== "");

  const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, result), () =>
    nearbyFraction(result)
  );

  return {
    id: uid(),
    topic: "subtraction",
    level: 4,
    difficulty,
    promptKey: "q.subtraction",
    promptParams: { a: fToString(a), b: fToString(b) },
    options,
    correctIndex,
    explanationKey: a.den === b.den ? "exp.sub.sameDen" : "exp.sub.unlike",
    explanationParams: {
      a: fToString(a),
      b: fToString(b),
      common,
      ca: fToString({ num: (a.num * common) / a.den, den: common }),
      cb: fToString({ num: (b.num * common) / b.den, den: common }),
      answer: correct,
    },
    hintKey: a.den === b.den ? "hint.sub.sameDen" : "hint.sub.unlike",
    hintParams: { common },
    objectiveKey: "obj.sub",
    visual: a.den === b.den ? { kind: "bar", fractions: [a, b, result], labels: [fToString(a), fToString(b), "?"] } : undefined,
  };
}

function safeFrac(num: number, den: number): string {
  if (den <= 0 || num <= 0) return "";
  return fToString(simplify({ num, den }));
}

function dedupeByValue(
  pool: { text: string; errorTag: ErrorTag }[],
  correct: Fraction
): { text: string; errorTag: ErrorTag }[] {
  return pool.filter((d) => {
    const parts = d.text.split("/").map(Number);
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n)) && parts[1] > 0) {
      return !equals({ num: parts[0], den: parts[1] }, correct);
    }
    return d.text !== fToString(correct);
  });
}

/** Improper results are shown as mixed numbers (Year 5 convention). */
function isImproperDisplay(f: Fraction): string {
  if (f.num >= f.den) return mixedToString(toMixed(f));
  return fToString(f);
}

/* ------------------------------------------------------------------ */
/* Level 5 — Mixed numbers ↔ improper fractions                        */
/* ------------------------------------------------------------------ */

function genMixedNumbers(difficulty: Difficulty): Question {
  const den = pick(difficulty === 1 ? [2, 3, 4] : difficulty === 2 ? [3, 4, 5, 6] : [4, 5, 6, 8, 10]);
  const whole = randInt(1, difficulty === 3 ? 4 : 2);
  const num = randInt(1, den - 1);
  const g = gcd(num, den);
  const rNum = num / g;
  const rDen = den / g;
  const improper = fromMixed({ whole, num, den });
  const toMixedDir = Math.random() < 0.5;

  if (toMixedDir) {
    const correct = mixedToString({ whole, num: rNum, den: rDen });
    const distractorPool: { text: string; errorTag: ErrorTag }[] = [
      { text: mixedToString({ whole: rNum, num: whole, den: rDen }), errorTag: "swapped-parts" },
      { text: mixedToString({ whole: whole + 1, num: rNum, den: rDen }), errorTag: "wrong-whole" },
      { text: mixedToString({ whole, num: rNum, den: rDen + 1 }), errorTag: "denominator-confusion" },
      { text: mixedToString({ whole: Math.max(1, whole - 1), num: rNum, den: rDen }), errorTag: "wrong-whole" },
    ];
    const { options, correctIndex } = buildOptions(correct, distractorPool, () =>
      mixedToString({ whole: randInt(1, 5), num: rNum, den: rDen })
    );
    return {
      id: uid(),
      topic: "mixedNumbers",
      level: 5,
      difficulty,
      promptKey: "q.toMixed",
      promptParams: { a: fToString(improper) },
      options,
      correctIndex,
      explanationKey: "exp.toMixed",
      explanationParams: { a: fToString(improper), den: improper.den, whole, rem: improper.num - whole * improper.den, answer: correct },
      hintKey: "hint.toMixed",
      hintParams: { den: improper.den },
      objectiveKey: "obj.mixed",
      visual: { kind: "circle", fractions: [improper] },
    };
  }

  const correct = fToString(improper);
  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString({ num: whole + num, den }), errorTag: "additive-misconception" },
    { text: fToString({ num: whole * num + den, den }), errorTag: "swapped-parts" },
    { text: fToString({ num: improper.num + 1, den }), errorTag: "off-by-one" },
    { text: fToString({ num: whole * den, den }), errorTag: "wrong-whole" },
  ];
  const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, improper), () =>
    nearbyFraction(improper)
  );
  return {
    id: uid(),
    topic: "mixedNumbers",
    level: 5,
    difficulty,
    promptKey: "q.toImproper",
    promptParams: { a: mixedToString({ whole, num, den }) },
    options,
    correctIndex,
    explanationKey: "exp.toImproper",
    explanationParams: { whole, den, num, product: whole * den, answer: correct },
    hintKey: "hint.toImproper",
    hintParams: {},
    objectiveKey: "obj.mixed",
    visual: { kind: "circle", fractions: [improper] },
  };
}

/* ------------------------------------------------------------------ */
/* Level 6 — Word problems (RME contexts + Polya scaffold)             */
/* ------------------------------------------------------------------ */

function genWordProblem(difficulty: Difficulty): Question {
  const template = pick(WORD_PROBLEM_TEMPLATES);
  const name = pick(PUPIL_NAMES);
  let name2 = pick(PUPIL_NAMES);
  while (name2 === name) name2 = pick(PUPIL_NAMES);

  let a: Fraction, b: Fraction;
  if (template.op === "add") {
    [a, b] = additionPair(difficulty);
  } else if (template.fromWhole) {
    // remaining from a whole: 1 − a
    a = { num: 1, den: 1 };
    const den = pick(difficulty === 1 ? [4, 5, 6] : [6, 8, 10, 12]);
    b = { num: randInt(1, den - 1), den };
  } else {
    const den =
      difficulty === 1 ? pick([4, 5, 6, 8]) : pick([6, 8, 10, 12]);
    const n1 = randInt(2, den - 1);
    const n2 = randInt(1, n1 - 1);
    a = { num: n1, den };
    b = { num: n2, den };
    if (difficulty === 3) {
      // unlike denominators for KBAT-style problems
      const pairAdd = additionPair(3);
      const big = compare(pairAdd[0], pairAdd[1]) >= 0 ? pairAdd[0] : pairAdd[1];
      const small = compare(pairAdd[0], pairAdd[1]) >= 0 ? pairAdd[1] : pairAdd[0];
      if (!equals(big, small)) {
        a = big;
        b = small;
      }
    }
  }

  const result = template.op === "add" ? add(a, b) : sub(a, b);
  const correct = isImproperDisplay(result);
  const common = lcm(a.den, b.den);

  const distractorPool: { text: string; errorTag: ErrorTag }[] =
    template.op === "add"
      ? [
          { text: fToString(simplify({ num: a.num + b.num, den: a.den + b.den })), errorTag: "added-denominators" },
          { text: safeFrac(Math.abs(a.num * b.den - b.num * a.den), a.den * b.den), errorTag: "denominator-confusion" },
          { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
        ]
      : [
          { text: fToString(simplify({ num: a.num + b.num > 0 ? a.num + b.num : 1, den: common })), errorTag: "denominator-confusion" },
          { text: safeFrac(a.num - b.num, Math.abs(a.den - b.den)), errorTag: "subtracted-denominators" },
          { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
        ];

  const { options, correctIndex } = buildOptions(
    correct,
    dedupeByValue(distractorPool.filter((d) => d.text !== ""), result),
    () => nearbyFraction(result)
  );

  const aStr = template.fromWhole ? "1" : fToString(a);
  const params = { name, name2, a: aStr, b: fToString(b), answer: correct };

  const polya: PolyaPlan = {
    understand: { key: `polya.${template.op}.understand`, params },
    plan: { key: `polya.${template.op}.plan`, params },
    carryOut: { key: `polya.${template.op}.carry`, params },
    lookBack: { key: `polya.${template.op}.lookback`, params },
  };

  return {
    id: uid(),
    topic: "wordProblem",
    level: 6,
    difficulty,
    promptKey: `wp.${template.id}`,
    promptParams: params,
    options,
    correctIndex,
    explanationKey: template.op === "add" ? "exp.wp.add" : "exp.wp.sub",
    explanationParams: { a: aStr, b: fToString(b), answer: correct },
    hintKey: template.op === "add" ? "hint.wp.add" : "hint.wp.sub",
    hintParams: {},
    objectiveKey: "obj.word",
    visual:
      a.den === b.den || template.fromWhole
        ? { kind: "bar", fractions: template.fromWhole ? [b, result] : [a, b], labels: template.fromWhole ? [fToString(b), "?"] : [fToString(a), fToString(b)] }
        : undefined,
    polya,
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function generateQuestion(level: number, difficulty: Difficulty): Question {
  switch (level) {
    case 1:
      return difficulty >= 2 && Math.random() < 0.35 ? genOrdering(difficulty) : genCompare(difficulty);
    case 2:
      return genEquivalent(difficulty);
    case 3:
      return genAddition(difficulty);
    case 4:
      return genSubtraction(difficulty);
    case 5:
      return genMixedNumbers(difficulty);
    case 6:
      return genWordProblem(difficulty);
    default:
      return genCompare(1);
  }
}

/**
 * Question for the i-th turn of a match: difficulty (and, in mixed mode,
 * level) ramp up gradually as the match progresses.
 */
export function questionForTurn(
  index: number,
  total: number,
  opts: { level?: number; minDifficulty?: Difficulty } = {}
): Question {
  const progress = total > 1 ? index / (total - 1) : 0;
  const ramp = (Math.min(3, Math.max(1, Math.ceil(progress * 3))) || 1) as Difficulty;
  const difficulty = (Math.max(ramp, opts.minDifficulty ?? 1)) as Difficulty;
  const level = opts.level ?? Math.min(6, 1 + Math.floor(progress * 6));
  return generateQuestion(level, difficulty);
}
