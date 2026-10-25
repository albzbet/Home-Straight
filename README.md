# Homestraight (working name)

A 6-week, CBT-based morning self-help program for Australian adults who want to quit, cut back or take a break from gambling.
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
4. **Authentication → URL Configuration → Redirect URLs**, add `exp://**` (for Expo Go) and `homestraight://**`
   (for the real app later).
5. Optional but handy: **Authentication → Emails → Magic Link**, add `Your code: {{ .Token }}` to the email, so people can type
   a 6-digit code if tapping the link doesn't open the app.
6. Apple and Google sign-in need their own setup (Authentication → Providers). We'll do that when we make a test build.

## For developers

- `app/` screens (expo-router), `components/` shared pieces, `lib/` logic, `content/program.json` all 42 lessons,
  `config/app.config.json` helplines, onboarding choices and questionnaire, `supabase/migrations/` database.
- Before committing: `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm run format:check`, `npm test`.
