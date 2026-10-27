# homestr8: notes for Claude

The app is called **homestr8** (owner's choice, Oct 2026; the repo keeps the old Home-Straight name). An Australian app
helping adults take control of their gambling: an 8-week, CBT-based morning program (56 sessions of about 10 minutes, a 5-minute "busy day" version), Urge SOS and ongoing support tools. The owner is a beginner
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

## Look and feel (owner's redesign, Oct 2026)

- Reference: `design/homestr8-mockup-copper.webp` (owner's colours since 25 Oct 2026; the older `homestr8-mockup.png` has
  the same layouts in orange, which is gone). Dark only. Tokens in `lib/theme.ts` (`colors`, `fonts`, `space`, `radius`,
  `shadow`): charcoal #17191A, burnt copper #C57950 (main buttons, highlights, the "8"), timeless white #FFFFFF (the big
  hero buttons: `Button kind="light"`), progress green #399B7A, cards from stone #4C4945; Bebas Neue for headings (capitals), Inter for everything else (loaded in `app/_layout.tsx`). Never hard-code
  colours or fonts in screens; use `useTheme()` / `fonts`. Old token names (`ink`, `action`...) still map onto the new ones.
- Shared pieces in `components/ui.tsx`: `Screen`, `Txt`, `Button` / `PrimaryButton`, `Card` (`raised`), `ProgressBar`,
  `SectionHeader`, `StatCard`, `Choice`, `Chip`, `Field`.
- Photos come from the owner (`assets/images`, JPG, no text, no gambling imagery); I can't make real photos, so missing
  ones get a plain placeholder, never a drawn fake. The logo is the owner's kelpie: `assets/logo/kelpie.png` (white on
  see-through, made from `kelpie-source.png`), drawn by `Kelpie` in `components/Brand.tsx` in any colour; `Wordmark` is the
  kelpie with HOMESTR in white and the 8 in copper. App icon: charcoal kelpie on copper (`assets/icons/README.md`).
