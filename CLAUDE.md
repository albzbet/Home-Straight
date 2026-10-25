# Homestraight: notes for Claude

Working name. An Australian app helping adults take control of their gambling: a 6-week, CBT-based morning program
(42 sessions of about 10 minutes, a 5-minute "busy day" version), Urge SOS and ongoing support tools. The owner is a beginner
developer: explain plans first, build step by step, and after each step say what was built, how to test it on a phone, and
what's next. Plain English, click-by-click steps.

## Rules that never bend

- A self-help and wellbeing program, NOT a medical treatment. Never claim to diagnose, treat or cure, never promise outcomes.
  Questionnaire scores are never shown as a severity label.
- Complements Gambling Help Online (1800 858 858, 24/7), never replaces it. Lifeline 13 11 14, 000 for emergencies.
- Warm, non-judgemental, plain-spoken Australian tone. No shaming, no guilt-tripping, never "fall behind".
- No betting imagery, odds, racing language, slot-style rewards, random prizes, loot boxes or leaderboards.
- No gambling ads, affiliate links or bookmaker partnerships. Never share or sell data; never share anything with gambling operators.
- Treat all member data as sensitive health information. Collect the minimum. Nickname only, never real names. 18+ only.
  Free text members write is encrypted in the database (`private.enc` / `private.dec`, key in Vault).
- Notification wording and the app icon must never mention gambling.
- Keep this repo separate from the owner's other apps (some are poker apps). Never copy code that mentions poker or betting.

## Stack

- Expo SDK 58 (React Native 0.88, React 19.3), expo-router (`app/`), TypeScript. Expo changes every SDK: check the
  versioned docs (docs.expo.dev/versions/v58.0.0/) before using an Expo API. The Expo API is blocked from cloud sessions,
  so install with `EXPO_OFFLINE=1 npx expo install <pkg>` (picks the SDK's versions).
- Supabase (separate project from any other app): Postgres, RLS on with no policies; the app only calls `hs_*`
  security-definer functions that touch the caller's own rows.

## Where things are

- `content/program.json` all 42 lessons (weeks, titles, video/audio URLs and scripts, actions, teasers, `reviewStatus`).
  Editable by a psychologist. Step 11 moves it into a database table with an admin editor.
- `config/app.config.json` helplines, disclaimer, onboarding choices, questionnaire (PGSI-style placeholder), moods.
- `lib/store.tsx` member's data: on the phone for guests ("try first", Day 1 only), in Supabase once signed in; the phone
  copy is moved across by `hs_import_guest` and wiped. `lib/program.ts` which session is next (one a day, missed ones wait).
- `lib/auth.tsx` Apple / Google (browser sheet) and email link or 6-digit code. Without `.env` the app runs guest-only.
- `app/index.tsx` sends people to welcome → onboarding → Day 1 → nickname → home.
- `supabase/migrations/` numbered SQL, run by hand in the SQL Editor in order. Never edit one that has been run; add the next
  number using `create or replace` / `if not exists`.

## Commands

- Before committing: `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm run format:check`, `npm test`
  (GitHub runs the same on every push). Tests (Vitest) in `lib/__tests__/` cover the pure logic.

## Progress (owner's build order)

- Step 1, setup, accounts, try-first Day 1, onboarding: done. Onboarding teaches as it goes ("something to know" cards
  matched to answers, `lib/insights.ts`). Migration 0001 written, not yet run by the owner (it is kept re-runnable; until the
  owner runs it, new tables and columns are added to it with `if not exists`).
- Step 2, safety: done. `GetHelpButton` on every `Screen`, `/help`, crisis words in `config/safety.json` checked on the phone
  (`lib/safety.ts`, `useCrisisGate` in `components/Help.tsx`) before moving on from any screen with free text. Nothing stored.
- Step 3, program engine: done. `app/session/[day].tsx` (full, busy day, bounce-back step after a reported slip, `?review=1`
  to listen again without saving), `app/program.tsx` (all 6 weeks), `dayStatus` in `lib/program.ts`.
- Step 4, Urge SOS: done. `SosButton` on every `Screen`, `app/sos.tsx` (timer and breathing from `config.sos`, why and money
  goal, message buddy via the share sheet, call or chat Gambling Help Online, log afterwards in `urge_logs`).
- Step 5, home: done. `Journey` path, gamble-free days in total and in a row, money kept towards the goal (`lib/progress.ts`:
  a check-in "yes" marks the day before; Urge SOS "I gambled" marks that day; a slip never resets the total).
- Step 6, reminders and pausing: done. Local notifications only (`lib/reminders.ts`, plan in `lib/reminderPlan.ts`, wording in
  `config.reminders`): next mornings, then one "Welcome back" after 2 quiet days, nothing while paused. Pause in Settings.
- Step 7, summaries and plan: done. `app/week/[n].tsx` after every 7th session, `app/finish.tsx` (end questionnaire,
  before/after as counts only), `app/plan.tsx` and `lib/planPdf.ts` (expo-print, share sheet). Logic in `lib/summary.ts`.
- Step 10, maintenance mode: done. After Day 42 and the end questionnaire, Home becomes a toolkit: daily check-in
  (`app/checkin.tsx`, `daily_checkins`), meditation of the day and library (`content/meditations.json`), game plan, repeat a
  week (`/session/N?repeat=1`, saves a daily check-in) or start again (`hs_restart_program` keeps check-ins).
  Check-in and bounce-back questions are shared (`components/Checkin.tsx`).
- Still to build: 11 admin content editor and analytics dashboard, then 8 buddy emails (double opt-in) and 9 payments
  (RevenueCat), hardship access, refund policy (the owner chose 10 and 11 first).

Before launch (owner): lawyer for privacy policy and terms (Privacy Act, health information; TGA wording), licence check for
PGSI questions, psychologist review of content, possibly a neutral name (the "home straight" is racing language).
