# Installation & Deployment Guide

## Requirements

- Node.js ≥ 18.18 (Node 20/22 recommended)
- npm ≥ 9 (pnpm/yarn also work)

## Local installation

```bash
git clone <repository-url>
cd fraction-game
npm install
npm run dev
```

Open http://localhost:3000. The game is fully functional immediately — no database setup is required (data persists in the browser's localStorage).

### Verification

```bash
npm run typecheck            # strict TypeScript check
npm run build                # production build
npx tsx scripts/gen-test.ts  # question-generator fuzz test (9 000 items)
```

## Production build (self-hosted)

```bash
npm run build
npm start            # serves on port 3000
```

Any Node host (school server, Raspberry Pi in a classroom, Docker) works:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Deploying to Vercel (recommended)

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Go to https://vercel.com/new and import the repository.
3. Framework preset **Next.js** is auto-detected — accept the defaults and click **Deploy**.
4. Your game is live at `https://<project>.vercel.app` with HTTPS and a global CDN.

Every push to the default branch redeploys automatically; pull requests get preview URLs.

## Enabling Firebase cloud sync (optional)

1. Create a project at https://console.firebase.google.com.
2. **Build → Firestore Database → Create database** (production mode).
3. **Build → Authentication → Sign-in method → Anonymous → Enable.**
4. **Project settings → Your apps → Web app** — register an app and copy the config.
5. Set the environment variables (locally in `.env.local`, on Vercel under *Settings → Environment Variables*):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

6. Apply the security rules from [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).
7. Redeploy. Profiles, attempts and matches now mirror to Firestore.

## Classroom rollout checklist

- [ ] Deploy to Vercel (or the school server) and bookmark the URL on pupil devices.
- [ ] Open the URL once on each device while online (assets are then cached by the browser).
- [ ] Pupils create their player profile (name + class) on first launch.
- [ ] Teacher opens **/teacher** on each device to review progress, or enables Firebase sync to aggregate centrally.
- [ ] Use **Teacher Dashboard → Export** for CSV/Excel data and print-to-PDF reports.
