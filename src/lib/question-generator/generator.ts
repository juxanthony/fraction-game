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

/* KSSR Year 5 works with denominators up to 10 (DSKP 7.1.1). */
const SIMPLE_DENS = [2, 3, 4, 5, 6, 8];
const ALL_DENS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function properFraction(maxDen: number, minDen = 2): Fraction {
  const den = randInt(minDen, maxDen);
  const num = randInt(1, den - 1);
  return { num, den };
}

/** Parse the numeric value of an option text ("3/4", "1 2/5", "2"); NaN for sequences. */
function parseValue(text: string): number {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = /^(\d+)\/(\d+)$/.exec(text);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const whole = /^(\d+)$/.exec(text);
  if (whole) return Number(whole[1]);
  return NaN;
}

/**
 * Build 4 unique options. Uniqueness is enforced by displayed text AND by
 * numeric value (so "1 1/2" and "3/2" can never appear together).
 */
function buildOptions(
  correct: string,
  distractorPool: { text: string; errorTag: ErrorTag }[],
  fallback: () => string
): { options: Option[]; correctIndex: number } {
  const seenText = new Set<string>([correct]);
  const seenValues = new Set<number>();
  const correctValue = parseValue(correct);
  if (!Number.isNaN(correctValue)) seenValues.add(Math.round(correctValue * 100000));

  const accept = (text: string): boolean => {
    if (!text || seenText.has(text)) return false;
    const v = parseValue(text);
    if (!Number.isNaN(v)) {
      const key = Math.round(v * 100000);
      if (seenValues.has(key)) return false;
      seenValues.add(key);
    }
    seenText.add(text);
    return true;
  };

  const distractors: Option[] = [];
  for (const d of distractorPool) {
    if (distractors.length >= 3) break;
    if (accept(d.text)) distractors.push(d);
  }
  let guard = 0;
  while (distractors.length < 3 && guard++ < 200) {
    const t = fallback();
    if (accept(t)) distractors.push({ text: t, errorTag: "random-near" });
  }
  const options = shuffle<Option>([{ text: correct }, ...distractors]);
  return { options, correctIndex: options.findIndex((o) => !o.errorTag && o.text === correct) };
}

/** Diverse fallback distractor: a fraction near the value of `f`, never equal to it. */
function nearbyFraction(f: Fraction): string {
  const target = f.num / f.den;
  const den = randInt(2, 12);
  const num = Math.max(1, Math.round(target * den) + pick([-2, -1, 1, 2]));
  const candidate = simplify({ num, den });
  if (candidate.num === 0) return nearbyFraction(f);
  return candidate.num >= candidate.den ? mixedToString(toMixed(candidate)) : fToString(candidate);
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
    const den = pick([6, 8, 9, 10]);
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

  const rawPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString({ num: base.num + k, den: base.den + k }), errorTag: "additive-misconception" },
    { text: fToString({ num: base.num * k, den: base.den }), errorTag: "scaled-numerator-only" },
    { text: fToString({ num: base.num, den: base.den * k }), errorTag: "scaled-denominator-only" },
    { text: fToString({ num: base.num * k + 1, den: base.den * k }), errorTag: "off-by-one" },
  ];
  const distractorPool = rawPool.filter((d) => {
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
  // DSKP coverage: 7.1.2 (same den), 7.1.3 (unlike dens),
  // 7.1.4 (mixed + proper), 7.1.1 (up to three numbers incl. wholes).
  if (difficulty === 2 && Math.random() < 0.4) return genAddMixedProper(2);
  if (difficulty === 3) {
    const r = Math.random();
    if (r < 0.4) return genAddThreeNumbers();
    if (r < 0.7) return genAddMixedProper(3);
  }
  const [a, b] = additionPair(difficulty);
  const result = add(a, b);
  const correct = isImproperDisplay(result);

  const common = lcm(a.den, b.den);
  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString(simplify({ num: a.num + b.num, den: a.den + b.den })), errorTag: "added-denominators" as ErrorTag },
    ...(a.den !== b.den
      ? [{ text: fToString(simplify({ num: a.num + b.num, den: common })), errorTag: "unconverted-numerators" as ErrorTag }]
      : []),
    { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" as ErrorTag },
    { text: fToString(simplify({ num: Math.max(1, result.num - 1), den: result.den })), errorTag: "off-by-one" as ErrorTag },
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
    objectiveKey: a.den === b.den ? "obj.add.same" : "obj.add.unlike",
    visual: a.den === b.den ? { kind: "bar", fractions: [a, b, result], labels: [fToString(a), fToString(b), "?"] } : undefined,
  };
}

