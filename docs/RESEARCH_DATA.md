# Research Data Codebook

Fraction Tug of War records every pupil's **problem-solving pathway** at the attempt level, designed for learning-analytics research on the development of fraction problem-solving skills (e.g. dissertation interventions). Data collection is automatic during normal play; no separate instrumentation is needed.

## What is captured, per attempt

| Construct | Variable(s) | How it is measured |
| --- | --- | --- |
| Problem-solving pathway | `topic`, `curriculum_level`, `item_difficulty`, `session_mode`, ordering by `timestamp_iso` | Item characteristics + chronological sequence reconstruct each pupil's pathway through the curriculum |
| Response time | `response_time_ms` | Question display → answer selection (or timeout) |
| Hint usage | `hint_used` | Pupil opened the hint scaffold before answering |
| Polya scaffold usage | `polya_scaffold_viewed` | Pupil opened the 4-step problem-solving panel (word problems) |
| Error patterns | `error_pattern` | Each distractor is built from a specific misconception; selecting it auto-codes the error (see taxonomy below) |
| Mastery progression | `is_correct`, `streak_after`, recency-weighted mastery levels in-app | Accuracy over time per topic; the app computes Beginning → Mastered bands from the last 10 attempts per topic |

## Export

**Teacher Dashboard → Export → Export research dataset (CSV).** One row per attempt, anonymised (`participant_id` = S001, S002, … assigned per device), sorted chronologically.

### Columns

| Column | Type | Description |
| --- | --- | --- |
| `participant_id` | string | Anonymous pupil code |
| `class` | string | Class label as entered at profile creation |
| `timestamp_iso` | ISO 8601 | Attempt time |
| `session_mode` | factor | practice · challenge · tournament · multiplayer |
| `topic` | factor | compare · ordering · equivalent · addition · subtraction · mixedNumbers · fractionOfQuantity · wordProblem |
| `curriculum_level` | 1–7 | Game level (maps to KSSR fraction skills) |
| `item_difficulty` | 1–3 | Within-level difficulty band |
| `is_correct` | 0/1 | Outcome |
| `error_pattern` | factor | Misconception code (empty when correct) |
| `response_time_ms` | integer | Response latency |
| `hint_used` | 0/1 | Hint scaffold opened |
| `polya_scaffold_viewed` | 0/1 | Polya panel opened |
| `streak_after` | integer | Consecutive-correct count after the attempt |

### Error-pattern taxonomy

| Code | Misconception |
| --- | --- |
| `added-denominators` / `subtracted-denominators` | Operated on denominators as whole numbers (a/b ± c/d = (a±c)/(b±d)) |
| `additive-misconception` | Believes n+k/d+k is equivalent to n/d |
| `scaled-numerator-only` / `scaled-denominator-only` | Scaled one term only when forming equivalents |
| `unconverted-numerators` | Found the common denominator but kept original numerators |
| `denominator-confusion` | Misunderstands the denominator's role (e.g. bigger denominator = bigger fraction) |
| `lesser-value` / `greater-value` | Magnitude comparison error |
| `swapped-parts` / `wrong-whole` | Mixed-number structure errors |
| `reversed-order` | Ordered in the opposite direction |
| `unit-fraction-only` | Found 1/d of the quantity but did not multiply by the numerator |
| `found-remainder` | Found the remaining part of the quantity instead of the asked part |
| `off-by-one` | Procedural slip |
| `random-near` | Unclassified/careless |
| `timeout` | No answer within the time limit |

## Suggested analyses

- **Growth modelling**: accuracy or response time over `timestamp` per participant (multilevel growth curves; the app's daily-trend chart is a descriptive preview).
- **Misconception remediation**: frequency of each `error_pattern` across the intervention period.
- **Scaffold effects**: compare outcomes of attempts with/without `hint_used` / `polya_scaffold_viewed` (within-pupil).
- **Engagement**: session counts, time-on-task (`response_time_ms` sums), streaks and gamification milestones from the matches/profile data.

## Ethics

Names never leave the device in the research export. Researchers must still obtain institutional ethics approval, school/ministry permission and parental consent as required (e.g. Malaysian EPRD approval for school-based research) before collecting or analysing pupil data.
