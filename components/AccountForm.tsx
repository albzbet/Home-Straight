import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Field, Txt } from '@/components/ui';
import { sendEmailLink, signInWithProvider, verifyEmailCode } from '@/lib/auth';
import { looksLikeEmail } from '@/lib/format';
import { setPendingNickname } from '@/lib/store';
import { space } from '@/lib/theme';

// Sign in with Apple, Google or an email link. With askNickname, a nickname comes first (for new accounts).
export function AccountForm({ askNickname }: { askNickname: boolean }) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const nickOk = !askNickname || nickname.trim().length >= 2;

  // Each way in remembers the nickname first, so it's there when the sign-in comes back.
  const run = async (what: string, fn: () => Promise<string | null>) => {
    if (!nickOk) return setProblem('Pick a nickname first (at least 2 letters).');
    setBusy(what);
    setProblem(null);
    if (askNickname) await setPendingNickname(nickname);
    const err = await fn();
    setBusy(null);
    if (err) setProblem(err);
    return err;
  };

  if (sentTo)
    return (
      <View style={{ gap: space.md }}>
        <Txt variant="h2">Check your email</Txt>
        <Txt variant="muted">
          We sent a link to {sentTo}. Tap it on this phone to sign in. If your email shows a 6-digit code instead, type it here.
        </Txt>
        <Field label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
        <Button
          label="Sign in with code"
          disabled={code.trim().length < 6}
          loading={busy === 'code'}
          onPress={() => run('code', () => verifyEmailCode(sentTo, code))}
        />
        <Button label="Use a different email" kind="ghost" onPress={() => setSentTo(null)} />
        {problem ? <Txt variant="small">{problem}</Txt> : null}
      </View>
    );

  return (
    <View style={{ gap: space.md }}>
      {askNickname ? (
        <>
          <Field label="Pick a nickname" value={nickname} onChangeText={setNickname} maxLength={24} autoCorrect={false} />
          <Txt variant="small">Please don't use your real name. Nobody else sees it, but it keeps things private.</Txt>
        </>
      ) : null}
      {Platform.OS !== 'android' ? (
        <Button
          label="Continue with Apple"
          kind="secondary"
          loading={busy === 'apple'}
          onPress={() => run('apple', () => signInWithProvider('apple'))}
        />
      ) : null}
      <Button
        label="Continue with Google"
        kind="secondary"
        loading={busy === 'google'}
        onPress={() => run('google', () => signInWithProvider('google'))}
      />
      <Txt variant="small" style={{ textAlign: 'center' }}>
        or
      </Txt>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Button
        label="Email me a sign-in link"
        disabled={!looksLikeEmail(email)}
        loading={busy === 'email'}
        onPress={async () => {
          const err = await run('email', () => sendEmailLink(email));
          if (!err && nickOk) setSentTo(email.trim());
        }}
      />
      {problem ? <Txt variant="small">{problem}</Txt> : null}
    </View>
  );
}