/** 7.1.4 — mixed number + proper fraction (fraction parts kept proper, no carrying). */
function genAddMixedProper(difficulty: Difficulty): Question {
  const den = pick([3, 4, 5, 6, 8, 10]);
  const whole = randInt(1, 3);
  let fa: Fraction;
  let b: Fraction;
  if (difficulty === 2) {
    const n1 = randInt(1, den - 2);
    fa = { num: n1, den };
    b = { num: randInt(1, den - n1 - 1), den };
  } else {
    // unlike denominators; keep the fraction-part sum below 1
    fa = { num: 1, den };
    let denB = pick([3, 4, 5, 6, 8, 10].filter((d) => d !== den));
    let guard = 0;
    b = { num: 1, den: denB };
    while (guard++ < 50) {
      const cand = properInDen(denB);
      if (value(fa) + value(cand) < 1) {
        b = cand;
        break;
      }
      denB = pick([4, 5, 6, 8, 10].filter((d) => d !== den));
    }
  }
  const fs = add(fa, b);
  const total = add(fromMixed({ whole, num: fa.num, den: fa.den }), b);
  const correct = mixedToString(toMixed(total));
  const aStr = mixedToString({ whole, num: fa.num, den: fa.den });

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    { text: fToString(fs), errorTag: "wrong-whole" }, // dropped the whole number
    { text: mixedToString({ whole: whole + 1, num: fs.num, den: fs.den }), errorTag: "wrong-whole" },
    {
      text: mixedToString(toMixed(simplify({ num: (fa.num + b.num) * 1 + whole * (fa.den + b.den), den: fa.den + b.den }))),
      errorTag: "added-denominators",
    },
    { text: mixedToString({ whole, num: Math.min(fs.num + 1, Math.max(1, fs.den - 1)), den: fs.den }), errorTag: "off-by-one" },
  ];

  const { options, correctIndex } = buildOptions(correct, distractorPool, () => nearbyFraction(total));
  return {
    id: uid(),
    topic: "addition",
    level: 3,
    difficulty,
    promptKey: "q.addition",
    promptParams: { a: aStr, b: fToString(b) },
    options,
    correctIndex,
    explanationKey: "exp.add.mixed",
    explanationParams: { whole, fa: fToString(fa), b: fToString(b), fs: fToString(fs), answer: correct },
    hintKey: "hint.add.mixed",
    hintParams: {},
    objectiveKey: "obj.add.mixed",
  };
}

/** 7.1.1 — add up to three numbers (whole numbers + proper fractions, den ≤ 10). */
function genAddThreeNumbers(): Question {
  const den = pick([4, 5, 6, 8, 10]);
  const withWhole = Math.random() < 0.5;
  const a = properInDen(den);
  const b = properInDen(den);
  const firstTerm = withWhole ? String(randInt(1, 2)) : fToString(properInDen(den));
  const firstFrac: Fraction = withWhole
    ? { num: Number(firstTerm) * den, den }
    : (() => {
        const [n, d] = firstTerm.split("/").map(Number);
        return { num: n, den: d };
      })();

  const ab = add(firstFrac, a);
  const total = add(ab, b);
  const correct = isImproperDisplay(total);
  const abDisplay = isImproperDisplay(ab);

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    {
      text: fToString(simplify({ num: firstFrac.num + a.num + b.num, den: den * 3 })),
      errorTag: "added-denominators",
    },
    { text: isImproperDisplay(simplify({ num: total.num + 1, den: total.den })), errorTag: "off-by-one" },
    {
      text: isImproperDisplay(simplify({ num: Math.max(1, total.num - total.den), den: total.den })),
      errorTag: "wrong-whole",
    },
  ];

  const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, total), () =>
    nearbyFraction(total)
  );
  return {
    id: uid(),
    topic: "addition",
    level: 3,
    difficulty: 3,
    promptKey: "q.addition3",
    promptParams: { a: firstTerm, b: fToString(a), c: fToString(b) },
    options,
    correctIndex,
    explanationKey: "exp.add.three",
    explanationParams: { a: firstTerm, b: fToString(a), ab: abDisplay, c: fToString(b), answer: correct },
    hintKey: "hint.add.three",
    hintParams: {},
    objectiveKey: "obj.add.three",
  };
}

