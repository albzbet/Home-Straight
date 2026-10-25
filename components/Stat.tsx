import { StatCard } from '@/components/ui';

// One number with a label underneath, two to a row (week and end-of-program summaries).
export function Stat({ value, label }: { value: string; label: string }) {
  return <StatCard value={value} label={label} style={{ flexBasis: '46%', flexGrow: 1 }} />;
}
