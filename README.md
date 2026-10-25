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

## Installing a test version on your phone (EAS build)

Some things only work in the real installed app, not Expo Go: Apple and Google sign-in, switching the app icon, and
payments later. Expo's build service (EAS) makes the installable app in the cloud. Free plan is fine.

1. Make a free account at [expo.dev](https://expo.dev).
2. In a terminal in the project folder:
   ```
   npx eas-cli login
   npx eas-cli init
   ```
   `init` adds your project's ID to `app.json`. Commit that change (or ask me to).
3. Give the build your Supabase address and public key (the same two as in `.env`; the build can't see `.env`):
   ```
   npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROJECT-REF.supabase.co --environment preview --environment production --visibility plaintext
   npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key --environment preview --environment production --visibility plaintext
   ```
4. **Android:** `npx eas-cli build --platform android --profile preview`. It takes about 15 minutes, then shows a link and
   QR code. Open it on your phone, download the app and install it (Android will ask you to allow installing from your browser).
5. **iPhone** (needs the Apple Developer account): `npx eas-cli device:create` to register your phone, then
   `npx eas-cli build --platform ios --profile preview`.
6. In Supabase → Authentication → URL Configuration → Redirect URLs, make sure `homestr8://**` is there (sign-in links open
   the installed app).

For the stores later: `npx eas-cli build --profile production`, then `npx eas-cli submit`.

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

## Buddy emails (switch on when you're ready)

Everything is built; it just needs an email service and somewhere to host the buddy's "Yes, I'm in" page.

1. **Database:** run `supabase/migrations/0004_buddy.sql` in the SQL Editor (after 0003).
2. **Resend** ([resend.com](https://resend.com), free): sign up, add your domain under **Domains** and add the DNS records it
   shows at your domain provider, then **API Keys → Create API key**. Keep the key to yourself (don't paste it in a chat).
3. **Web version on Netlify** (free): **Add new site → Import from GitHub** → this repo. It reads `netlify.toml` by itself.
   Under **Site configuration → Environment variables** add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   (same as `.env`), then **Deploys → Trigger deploy**. Note the site address, e.g. `https://homestr8.netlify.app`.
4. **Send-the-emails function**, in a terminal in the project folder:
   ```
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase secrets set RESEND_API_KEY=your-key EMAIL_FROM="homestr8 <hello@yourdomain.com.au>" BUDDY_PAGE_URL=https://homestr8.netlify.app/buddy
   npx supabase functions deploy buddy --no-verify-jwt
   ```
   (Your project ref is in Supabase → Project Settings → General.)
5. **Schedule:** open `supabase/buddy-schedule.sql`, replace `YOUR-PROJECT-REF` (twice), and run it in the SQL Editor.
6. **Test:** in the app, Settings → Your buddy → add a second email address of your own. The invitation arrives within
   15 minutes; tap "Yes, I'm in". Weekly notes go out on Monday mornings.

## Keeping it private

- **App lock** (Settings → App lock): Face ID / fingerprint, or a 4-digit PIN just for this app. Works in Expo Go.
- **App icon** (Settings → App icon): three plain icons. Switching needs the installed app (a test build), not Expo Go.
- Notifications never mention gambling.

## For developers

- `app/` screens (expo-router), `components/` shared pieces, `lib/` logic, `content/program.json` all 56 lessons,
  `config/app.config.json` helplines, onboarding choices and questionnaire, `supabase/migrations/` database.
- Before committing: `npm run typecheck`, `npm run lint -- --max-warnings 0`, `npm run format:check`, `npm test`.