function genSubtraction(difficulty: Difficulty): Question {
  // DSKP coverage: 7.2.2 (proper fractions, same & different dens),
  // 7.2.3 (mixed − proper), 7.2.1 (whole numbers / up to three numbers).
  if (difficulty === 2 && Math.random() < 0.4) return genSubMixedProper(2);
  if (difficulty === 3) {
    const r = Math.random();
    if (r < 0.4) return genSubWholeNumbers();
    if (r < 0.7) return genSubMixedProper(3);
  }
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

  const rawPool: { text: string; errorTag: ErrorTag }[] = [
    ...(a.den !== b.den
      ? [
          { text: safeFrac(a.num - b.num, Math.abs(a.den - b.den)), errorTag: "subtracted-denominators" as ErrorTag },
          { text: fToString(simplify({ num: Math.abs(a.num - b.num) || 1, den: common })), errorTag: "unconverted-numerators" as ErrorTag },
        ]
      : []),
    { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
    { text: fToString(simplify({ num: a.num + b.num, den: a.den === b.den ? a.den : a.den + b.den })), errorTag: "denominator-confusion" },
  ];
  const distractorPool = rawPool.filter((d) => d.text !== "");

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
    objectiveKey: "obj.sub.proper",
    visual: a.den === b.den ? { kind: "bar", fractions: [a, b, result], labels: [fToString(a), fToString(b), "?"] } : undefined,
  };
}

