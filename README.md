# 🚩 Fraction Tug of War · 分数拔河大赛 · Tarik Tali Pecahan

An educational mathematics game for **Malaysian Chinese Primary School (SJKC) Year 5 pupils**, built around a tug-of-war championship. Every correct answer pulls the rope towards your team; every mistake lets the opponent pull back. Win the match through fraction mastery.

Aligned to the **KSSR Mathematics Year 5** syllabus (Fractions), with **Polya's four-step problem-solving model** and **Realistic Mathematics Education (RME)** contexts woven into every word problem.

## ✨ Features

| Area | What's included |
| --- | --- |
| **Game modes** | Practice (unlimited, hints) · Challenge (20 questions, XP) · Tournament (5 AI rounds: School → District → State → National → Champion Cup) · Two-player on one device. Every question has a countdown: 30 s for recognition items, 60 s for calculation items |
| **Curriculum** | Aligned to KSSR Semakan 2017 DSKP codes (7.1.1–7.1.4, 7.2.1–7.2.3, 7.3.1): comparing, ordering, equivalent fractions, addition/subtraction (incl. mixed numbers, whole numbers and three-number operations), fraction of a quantity, RME word problems and KBAT items with rising difficulty |
| **Question engine** | Unlimited random generation, misconception-based distractors, no duplicate options, explanations, hints, learning objectives per item |
| **Visual models** | SVG fraction bars, circles and number lines — responsive and colour-blind safe (hatching, not colour alone) |
| **Gamification** | XP economy, 5 badges, daily missions, streak bonuses, level progression |
| **Teacher dashboard** | Class overview, per-student drill-down, weak-skill analysis, error-pattern analytics, mastery matrix, growth trend, question performance |
| **Exports** | CSV (opens in Excel), anonymised research dataset, printable class/individual reports (print → PDF) |
| **Languages** | 简体中文 (default) · English · Bahasa Melayu — instant switching |
| **Accessibility** | Text-to-speech question reading, large touch targets, full keyboard play (1–4, Enter), colour-blind friendly feedback (icons + colour), responsive from phone to desktop |
| **Research logging** | Every attempt records response time, hint usage, Polya-scaffold views, misconception classification and streak state — see [docs/RESEARCH_DATA.md](docs/RESEARCH_DATA.md) |

## 🛠 Technology

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion animations
- Local-first storage (localStorage) with optional Firebase/Firestore cloud sync
- Deployable to Vercel in one click

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Quality checks:

```bash
npm run typecheck            # TypeScript
npx tsx scripts/gen-test.ts  # fuzz-test the question generator (9000 items)
```

## ☁️ Optional Firebase cloud sync

The game is **local-first** and fully functional offline. To aggregate data across devices (e.g. a whole class syncing to one Firestore project):

1. Create a Firebase project, enable **Firestore** and **Anonymous Authentication**.
2. Copy `.env.example` to `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values.
3. Restart the dev server. Profiles, attempts and matches are now mirrored to Firestore.

Collection design and security rules: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).

## 🌐 Deploying to Vercel

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected, no configuration needed.
3. (Optional) Add the `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel project settings.

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📚 Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture, module map, data flow
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — local + Firestore schema, security rules
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — installation & deployment guide
- [docs/TEACHER_GUIDE.md](docs/TEACHER_GUIDE.md) — classroom usage and dashboard guide
- [docs/RESEARCH_DATA.md](docs/RESEARCH_DATA.md) — research dataset codebook for learning-analytics studies

## 📁 Project structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # main menu
│   ├── play/             # practice / challenge / tournament / multiplayer
│   ├── profile/          # student dashboard
│   └── teacher/          # teacher dashboard + reports
├── components/
│   ├── game/             # tug-of-war scene, question card, results, screens
│   ├── fractions/        # SVG fraction visualisations
│   ├── dashboard/        # chart components
│   ├── profile/          # profile creation/selection
│   └── ui/               # buttons, cards, language switcher
└── lib/
    ├── question-generator/  # KSSR-aligned item generation + RME templates
    ├── game-engine/         # match state machine, tournament ladder, recorder
    ├── gamification/        # XP, badges, daily missions
    ├── analytics/           # aggregations + CSV/report exports
    ├── i18n/                # zh / en / ms dictionaries + provider
    ├── storage/             # local-first persistence
    ├── firebase/            # optional Firestore sync
    ├── audio/               # text-to-speech + WebAudio SFX
    └── math/                # exact fraction arithmetic
```