- No "time back" / hours-per-week anywhere (owner's call, Oct 2026): Home's stat cards are the streak with total
  gamble-free days, and money kept.
- Screens redone so far: welcome (`app/welcome.tsx`, owner's layout); Home dashboard (`app/(tabs)/home.tsx`, mockup screen 2)
  with the bottom tabs in `app/(tabs)/` (Home, Program, Progress, Explore, More; `Screen tab` shows `BrandHeader`: name, SOS,
  Get help now).
  Session (`app/session/[day].tsx`, mockup screen 3): lesson page with close / Week • Day / SOS / help, the title in Bebas with
  its tail in copper (`highlightTail`), `VideoCard` and `AudioCard` (`components/SessionMedia.tsx`), busy-day switch,
  "Mark as complete", then check-in, action, done.
  Urge SOS (`app/sos.tsx`, mockup screen 4): big white breathing ring with a countdown (`Breather`), 1/3/5 min
  (`config.sos.durations`, replaced the old 10-minute timer), Breathe / Ground (5-4-3-2-1) / Reframe (`config.sos.reframes`
  plus their why and money goal), "Talk to someone" card (Gambling Help Online call / chat, message buddy), then the log.
  Progress (`app/(tabs)/progress.tsx`, mockup screen 5): This week / This month / Total (`periodStats`, weeks start Monday,
  never before the program), money kept / gamble-free days / sessions, photo card, weekly goals set automatically
  (`weeklyGoals`: 5 sessions, keep a week's usual spend, 7 gamble-free days; reset each Monday).
  Bookie Tricks Exposed (Explore tab `app/(tabs)/explore.tsx`, mockup screen 6): `EpisodeCard` list, then meditations;
  each opens `app/episode/[id].tsx` (video, or its script until a video is uploaded, summary, key points). Episodes are in
  `content/episodes.json` (placeholder text for now), edited live in Admin > Bookie Tricks Exposed (`app/admin/episodes.tsx`,
  content key `episodes`). Thumbnails `photos.tricks` in `lib/images.ts`.
  Daily check-in (`app/checkin.tsx`, mockup screen 7): five mood faces (`MoodPicker` in `components/Checkin.tsx`, best
  first, saved 1-5; colours `moodColors`; labels `config.checkin.moods`) and an optional note (encrypted
  `daily_checkins.note`), then urge and "did you gamble?", bounce-back after a slip. Sessions use the same faces.
  Weekly missions (`app/missions.tsx`, mockup screen 8): this week's mission (photo `photos.mission`, ideas, "I've done it",
  take the tick off again), all missions. One a week in list order from the week the program started (`lib/missions.ts`,
  weeks start Monday); `content/missions.json`, edited in Admin > Weekly missions (content key `missions`). Ticks in
  `mission_done` (`hs_save_mission`, `state.missions`). Nothing to win, no rewards beyond the tick.
  Goal tracking (`app/goal.tsx`, mockup screen 9; from Home's and Progress's money card and More > Your goal): the savings
  goal (`onboarding.savingFor` / `savingTarget`) with money kept towards it (`goalProgress` in `lib/progress.ts`: counts from
  `goalSince`, so a goal with a new name starts from $0; same name keeps counting), weeks to go, change / set the next goal
  (also the usual weekly spend), goal ideas from `config.goals.ideas`. `members.goal_since` in 0001.
  More life (`app/more-life.tsx`, mockup screen 10): photo in the top two thirds (`photos.moreLife`, the welcome photo until its own arrives) with `config.moreLife.lines`, their
  gamble-free days, money kept and why; after every week summary (`?next=home|finish`) and from More > What it's all about.
  All ten mockup screens are now built.
- Stopping completely is recommended (owner, 26 Oct 2026): the onboarding goal "Stop completely" (id `quit`) has a
  Recommended badge (`recommended` in `config.onboarding.goals`, `Choice badge`). BetStop (national self-exclusion register,
  `config.betstop`, facts checked 26 Oct 2026): `BetstopCard` (`components/Betstop.tsx`) straight after picking it in
  onboarding and on Home until they tick "I've signed up" (`onboarding.betstopAt`, `members.betstop_at` in 0001);
  `app/betstop.tsx` (how it works, other barriers: bank block, blocking apps, clear the decks), also from More.
- If-then plans (`app/plans.tsx`, More > If-then plans, a Home card after Day 1 until they have one): "If [risky moment],
  then I'll [something else]" in three steps (their onboarding risky times first, marked Yours; ideas per moment from
  `config.plans`; own words allowed and crisis-checked), optional weekly heads-up (`planNudges` in `lib/plans.ts`, WEEKLY local
  notification, wording `config.reminders.plan`, tapping opens /plans via `useReminderTaps`; none while paused). Shown in Urge
  SOS and the game plan / PDF (`planLine`). Saved encrypted in `if_then_plans` (`hs_save_plan` / `hs_delete_plan`, up to 20).
- Future you (`app/future-you.tsx`, More > Future you and a link on More life): pick 6 months / 1 year / 5 years, picture a good
  day one question at a time (`config.futureYou.prompts`, placeholder wording), then a note from future you. Latest only, in
  `future_you` (encrypted, `hs_save_future_you`, `state.futureYou`). The note shows on More life (instead of their why) and
  in Urge SOS > Reframe.
  Photos are listed in `lib/images.ts` (null = not arrived yet; `Photo` shows a plain dark space). `Tile` for quick access.

## Where things are

- The program is 8 weeks (owner's change, Oct 2026): `TOTAL_WEEKS` / `TOTAL_DAYS` in `lib/program.ts`; never hard-code 8 or 56.
- `content/program.json` all 56 lessons and `content/meditations.json`: the built-in copy. Week 1 (days 1-7) scripts are
  written (`reviewStatus: "draft"`, waiting for a psychologist; review doc https://claude.ai/artifact/EWdURywMVzdbSabf6XKBp6);
  days 8-56 are still placeholders. Paragraph breaks are pauses for the voice artist; no stage directions in the text
  (it shows as-is until a recording exists). Busy-day audio is about 2 minutes. Admins edit live content in the
  admin area (saved in `public.content`), which wins over the built-in copy.
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
  to listen again without saving), `app/program.tsx` (all the weeks), `dayStatus` in `lib/program.ts`.
- Step 4, Urge SOS: done. `SosButton` on every `Screen`, `app/sos.tsx` (timer and breathing from `config.sos`, why and money
  goal, message buddy via the share sheet, call or chat Gambling Help Online, log afterwards in `urge_logs`).
- Step 5, home: done. `Journey` path, gamble-free days in total and in a row, money kept towards the goal (`lib/progress.ts`:
  a check-in "yes" marks the day before; Urge SOS "I gambled" marks that day; a slip never resets the total).
- Step 6, reminders and pausing: done. Local notifications only (`lib/reminders.ts`, plan in `lib/reminderPlan.ts`, wording in
  `config.reminders`): next mornings, then one "Welcome back" after 2 quiet days, nothing while paused. Pause in Settings.
- Step 7, summaries and plan: done. `app/week/[n].tsx` after every 7th session, `app/finish.tsx` (end questionnaire,
  before/after as counts only), `app/plan.tsx` and `lib/planPdf.ts` (expo-print, share sheet). Logic in `lib/summary.ts`.
- Step 10, maintenance mode: done. After Day 56 and the end questionnaire, Home becomes a toolkit: daily check-in
  (`app/checkin.tsx`, `daily_checkins`), meditation of the day and library (`content/meditations.json`), game plan, repeat a
  week (`/session/N?repeat=1`, saves a daily check-in) or start again (`hs_restart_program` keeps check-ins).
  Check-in and bounce-back questions are shared (`components/Checkin.tsx`).
- Step 11, admin: done. Migration 0002 (`admins`, `content`, `media` storage bucket, anonymous `usage_counts`,
  `hs_admin_stats`). Content: built-in JSON overlaid with `public.content` rows (`lib/content.ts`, `useContent()`, cached on the
  phone); crisis words too (`setSafety`). Admin screens in `app/admin/` (`AdminScreen`, `MediaField` uploads), linked from
  Settings for admins. Dashboard shows totals only; averages need 5+ people.
- Privacy extras: done. Optional app lock (`components/AppLock.tsx` `AppLockGate` round the app, `lib/appLock.ts`: Face ID /
  fingerprint with the phone's passcode as fallback, or a 4-digit app PIN stored only as a salted hash in SecureStore;
  relocks after 30 seconds away, covers the screen in the app switcher, Get help now works while locked; forgotten PIN =
  sign out or clear guest data, then unlock). Plain app icons (sources in `assets/icons/`), switchable in Settings via
  `expo-alternate-app-icons` (installed app only; `lib/appIcon.ts` loads it on demand so Expo Go doesn't crash).
  Settings > `PrivacySettings`. App lock works in Expo Go; icon switching needs a test build.
- Refunds (owner's choice): "Not right for you? Full refund, no questions asked", 60 days, by email only (no in-app button);
  `app/refunds.tsx`, `RefundNote`, wording in `lib/legal.ts`, `config.payments` / `config.support`.
- Hardship access: done. Migration 0003 (`hardship_requests`, `members.free_access_at`, `hs_my_access`); `app/hardship.tsx`
  (Settings > Can't afford it?), `app/admin/hardship.tsx`; `lib/access.ts`. Step 9 must treat `freeAccess` as unlocked.
- Buddy emails: built, not switched on. Migration 0004 (`buddies`, trigger keeps it in step with the member's buddy email and
  consent, `hs_buddy_*` functions only for the service role, `hs_cron_key` in Vault). Edge Function `supabase/functions/buddy`
  (Resend; templates in `templates.ts`, tested, never mention gambling or money), schedule `supabase/buddy-schedule.sql`
  (pg_cron + pg_net). Buddies answer on `app/buddy.tsx` in the web version (a button, so link scanners can't say yes),
  hosted on Netlify (`netlify.toml`). Settings > Your buddy (`BuddySettings`).
- Test builds: `eas.json` (preview = internal APK / ad hoc iOS, production = store, app version kept by EAS); Supabase keys
  come from EAS environment variables (README). The owner still has to run `eas init`.
- Still to build: 9 payments (RevenueCat); `freeAccess` (hardship) must count as unlocked.

Before launch (owner): lawyer for privacy policy and terms (Privacy Act, health information; TGA wording), licence check for
PGSI questions, psychologist review of content, the name homestr8 still plays on "home straight" (racing language); the owner has chosen it.
