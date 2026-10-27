import { useState } from 'react';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { sharePlanPdf, planHtml } from '@/lib/planPdf';
import { useStore } from '@/lib/store';
import { gamePlan } from '@/lib/summary';

// Your personal game plan, put together from everything you've told the program, with room for your own notes.
export default function Plan() {
  const { state, savePlanNotes } = useStore();
  const plan = gamePlan(state);
  const [notes, setNotes] = useState(state.planNotes ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();

  const save = () =>
    check([notes], async () => {
      setBusy('save');
      setProblem(null);
      try {
        await savePlanNotes(notes.trim());
      } catch {
        setProblem("That didn't save. Check your internet connection and try again.");
      } finally {
        setBusy(null);
      }
    });

  const exportPdf = () =>
    check([notes], async () => {
      setBusy('pdf');
      setProblem(null);
      try {
        await sharePlanPdf(planHtml(plan, notes, state.nickname));
      } catch {
        setProblem("Couldn't make the PDF. Try again in a moment.");
      } finally {
        setBusy(null);
      }
    });

  const list = (title: string, items: string[], empty: string) => (
    <Card>
      <Txt variant="label">{title}</Txt>
      {items.length ? items.map((i) => <Txt key={i}>• {i}</Txt>) : <Txt variant="muted">{empty}</Txt>}
    </Card>
  );

  return (
    <Screen>
      {sheet}
      <Txt variant="title">Your game plan</Txt>
      <Txt variant="muted">
        Built from what you've told us over the program. Add anything else that matters to you, then save it as a PDF.
      </Txt>
      {list('Why I’m doing this', plan.why, 'Add your why in your notes below.')}
      {list('My risky times', plan.triggers, 'None noted yet.')}
      {list('My loop', plan.loop, 'Map it in More > Your loop.')}
      {list('My if-then plans', plan.ifThen, 'Make one in More > If-then plans.')}
      {list('What helps when an urge hits', plan.whatHelps, 'Use Urge SOS and log what helps. It will show up here.')}
      {list('Things that work for me', plan.myActions, 'Your daily actions will show up here.')}
      {list('If I slip, I’ll', plan.ifISlip, 'Write your bounce-back plan in your notes below.')}
      {list('People I can talk to', plan.support, '')}
      <Field
        label="My own notes: warning signs, people to call, what I'll do if I slip"
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={2000}
      />
      {problem ? <Txt variant="small">{problem}</Txt> : null}
      <Button label="Save my notes" kind="secondary" onPress={save} loading={busy === 'save'} />
      <Button label="Save my plan as a PDF" onPress={exportPdf} loading={busy === 'pdf'} />
    </Screen>
  );
}
