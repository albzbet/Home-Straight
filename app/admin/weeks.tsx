import { Fragment, useState } from 'react';
import { AdminScreen, useSaver } from '@/components/Admin';
import { Field, Txt } from '@/components/ui';
import { saveContent } from '@/lib/admin';
import { useContent } from '@/lib/content';

export default function AdminWeeks() {
  const { weeks } = useContent();
  const [list, setList] = useState(weeks);
  const footer = useSaver(() => saveContent({ weeks: list }));
  return (
    <AdminScreen title="Week themes" footer={footer}>
      {list.map((w, i) => (
        <Fragment key={w.week}>
          <Txt variant="h2">Week {w.week}</Txt>
          <Field label="Theme" value={w.theme} onChangeText={(theme) => setList(list.map((x, j) => (j === i ? { ...x, theme } : x)))} />
          <Field
            label="Summary"
            value={w.summary}
            onChangeText={(summary) => setList(list.map((x, j) => (j === i ? { ...x, summary } : x)))}
            multiline
          />
        </Fragment>
      ))}
    </AdminScreen>
  );
}
