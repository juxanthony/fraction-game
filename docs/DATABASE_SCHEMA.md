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

### Suggested security rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pupils' devices (anonymous auth) may create/update records.
    // Reads are restricted to teacher/researcher accounts via custom claims.
    match /{collection}/{doc} {
      allow create, update: if request.auth != null
        && collection in ['profiles', 'attempts', 'matches'];
      allow read: if request.auth != null
        && request.auth.token.teacher == true;
      allow delete: if false;
    }
  }
}
```

For research deployments, mint teacher/researcher accounts with the `teacher` custom claim via the Firebase Admin SDK, and export collections with the Firebase CLI (`firestore:export`) or BigQuery integration for analysis at scale.
