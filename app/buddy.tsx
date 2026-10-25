import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Screen, Txt } from '@/components/ui';

// The page a buddy lands on from their email (in the web version of the app). A button, not the link itself, says yes or
// stop, so email security scanners that open every link can't answer on their behalf. Nothing here mentions gambling.
export default function BuddyAnswer() {
  const { t, a } = useLocalSearchParams<{ t?: string; a?: string }>();
  const [state, setState] = useState<'ask' | 'sending' | 'done' | 'problem'>('ask');
  const stopping = a === 'stop';

  const answer = async () => {
    setState('sending');
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    try {
      const res = await fetch(`${url}/functions/v1/buddy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ token: t, answer: stopping ? 'stop' : 'yes' }),
      });
      const body = (await res.json()) as { ok?: boolean };
      setState(res.ok && body.ok ? 'done' : 'problem');
    } catch {
      setState('problem');
    }
  };

  if (!t) return <Message title="This link isn't complete" text="Try tapping the button in the email again." />;
  if (state === 'done')
    return stopping ? (
      <Message title="Done" text="You won't get any more emails from us. Thanks for being there for your mate." />
    ) : (
      <Message
        title="Thanks, you're all set"
        text="Your first weekly note arrives next Monday morning. You can stop them any time from the link in each email."
      />
    );
  if (state === 'problem')
    return <Message title="That didn't work" text="The link may be old, or the internet dropped out. Try again in a minute." />;

  return (
    <Screen help={false} sos={false}>
      <Txt variant="title">{stopping ? 'Stop the weekly emails?' : 'Be a support buddy?'}</Txt>
      <Txt variant="muted">
        {stopping
          ? "You won't get any more updates. Your mate won't be told why."
          : "You'll get one short email a week saying how many sessions your mate has done, with a nudge to send them some encouragement. Nothing personal about what they're working on."}
      </Txt>
      <Button label={stopping ? 'Stop the emails' : "Yes, I'm in"} onPress={answer} loading={state === 'sending'} />
    </Screen>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <Screen help={false} sos={false}>
      <Txt variant="title">{title}</Txt>
      <Txt variant="muted">{text}</Txt>
    </Screen>
  );
}
