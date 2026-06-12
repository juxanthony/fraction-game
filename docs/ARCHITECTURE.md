# System Architecture

## Overview

Fraction Tug of War is a **local-first single-page application** built on the Next.js App Router. All gameplay, question generation, analytics and reporting run client-side; persistence is localStorage with an optional, lazily-loaded Firestore mirror. This keeps the game fully usable on classroom devices with no network, while still supporting school-wide aggregation when Firebase is configured.

```
┌────────────────────────────────────────────────────────────────┐
│                          UI (React 19)                         │
│  pages: / · /play/* · /profile · /teacher                      │
│  components: game/ fractions/ dashboard/ profile/ ui/          │
└──────────────┬─────────────────────────────┬───────────────────┘
               │                             │
       ┌───────▼────────┐            ┌───────▼────────┐
       │  Game engine    │            │  Analytics      │
       │  (state machine)│            │  (aggregations) │
       └───────┬────────┘            └───────▲────────┘
               │ answers/turns               │ reads
       ┌───────▼────────┐            ┌───────┴────────┐
       │  Recorder       │── writes ─▶  Storage (local)│
       │  XP/badges/     │            │  localStorage   │
       │  missions       │            └───────┬────────┘
       └───────┬────────┘                    │ mirror (optional)
               │                      ┌───────▼────────┐
       ┌───────▼────────┐            │  Firebase sync  │
       │ Question        │            │  (lazy import)  │
       │ generator       │            └────────────────┘
       └────────────────┘
```

## Module responsibilities

| Module | Path | Responsibility |
| --- | --- | --- |
| Fraction math | `src/lib/math/fraction.ts` | Exact integer fraction arithmetic (gcd/lcm, add, sub, compare, simplify, mixed-number conversion). No floating-point answers anywhere. |
| Question generator | `src/lib/question-generator/` | Produces unlimited KSSR-aligned items. Each item: prompt key + params, 4 value-unique options, misconception-tagged distractors, explanation, hint, learning objective, optional SVG visual spec and Polya scaffold. |
| Game engine | `src/lib/game-engine/engine.ts` | Pure state machine: rope position (−5…+5), scores, streaks, phases (`playing → feedback → finished`). Tournament AI answers probabilistically per round. |
| Recorder | `src/lib/game-engine/recorder.ts` | The single write path: attempt records (research data), match records, XP awards, mission progress, badge evaluation, tournament unlocks. |
| Gamification | `src/lib/gamification/` | XP economy and level curve, badge definitions/conditions, deterministic daily-mission rotation. |
| Analytics | `src/lib/analytics/` | Topic accuracy, average time, hint rate, mastery (recency-weighted), error-pattern distribution, daily growth trend; CSV exporters. |
| i18n | `src/lib/i18n/` | React context provider, `t(key, params)` interpolation, three full dictionaries (zh default / en / ms), speech-synthesis locale mapping. |
| Storage | `src/lib/storage/local.ts` | Versioned localStorage keys, profile CRUD, attempt/match/mission persistence, capped attempt history. |
| Firebase | `src/lib/firebase/` | Env-gated config + fire-and-forget Firestore mirroring with anonymous auth; lazily imported so the bundle and offline path are unaffected. |

## Key design decisions

1. **Questions are i18n-neutral data.** The generator emits translation keys and parameters, never prose. The same generated item renders in Chinese, English or Malay instantly — language switching mid-match works.
2. **Distractors encode misconceptions.** Every wrong option carries an `errorTag` (e.g. `added-denominators`, `additive-misconception`). When a pupil picks it, the tag is stored on the attempt — this is what powers the teacher's "most common mistakes" analytics and the research dataset, with no post-hoc coding needed.
3. **Pure engine, side-effecting recorder.** The match engine is a pure function of (state, action) → state, making it trivially testable. All persistence happens in the recorder, called exactly once per answer and once per match end (guarded against React Strict Mode double-invocation).
4. **Local-first.** A school lab with no Wi-Fi loses nothing. Firestore is an additive mirror, never a dependency.
5. **SVG everything.** Fraction models, the tug-of-war field and the dashboard charts are hand-rolled SVG — zero image assets, crisp at any DPI, and themable.

## Match flow

```
createMatch(config)
   │
   ▼
playing ──answer(i | timeout)──▶ recordAttempt() ──▶ feedback
   ▲                                                   │
   │              advance()                            │
   └────────── (next question) ◀───────────────────────┤
                                                       │ rope at ±5
                                                       │ or last question
                                                       ▼
                                                   finished ──▶ finalizeMatch()
                                                                 (XP, badges,
                                                                  missions,
                                                                  unlocks)
```

## Difficulty progression

- Within a match, `questionForTurn(index, total)` ramps difficulty 1 → 3 with match progress; mixed-topic matches also sweep levels 1 → 6.
- Across the tournament, each round raises AI accuracy (25% → 65%) and the difficulty floor (1 → 3).
- Per topic, difficulty controls denominators (small/related/unlike), numerator ranges and whether mixed numbers appear.
