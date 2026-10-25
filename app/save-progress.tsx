import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { AccountForm } from '@/components/AccountForm';
import { Button, Field, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';
import { accountsAvailable } from '@/lib/supabase';

// "Save your progress": make a free account after trying Day 1. Signed in without a nickname yet: just the nickname.
export default function SaveProgress() {
  const { signedIn, state, saveNickname } = useStore();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  if (signedIn && state.nickname) return <Redirect href="/" />;

  if (signedIn)
    return (
      <Screen>
        <Txt variant="title">What should we call you?</Txt>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} maxLength={24} autoCorrect={false} />
        <Txt variant="small">Please don't use your real name.</Txt>
        <Button
          label="Save"
          disabled={nickname.trim().length < 2}
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await saveNickname(nickname.trim());
            } finally {
              setSaving(false);
            }
          }}
        />
      </Screen>
    );

  return (
    <Screen>
      <Txt variant="title">Save your progress</Txt>
      <Txt variant="muted">A free account keeps what you've done safe, so you can carry on tomorrow. Week 1 is free.</Txt>
      {accountsAvailable ? (
        <AccountForm askNickname />
      ) : (
        <Txt variant="muted">Accounts aren't switched on in this test version yet. Your Day 1 is saved on this phone.</Txt>
      )}
      <Button label="Privacy policy" kind="ghost" onPress={() => router.push('/privacy')} />
    </Screen>
  );
}
