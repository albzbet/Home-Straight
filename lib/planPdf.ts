import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { GamePlan } from './summary';

// The personal game plan as a simple, printable page. Saved as a PDF and handed to the phone's share sheet
// (save to Files, email it to yourself, print). Plain on purpose: no logos, nothing that says gambling on the outside.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const section = (title: string, items: string[]) =>
  items.length ? `<h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

export function planHtml(plan: GamePlan, notes: string, name: string | null): string {
  return `<html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #17191A; padding: 32px; line-height: 1.5; }
    h1 { font-size: 26px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 22px 0 6px; color: #9C5B39; }
    ul { margin: 0; padding-left: 20px; } p.small { color: #4C4945; font-size: 12px; margin-top: 32px; }
  </style></head><body>
    <h1>${name ? `${esc(name)}'s plan` : 'My plan'}</h1>
    ${section('Why I’m doing this', plan.why)}
    ${section('My risky times', plan.triggers)}
    ${section('My if-then plans', plan.ifThen)}
    ${section('What helps when an urge hits', plan.whatHelps)}
    ${section('Things that work for me', plan.myActions)}
    ${section('If I slip, I’ll', plan.ifISlip)}
    ${notes.trim() ? section('My notes', notes.split('\n')) : ''}
    ${section('People I can talk to', plan.support)}
    <p class="small">This plan supports self-help and is not a substitute for professional care. In an emergency call 000.</p>
  </body></html>`;
}

export async function sharePlanPdf(html: string) {
  if (Platform.OS === 'web') return Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Save your plan' });
}
