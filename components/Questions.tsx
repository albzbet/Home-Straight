import { View } from 'react-native';
import { Chip, Row, Txt } from '@/components/ui';
import { config } from '@/lib/config';
import { space } from '@/lib/theme';

// The private before-and-after questions (config.questionnaire), asked in onboarding and again after Week 6.
const q = config.questionnaire;

export const blankAnswers = (): (number | null)[] => q.items.map(() => null);

export function Questions({ answers, onChange }: { answers: (number | null)[]; onChange: (a: (number | null)[]) => void }) {
  return (
    <>
      <Txt variant="h2">{q.intro}</Txt>
      {q.items.map((item, i) => (
        <View key={i} style={{ gap: space.sm }}>
          <Txt>{item}</Txt>
          <Row>
            {q.scale.map((label, value) => (
              <Chip
                key={label}
                label={label}
                selected={answers[i] === value}
                onPress={() => onChange(answers.map((a, j) => (j === i ? value : a)))}
              />
            ))}
          </Row>
        </View>
      ))}
    </>
  );
}
