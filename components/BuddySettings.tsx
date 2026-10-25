import { useEffect, useState } from 'react';
import { Button, Card, Choice, Field, Txt } from '@/components/ui';
import { looksLikeEmail } from '@/lib/format';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Settings > Your buddy: who gets the weekly note, whether they've said yes, and changing or stopping it.
type Status = 'none' | 'waiting' | 'invited' | 'confirmed' | 'stopped';

const statusText: Record<Status, string> = {
  none: '',
  waiting: "We'll email them soon to ask if they'd like to be your buddy.",
  invited: "We've emailed them. Nothing more is sent until they say yes.",
  confirmed: 'They said yes. They get a short note each Monday: sessions done and a nudge to encourage you. Nothing else.',
  stopped: 'They chose to stop the emails. You can add someone else if you like.',
};

export function BuddySettings() {
  const { state, signedIn, saveOnboarding } = useStore();
  const o = state.onboarding;
  const [status, setStatus] = useState<Status | null>(null);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(o?.buddyEmail ?? '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn || !supabase) return;
    let live = true;
    supabase.rpc('hs_my_buddy').then(({ data }) => live && setStatus((data as { status: Status } | null)?.status ?? 'none'));
    return () => {
      live = false;
    };
  }, [signedIn, o?.buddyEmail, o?.buddyConsent]);

  if (!o) return null;
  const save = async (buddyEmail: string, buddyConsent: boolean) => {
    setBusy(true);
    setProblem(null);
    try {
      await saveOnboarding({ ...o, buddyEmail, buddyConsent });
      setEditing(false);
    } catch {
      setProblem("That didn't save. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Txt variant="label">Your buddy</Txt>
      {editing ? (
        <>
          <Field
            label="Their email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Choice
            label="I'm happy for them to get a weekly summary"
            detail="Sessions done and an encouraging note. Nothing else."
            selected={consent}
            onPress={() => setConsent((c) => !c)}
          />
          <Button label="Save" disabled={!looksLikeEmail(email) || !consent} loading={busy} onPress={() => save(email.trim(), true)} />
          <Button label="Cancel" kind="ghost" onPress={() => setEditing(false)} />
        </>
      ) : o.buddyConsent && o.buddyEmail ? (
        <>
          <Txt>{o.buddyEmail}</Txt>
          <Txt variant="muted">
            {signedIn ? statusText[status ?? 'waiting'] : 'Emails start once you save your progress with a free account.'}
          </Txt>
          <Button label="Change buddy" kind="secondary" onPress={() => (setEmail(''), setConsent(false), setEditing(true))} />
          <Button label="Stop the weekly email" kind="ghost" loading={busy} onPress={() => save('', false)} />
        </>
      ) : (
        <>
          <Txt variant="muted">
            A mate or partner can get a short weekly email saying how many sessions you've done. Never anything about gambling or money.
            They're asked to agree first.
          </Txt>
          <Button label="Add a buddy" kind="secondary" onPress={() => (setEmail(''), setConsent(false), setEditing(true))} />
        </>
      )}
      {problem ? <Txt variant="small">{problem}</Txt> : null}
    </Card>
  );
}