/** 7.2.3 — mixed number − proper fraction. */
function genSubMixedProper(difficulty: Difficulty): Question {
  const den = pick([3, 4, 5, 6, 8, 10]);
  const whole = randInt(1, 3);
  const numM = randInt(1, den - 1);
  const m = { whole, num: numM, den };
  const imp = fromMixed(m);
  const b =
    difficulty === 2
      ? { num: randInt(1, den - 1), den }
      : properInDen(pick([3, 4, 5, 6, 8, 10].filter((d) => d !== den)));
  const result = sub(imp, b);
  const correct = isImproperDisplay(result);
  const aStr = mixedToString(m);

  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    // subtracted the smaller numerator from the bigger, ignoring the borrow/conversion
    ...(b.den === den
      ? [
          {
            text: mixedToString({ whole, num: Math.abs(numM - b.num) || 1, den }),
            errorTag: "denominator-confusion" as ErrorTag,
          },
        ]
      : [
          {
            text: safeFrac(imp.num - b.num, Math.abs(imp.den - b.den)),
            errorTag: "subtracted-denominators" as ErrorTag,
          },
        ]),
    { text: isImproperDisplay(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
    {
      text: mixedToString({ whole: whole + 1, num: Math.max(1, Math.abs(numM - b.num) || 1), den }),
      errorTag: "wrong-whole",
    },
  ];

  const { options, correctIndex } = buildOptions(
    correct,
    dedupeByValue(distractorPool.filter((d) => d.text !== ""), result),
    () => nearbyFraction(result)
  );
  return {
    id: uid(),
    topic: "subtraction",
    level: 4,
    difficulty,
    promptKey: "q.subtraction",
    promptParams: { a: aStr, b: fToString(b) },
    options,
    correctIndex,
    explanationKey: "exp.sub.mixed",
    explanationParams: { a: aStr, imp: fToString(imp), b: fToString(b), answer: correct },
    hintKey: "hint.sub.mixed",
    hintParams: {},
    objectiveKey: "obj.sub.mixed",
  };
}

/** 7.2.1 — subtraction involving whole numbers, up to three numbers. */
function genSubWholeNumbers(): Question {
  const den = pick([4, 5, 6, 8, 10]);
  const w = randInt(1, 3);
  const threeTerms = Math.random() < 0.5;
  const b = properInDen(den);
  const whole: Fraction = { num: w * den, den };

  if (!threeTerms) {
    const result = sub(whole, b);
    const correct = isImproperDisplay(result);
    const distractorPool: { text: string; errorTag: ErrorTag }[] = [
      { text: mixedToString({ whole: w, num: b.num, den }), errorTag: "denominator-confusion" },
      { text: isImproperDisplay(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
      {
        text: isImproperDisplay(simplify({ num: Math.max(1, result.num - den), den } )),
        errorTag: "wrong-whole",
      },
    ];
    const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, result), () =>
      nearbyFraction(result)
    );
    return {
      id: uid(),
      topic: "subtraction",
      level: 4,
      difficulty: 3,
      promptKey: "q.subtraction",
      promptParams: { a: String(w), b: fToString(b) },
      options,
      correctIndex,
      explanationKey: "exp.sub.whole",
      explanationParams: { w, impW: `${w * den}/${den}`, b: fToString(b), answer: correct },
      hintKey: "hint.sub.whole",
      hintParams: {},
      objectiveKey: "obj.sub.three",
    };
  }

  // w − b − c, kept non-negative
  let c = properInDen(den);
  let guard = 0;
  while (b.num + c.num >= w * den && guard++ < 50) c = properInDen(den);
  if (b.num + c.num >= w * den) c = { num: 1, den };
  const ab = sub(whole, b);
  const result = sub(ab, c);
  const correct = isImproperDisplay(result);
  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    {
      text: isImproperDisplay(simplify({ num: w * den - b.num + c.num, den })),
      errorTag: "denominator-confusion", // added the last number instead of subtracting
    },
    { text: isImproperDisplay(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" },
    {
      text: isImproperDisplay(simplify({ num: Math.max(1, result.num - den), den })),
      errorTag: "wrong-whole",
    },
  ];
  const { options, correctIndex } = buildOptions(correct, dedupeByValue(distractorPool, result), () =>
    nearbyFraction(result)
  );
  return {
    id: uid(),
    topic: "subtraction",
    level: 4,
    difficulty: 3,
    promptKey: "q.subtraction3",
    promptParams: { a: String(w), b: fToString(b), c: fToString(c) },
    options,
    correctIndex,
    explanationKey: "exp.sub.three",
    explanationParams: { a: String(w), b: fToString(b), ab: isImproperDisplay(ab), c: fToString(c), answer: correct },
    hintKey: "hint.sub.three",
    hintParams: {},
    objectiveKey: "obj.sub.three",
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
/* Level 6 — Fraction of a quantity (DSKP 7.3.1, e.g. 2/5 of 50)       */
/* ------------------------------------------------------------------ */

function coprimeProper(dens: number[]): Fraction {
  let f = properInDen(pick(dens));
  let guard = 0;
  while (gcd(f.num, f.den) !== 1 && guard++ < 30) f = properInDen(pick(dens));
  return simplify(f);
}

function quantityFor(f: Fraction, difficulty: Difficulty): { q: number; unit: number } {
  const unit =
    difficulty === 1 ? randInt(2, 6) : difficulty === 2 ? randInt(3, 10) : randInt(5, 12);
  return { q: f.den * unit, unit };
}

function quantityOptions(
  answer: number,
  unit: number,
  q: number,
  num: number
): { options: Option[]; correctIndex: number } {
  const distractorPool: { text: string; errorTag: ErrorTag }[] = [
    ...(num > 1 ? [{ text: String(unit), errorTag: "unit-fraction-only" as ErrorTag }] : []),
    { text: String(q - answer), errorTag: "found-remainder" },
    { text: String(answer + unit), errorTag: "off-by-one" },
    { text: String(Math.max(1, answer - unit)), errorTag: "off-by-one" },
  ];
  return buildOptions(String(answer), distractorPool, () => {
    const tweak = answer + pick([-3, -2, -1, 1, 2, 3, unit, -unit]);
    return String(Math.max(1, tweak));
  });
}

function genFractionOfQuantity(difficulty: Difficulty): Question {
  const f = coprimeProper(difficulty === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8, 10]);
  const { q, unit } = quantityFor(f, difficulty);
  const answer = f.num * unit;
  const { options, correctIndex } = quantityOptions(answer, unit, q, f.num);

  return {
    id: uid(),
    topic: "fractionOfQuantity",
    level: 6,
    difficulty,
    promptKey: "q.ofQuantity",
    promptParams: { a: fToString(f), q },
    options,
    correctIndex,
    explanationKey: "exp.ofQuantity",
    explanationParams: { q, den: f.den, unit, num: f.num, answer },
    hintKey: "hint.ofQuantity",
    hintParams: { den: f.den, num: f.num },
    objectiveKey: "obj.ofQuantity",
    visual: { kind: "bar", fractions: [f], labels: [fToString(f)] },
  };
}

/* ------------------------------------------------------------------ */
/* Level 7 — Word problems (RME contexts + Polya scaffold)             */
/* ------------------------------------------------------------------ */

function genWordProblem(difficulty: Difficulty): Question {
  const template = pick(WORD_PROBLEM_TEMPLATES);
  const name = pick(PUPIL_NAMES);
  let name2 = pick(PUPIL_NAMES);
  while (name2 === name) name2 = pick(PUPIL_NAMES);

  // Integrated problem solving for DSKP 7.3: "fraction OF a quantity" stories.
  if (template.op === "of") {
    const f = coprimeProper(difficulty === 1 ? [2, 4, 5] : [3, 4, 5, 6, 8, 10]);
    const { q, unit } = quantityFor(f, difficulty);
    const answer = f.num * unit;
    const { options, correctIndex } = quantityOptions(answer, unit, q, f.num);
    const params = { name, q, a: fToString(f), den: f.den, num: f.num, unit, answer };
    return {
      id: uid(),
      topic: "wordProblem",
      level: 7,
      difficulty,
      promptKey: `wp.${template.id}`,
      promptParams: params,
      options,
      correctIndex,
      explanationKey: "exp.wp.of",
      explanationParams: params,
      hintKey: "hint.wp.of",
      hintParams: {},
      objectiveKey: "obj.word",
      visual: { kind: "bar", fractions: [f], labels: [fToString(f)] },
      polya: {
        understand: { key: "polya.of.understand", params },
        plan: { key: "polya.of.plan", params },
        carryOut: { key: "polya.of.carry", params },
        lookBack: { key: "polya.of.lookback", params },
      },
    };
  }

  let a: Fraction, b: Fraction;
  if (template.op === "add") {
    [a, b] = additionPair(difficulty);
  } else if (template.fromWhole) {
    // remaining from a whole: 1 − a
    a = { num: 1, den: 1 };
    const den = pick(difficulty === 1 ? [4, 5, 6] : [6, 8, 9, 10]);
    b = { num: randInt(1, den - 1), den };
  } else {
    const den =
      difficulty === 1 ? pick([4, 5, 6, 8]) : pick([6, 8, 9, 10]);
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
          { text: fToString(simplify({ num: a.num + b.num, den: a.den + b.den })), errorTag: "added-denominators" as ErrorTag },
          { text: safeFrac(Math.abs(a.num * b.den - b.num * a.den), a.den * b.den), errorTag: "denominator-confusion" as ErrorTag },
          { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" as ErrorTag },
        ]
      : [
          { text: fToString(simplify({ num: a.num + b.num > 0 ? a.num + b.num : 1, den: common })), errorTag: "denominator-confusion" as ErrorTag },
          { text: safeFrac(a.num - b.num, Math.abs(a.den - b.den)), errorTag: "subtracted-denominators" as ErrorTag },
          { text: fToString(simplify({ num: result.num + 1, den: result.den })), errorTag: "off-by-one" as ErrorTag },
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
    level: 7,
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
      return genFractionOfQuantity(difficulty);
    case 7:
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
  const level = opts.level ?? Math.min(7, 1 + Math.floor(progress * 7));
  return generateQuestion(level, difficulty);
}
