# Database Schema

The app uses a **local-first** model: localStorage is the source of truth on each device; Firestore (optional) mirrors the same records for cross-device aggregation. Both layers share the TypeScript models in `src/lib/storage/models.ts`.

## Local storage keys

| Key | Type | Contents |
| --- | --- | --- |
| `ftw:locale` | string | UI language (`zh` / `en` / `ms`) |
| `ftw:profiles` | `StudentProfile[]` | All profiles on this device |
| `ftw:active` | string | Active profile id |
| `ftw:attempts:<profileId>` | `AttemptRecord[]` | Question attempts (capped at 5 000 most recent) |
| `ftw:matches:<profileId>` | `MatchRecord[]` | Completed matches |
| `ftw:missions:<profileId>:<YYYY-MM-DD>` | `MissionProgress` | Daily mission counters + claimed rewards |

## Entities

### StudentProfile

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Random uid |
| `name` | string | Pupil name |
| `className` | string | e.g. "5 Bestari" |
| `classCode` | string? | Teacher's class code (uppercased), entered by the pupil at profile creation. Links the pupil to a teacher's cloud dashboard. Denormalised onto every mirrored attempt/match document so a class loads with one equality query. |
| `avatar` | string | Emoji avatar |
| `createdAt` / `lastActiveAt` | number | Epoch ms |
| `xp` | number | Lifetime XP (level is derived — `levelFromXp`) |
| `badges` | string[] | Earned badge ids (`beginner`…`champion`) |
| `matchesPlayed` / `matchesWon` | number | Lifetime counters |
| `totalTimeMs` | number | Active learning time |
| `tournamentRound` | number | Highest unlocked round (0–5; 5 = champion) |

### AttemptRecord — *the research unit*

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `profileId`, `timestamp` | — | Identity + ordering |
| `mode` | enum | practice / challenge / tournament / multiplayer |
| `topic` | enum | compare / ordering / equivalent / addition / subtraction / mixedNumbers / fractionOfQuantity / wordProblem |
| `level`, `difficulty` | number | Curriculum level 1–7, item difficulty 1–3 |
| `promptKey` | string | Identifies the item template |
| `correct` | boolean | — |
| `selectedText` / `correctText` | string | Chosen vs expected answer ("" when timed out) |
| `errorTag` | enum? | Misconception classification (e.g. `added-denominators`) or `timeout` |
| `responseTimeMs` | number | Time from question display to answer |
| `hintUsed` | boolean | Pupil opened the hint scaffold |
| `polyaViewed` | boolean | Pupil opened the Polya problem-solving steps |
| `streakAfter` | number | Consecutive-correct streak after this attempt |

### MatchRecord

`id, profileId, timestamp, mode, level?, result (win/lose/draw), playerScore, opponentScore, questionsAnswered, correctCount, durationMs, xpEarned, bestStreak, tournamentRound?`

### MissionProgress

`date, counters { answered, wins, bestMatchAccuracy, bestStreak, practiceAnswered }, claimed[]`

## Firestore mirror (optional)

Top-level collections, one document per record (document id = record id):

```
profiles/{profileId}    ← StudentProfile + syncedAt
attempts/{attemptId}    ← AttemptRecord + syncedAt
matches/{matchId}       ← MatchRecord + syncedAt
```

Writes use `setDoc(..., { merge: true })` and are fire-and-forget; the device never blocks on the network. Devices authenticate via **Anonymous Authentication**.

### Teacher ↔ student linking (class codes)

The teacher invents a class code (e.g. `5B-TAN`) and pupils type it once when creating their player. Every mirrored document then carries `classCode`, and the teacher dashboard loads the class with single-field equality queries (no composite indexes needed):

```
profiles  where classCode == "5B-TAN"
attempts  where classCode == "5B-TAN"
matches   where classCode == "5B-TAN"
```

### Suggested security rules

Two postures, depending on how sensitive you consider the data (pupil first names + scores):

**Simple classroom posture** — anyone signed in (incl. anonymous devices) can read; the class code acts as a capability. Easy to operate, adequate for low-stakes classroom data:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{doc} {
      allow create, update: if request.auth != null
        && collection in ['profiles', 'attempts', 'matches'];
      allow read: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

**Strict research posture** — reads only for teacher/researcher accounts carrying a custom claim (mint with the Firebase Admin SDK). With this posture the in-app class-code loader requires teachers to sign in with one of these accounts:

```js
allow read: if request.auth != null && request.auth.token.teacher == true;
```

For research deployments, export collections with the Firebase CLI (`firestore:export`) or the BigQuery integration for analysis at scale.
