import { Card, Txt } from '@/components/ui';

// One number with a label underneath, for summaries.
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flexBasis: '46%', flexGrow: 1, padding: 18, gap: 4 }}>
      <Txt variant="title">{value}</Txt>
      <Txt variant="muted">{label}</Txt>
    </Card>
  );
}
