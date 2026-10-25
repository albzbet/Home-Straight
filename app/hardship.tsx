import { router } from 'expo-router';
import { useState } from 'react';
import { useCrisisGate } from '@/components/Help';
import { Button, Card, Field, Loading, Screen, Txt } from '@/components/ui';
import { useAccess } from '@/lib/access';
import { config } from '@/lib/config';
import { useStore } from '@/lib/store';

// "Can't afford it?": ask for free access to the whole program. A person reads every request; no proof needed.
export default function Hardship() {
  const { signedIn } = useStore();
  const { access, requestHardship } = useAccess();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { check, sheet } = useCrisisGate();
  const weeks = `Weeks ${config.payments.freeWeeks + 1} to 8`;

  if (!signedIn)
    return (
      <Screen>
        <Txt variant="title">Free access</Txt>
        <Txt variant="muted">Make a free account first (just a nickname), then you can ask for free access here.</Txt>
        <Button label="Save my progress" onPress={() => router.push('/save-progress')} />
      </Screen>
    );
  if (!access) return <Loading />;

  const status = access.freeAccess ? 'approved' : access.hardship?.status;
  if (status === 'approved')
    return (
      <Screen>
        <Txt variant="title">You've got free access</Txt>
        <Txt variant="muted">The whole program is yours. Look after yourself.</Txt>
      </Screen>
    );
  if (status === 'pending')
    return (
      <Screen>
        <Txt variant="title">Thanks, we've got your request</Txt>
        <Txt variant="muted">A real person will read it, usually within a couple of days. Check back here to see the answer.</Txt>
      </Screen>
    );

  return (
    <Screen
      footer={
        <>
          {problem ? <Txt variant="small">{problem}</Txt> : null}
          <Button
            label="Send my request"
            loading={sending}
            onPress={() =>
              check([note], async () => {
                setSending(true);
                setProblem(null);
                try {
                  await requestHardship(note.trim());
                } catch {
                  setProblem("That didn't send. Check your internet connection and try again.");
                } finally {
                  setSending(false);
                }
              })
            }
          />
        </>
      }
    >
      {sheet}
      <Txt variant="title">Money tight right now?</Txt>
      <Txt variant="muted">
        Nobody should miss out on help because of money. You can ask for {weeks} for free. A real person reads every request, and you don't
        need to prove anything.
      </Txt>
      {status === 'declined' ? (
        <Card>
          <Txt>Your last request wasn't approved this time. You're welcome to ask again if things have changed.</Txt>
        </Card>
      ) : null}
      <Field
        label="Anything you'd like us to know? (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={1000}
        placeholder="A sentence or two is plenty"
      />
      <Txt variant="small">Only our small admin team sees your nickname and this message. Please don't include your real name.</Txt>
    </Screen>
  );
}
