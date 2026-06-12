# Teacher Guide

## Pedagogical design

- **Curriculum**: every item maps to a KSSR Mathematics Year 5 fraction standard; the learning objective is shown after each answer and recorded per attempt.
- **Polya's model**: word problems carry a four-step scaffold (Understand → Plan → Carry Out → Look Back) that pupils can open in Practice Mode. Scaffold usage is logged.
- **RME contexts**: word problems use Malaysian daily-life situations — food (kek, nasi lemak, kuih), shopping, sports, school activities, travel — never bare abstract numbers.
- **Misconception-driven feedback**: wrong options are constructed from documented fraction misconceptions (adding denominators, additive equivalence, numerator-only scaling…). The dashboard tells you *which* misconception each pupil holds, not just that they got it wrong.

## Suggested classroom flow

1. **Introduce (10 min)** — demonstrate one tug-of-war round on the projector; discuss the explanation panel.
2. **Practice (15 min)** — pupils use Practice Mode on the topic you are teaching; hints and Polya steps are available.
3. **Consolidate (10 min)** — Challenge Mode or a class tournament; the timer raises engagement.
4. **Review** — open the Teacher Dashboard and discuss the most common mistakes with the class.

Two-player mode works well for pair work and peer tutoring (the explanation appears after every answer, so the watching pupil learns too).

## Linking pupils to your dashboard (cloud monitoring)

By default the dashboard shows pupils who play **on the same device** — fine for a shared classroom tablet, no setup needed. To monitor your whole class across many devices (school lab, pupils' homes):

1. Ask your school/IT coordinator to enable Firebase cloud sync once (5 minutes — see [DEPLOYMENT.md](DEPLOYMENT.md)).
2. **Invent a class code**, e.g. `5B-TAN`. Any short code works; include your name or class to keep it unique within your school.
3. Tell pupils to type this code into the **"Class code"** field when they create their player. (Existing players can be re-created with the code, or keep playing on the same device.)
4. Open **Teacher Dashboard → Monitor a class**, enter the code and press **Load class**. The overview, student drill-downs, skills analysis and exports now show the linked class's latest cloud data; press **Show this device** to switch back.

The class code is not a password — treat it like a capability: anyone who knows it (and your app URL) can view the class's first names and scores. For research-grade deployments use the strict security rules in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## The dashboard (/teacher)

| Tab | What you see |
| --- | --- |
| **Class Overview** | Pupil count, total questions, class accuracy, learning time; weak skills (topics under 60% accuracy); daily growth trend; badge totals |
| **Students** | Sortable roster with accuracy badges; click a pupil for their topic profile, error patterns and personal growth trend |
| **Skills Analysis** | Accuracy and average time per topic; the misconception leaderboard; a pupil × topic mastery matrix (Beginning / Developing / Proficient / Mastered) |
| **Question Performance** | Per-topic attempt counts, correct rate, average time and hint usage |
| **Export** | One-click CSV downloads and printable reports |

**Mastery levels** are computed from each pupil's last 10 attempts per topic (recency-weighted): ≥85% Mastered, ≥70% Proficient, ≥50% Developing, otherwise Beginning.

## Exports

- **Class summary (CSV)** — one row per pupil: accuracy, time, hints, matches, XP. Opens directly in Excel (UTF-8 BOM included so Chinese names display correctly).
- **Attempts (CSV)** — one row per question attempt with full detail.
- **Research dataset (CSV)** — anonymised participant ids (S001, S002…), suitable for statistical analysis. Codebook: [RESEARCH_DATA.md](RESEARCH_DATA.md).
- **Print / PDF** — the class report and individual reports are print-styled; use the browser's *Save as PDF*.

## Data & privacy notes

- All data stays on the device unless Firebase sync is explicitly configured by the school.
- Profiles use first names/nicknames and class labels only; no accounts, emails or passwords.
- The research export replaces names with anonymous codes. Obtain the appropriate parental/ministry consent before using pupil data in research.
