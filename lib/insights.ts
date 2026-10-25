import { money } from './format';

// The short "something to know" cards shown between onboarding questions (wording in config/app.config.json).

export type Insight = { title: string; text: string };
type Option = { label: string; insight?: Insight };

// Cards for the first one or two things someone tapped, in the order they tapped them (the first is usually what
// matters most to them). Two choices that share a card show it once. Nothing with a card picked: the fallback.
export function pickInsights(options: Option[], chosen: string[], fallback: Insight, max = 2): Insight[] {
  const out: Insight[] = [];
  for (const label of chosen) {
    const insight = options.find((o) => o.label === label)?.insight;
    if (insight && !out.some((i) => i.title === insight.title)) out.push(insight);
    if (out.length === max) break;
  }
  return out.length ? out : [fallback];
}

type MoneyText = { title: string; withSpend: string; withGoal: string; noSpend: string };

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '');

// "At about $150 a week, six weeks adds up to around $900 ... That would get you to Bali ($3,000) in about 20 weeks."
export function moneyInsight(text: MoneyText, weeklySpend: number | null, savingTarget: number | null, savingFor: string): Insight {
  if (!weeklySpend) return { title: text.title, text: text.noSpend };
  let body = fill(text.withSpend, { weekly: money(weeklySpend), sixWeeks: money(weeklySpend * 6) });
  if (savingTarget) {
    const weeks = Math.max(1, Math.ceil(savingTarget / weeklySpend));
    body += ' ' + fill(text.withGoal, { savingFor: savingFor.trim() || 'your goal', target: money(savingTarget), weeks: String(weeks) });
  }
  return { title: text.title, text: body };
}
