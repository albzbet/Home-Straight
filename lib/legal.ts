import { config } from './config';

// PLACEHOLDER legal text. Replace with the lawyer-reviewed versions before launch.

const days = config.payments.refundDays;
const email = config.support.email;

// The refund policy (owner's choice, Oct 2026): a full refund for any reason within 60 days, by email. No in-app button.
export const refundSummary = `${config.payments.refundHeadline} Email ${email} within ${days} days of buying and we'll sort it out. You keep access to the program either way.`;

export const refundPolicy = `PLACEHOLDER. This is not the final refund policy.

${config.payments.refundHeadline}

If the program isn't right for you, email us at ${email} within ${days} days of buying it. You don't need to give a reason.

So we can find your purchase, include the order number from the receipt Google or Apple emailed you (on Android it starts with "GPA."). That's all we need. Please don't send card or bank details.

If you bought on Android: we refund it through Google Play, usually within a few days. The money goes back the way you paid.

If you bought on an iPhone: Apple handles all App Store payments, so Apple makes the refund. We'll reply with a link to Apple's refund page and back your request. Apple usually agrees, but the final decision is theirs.

Either way, you keep access to everything you unlocked. We'd rather you kept going.

This policy is on top of your rights under the Australian Consumer Law, not instead of them.`;

export const privacyPolicy = `PLACEHOLDER. This is not the real privacy policy.

What we collect: a nickname, how you sign in (Apple, Google or email), your answers in the program (goals, check-ins, plans and questionnaire answers), whether you've ticked that you signed up to BetStop (we never contact BetStop or see your registration), and, only if you add one, your buddy's email address.

How we protect it: everything is treated as sensitive health information. Only you can see your answers. The things you write in your own words are encrypted in our database.

What we never do: sell or share your data, show gambling ads, or share anything with gambling companies.

Free access requests: if you ask for free access, our small admin team sees your nickname and the message you wrote, and nothing else.

Deleting it: Settings > Delete my data removes your account and everything in it.

Counting: to see whether the program is helping people, we look at totals only (for example, how many people finished Week 1, or the average check-in across everyone). Averages are only shown when at least 5 people are behind them. We also keep simple daily tallies, with nothing about who did them, of how often Urge SOS is opened and how many people try Day 1 before making an account. No advertising or third-party tracking tools are used.

Where it's kept: Supabase (our database provider).

Questions: ${email}.`;

export const termsOfUse = `PLACEHOLDER. These are not the real terms of use.

homestr8 is a self-help and wellbeing program. It is not a medical treatment and does not diagnose, treat or cure any condition. It is not a substitute for professional care.

If you need help now, call Gambling Help Online on 1800 858 858 (free, 24/7), Lifeline on 13 11 14, or 000 in an emergency.

You must be 18 or older to use homestr8.

Paying: Week ${config.payments.freeWeeks} is free. Weeks 2 to 8 are a one-off purchase through the App Store or Google Play. ${refundSummary} See the refund policy for details.`;
