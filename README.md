# homestr8

An 8-week, CBT-based morning self-help program for Australian adults who want to quit, cut back or take a break from gambling.
It is a wellbeing program, not a medical treatment, and it works alongside Gambling Help Online (1800 858 858).

## Try it on your phone (no accounts needed)

1. Install **Expo Go** from the Play Store or App Store.
2. On a computer with [Node.js](https://nodejs.org) (the "LTS" version) installed, open a terminal and run:
   ```
   git clone https://github.com/albzbet/Home-Straight.git
   cd Home-Straight
   npm install
   npx expo start
   ```
3. A QR code appears. Android: open Expo Go and tap **Scan QR code**. iPhone: point the Camera app at it.
   (Phone and computer on the same Wi-Fi. If it won't connect, stop it with Ctrl+C and run `npx expo start --tunnel`.)

Without Supabase set up, the app runs in "try first" mode: onboarding and Day 1 work, saved on the phone only.

## Switch on accounts (Supabase)

1. Make a **new** project at [supabase.com](https://supabase.com) (keep it separate from any other app). Region: Sydney.
2. **SQL Editor → New snippet**, paste everything from `supabase/migrations/0001_start.sql`, click **Run**. Run the files in
   number order; each one is safe to run twice.
3. **Project Settings → API**: copy the Project URL and the anon / publishable key. In the project folder, copy `.env.example`
   to `.env` and paste them in. Restart `npx expo start`.
4. **Authentication → URL Configuration → Redirect URLs**, add `exp://**` (for Expo Go) and `homestr8://**`
   (for the real app later).
5. Optional but handy: **Authentication → Emails → Magic Link**, add `Your code: {{ .Token }}` to the email, so people can type
   a 6-digit code if tapping the link doesn't open the app.
6. Apple and Google sign-in need their own setup (Authentication → Providers). We'll do that when we make a test build.

## Admin area (editing lessons, the dashboard)

1. In Supabase, **SQL Editor → New snippet**: run `supabase/migrations/0002_admin.sql`, then `0003_hardship.sql` (after 0001,
   always in number order).
2. Sign in to the app once with the account you want to use as admin.
3. Run this in the SQL Editor, with that account's email:
   ```
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com' on conflict do nothing;
   ```
4. In the app: **Settings → Admin**. On a computer it's easier: run `npx expo start --web`, open the address it shows, sign in,
   then Settings → Admin. From there you can edit every lesson, upload videos and audio (Supabase's free plan takes files up to
   50 MB each), edit the meditations, the week themes and the crisis words, and see the dashboard.

Changes reach everyone the next time they open the app. Anything not edited comes from the copy built into the app
(`content/` and `config/`).

## Keeping it private

- **App lock** (Settings → App lock): Face ID / fingerprint, or a 4-digit PIN just for this app. Works in Expo Go.
- **App icon** (Settings → App icon): three plain icons. Switching needs the installed app (a test build), not Expo Go.
- Notifications never mention gambling.

## For developers

- `app/` screens (expo-router), `components/` shared pieces, `lib/` logic, `content/program.json` all 56 lessons,
  `config/app.config.json` helplines, onboarding choices and questionnaire, `supabase/migrations/` database.
- Before committing: `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm run format:check`, `npm test`.
