/**
 * Fraction arithmetic utilities.
 * All fractions are kept as integer numerator/denominator pairs.
 */

export interface Fraction {
  num: number;
  den: number;
}

export interface MixedNumber {
  whole: number;
  num: number;
  den: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export function fraction(num: number, den: number): Fraction {
  return { num, den };
}

export function simplify(f: Fraction): Fraction {
  const g = gcd(f.num, f.den);
  return { num: f.num / g, den: f.den / g };
}

export function equals(a: Fraction, b: Fraction): boolean {
  return a.num * b.den === b.num * a.den;
}

export function compare(a: Fraction, b: Fraction): number {
  return a.num * b.den - b.num * a.den;
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

export function value(f: Fraction): number {
  return f.num / f.den;
}

export function isProper(f: Fraction): boolean {
  return f.num < f.den;
}

export function toMixed(f: Fraction): MixedNumber {
  const whole = Math.floor(f.num / f.den);
  const rest = simplify({ num: f.num - whole * f.den, den: f.den });
  return { whole, num: rest.num, den: rest.den };
}

export function fromMixed(m: MixedNumber): Fraction {
  return { num: m.whole * m.den + m.num, den: m.den };
}

/** Render as a plain string, e.g. "3/4" or "1 2/5" for mixed numbers. */
export function toString(f: Fraction): string {
  if (f.den === 1) return String(f.num);
  return `${f.num}/${f.den}`;
}

export function mixedToString(m: MixedNumber): string {
  if (m.num === 0) return String(m.whole);
  if (m.whole === 0) return `${m.num}/${m.den}`;
  return `${m.whole} ${m.num}/${m.den}`;
}

/** Spoken form for text-to-speech, language-neutral parts handled by caller. */
export function key(f: Fraction): string {
  const s = simplify(f);
  return `${s.num}/${s.den}`;
}
