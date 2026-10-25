import { useEffect, useState } from 'react';
import { AdminScreen } from '@/components/Admin';
import { Button, Card, Txt } from '@/components/ui';
import { decideHardship, fetchHardshipRequests, type HardshipRequest } from '@/lib/access';

// Free access requests: waiting ones first. Approving gives that member the whole program.
export default function AdminHardship() {
  const [list, setList] = useState<HardshipRequest[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () =>
    fetchHardshipRequests()
      .then((l) => (setList(l), setProblem(null)))
      .catch((e: Error) => setProblem(e.message));
  useEffect(() => {
    load();
  }, []);

  const decide = async (id: number, approve: boolean) => {
    setBusy(id);
    try {
      await decideHardship(id, approve);
      await load();
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const day = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <AdminScreen title="Free access requests">
      {problem ? <Txt variant="small">Couldn't load: {problem}</Txt> : null}
      {list && !list.length ? <Txt variant="muted">No requests yet.</Txt> : null}
      {list?.map((r) => (
        <Card key={r.id}>
          <Txt variant="label">
            {r.status === 'pending' ? 'Waiting' : r.status === 'approved' ? 'Approved' : 'Declined'} · {day(r.requestedAt)}
          </Txt>
          <Txt variant="h2">{r.nickname}</Txt>
          <Txt>{r.note || '(No message)'}</Txt>
          {r.status === 'pending' ? (
            <>
              <Button label="Approve: give free access" loading={busy === r.id} onPress={() => decide(r.id, true)} />
              <Button label="Decline" kind="ghost" onPress={() => decide(r.id, false)} />
            </>
          ) : null}
        </Card>
      ))}
    </AdminScreen>
  );
}
