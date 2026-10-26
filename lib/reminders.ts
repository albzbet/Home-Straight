import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { config } from './config';
import { planNudges } from './plans';
import { reminderPlan } from './reminderPlan';
import type { ProgramState } from './types';

// Reminders are scheduled on the phone itself (no server, no push service), so they work in Expo Go too.
// Wording comes from config.reminders and never mentions gambling.

const ON_KEY = 'hs:remindersOn'; // per phone: notifications permission is per phone too
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function remindersOn(): Promise<boolean> {
  if (!supported) return false;
  const [pref, perm] = await Promise.all([AsyncStorage.getItem(ON_KEY), Notifications.getPermissionsAsync()]);
  return pref !== 'off' && perm.granted;
}

// Asks the phone for permission (only when they tap "Turn on"). Returns whether reminders are now on.
export async function turnRemindersOn(): Promise<boolean> {
  if (!supported) return false;
  await AsyncStorage.setItem(ON_KEY, 'on');
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function turnRemindersOff() {
  await AsyncStorage.setItem(ON_KEY, 'off');
  if (supported) await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminders(state: ProgramState) {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await remindersOn())) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const r = config.reminders;
  const habit = state.onboarding?.habit ? `, ${state.onboarding.habit.charAt(0).toLowerCase()}${state.onboarding.habit.slice(1)}` : '';
  for (const p of reminderPlan(state, new Date(), r.quietDaysBeforeWelcomeBack)) {
    const words = r[p.kind];
    await Notifications.scheduleNotificationAsync({
      content: { title: words.title, body: words.body.replace('{habit}', habit) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: 'reminders' },
    });
  }
  // If-then plan heads-ups, every week at the time they picked. Tapping one opens their plans.
  for (const n of planNudges(state)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.plan.title, body: r.plan.body, data: { url: '/plans' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: n.weekday + 1, // the phone counts Sunday as 1
        hour: n.hour,
        minute: n.minute,
        channelId: 'reminders',
      },
    });
  }
}

// Opens the screen a tapped reminder points to (only the plan heads-up has one, /plans).
export function useReminderTaps(open: (url: string) => void) {
  useEffect(() => {
    if (!supported) return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const url = res.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) open(url);
    });
    return () => sub.remove();
  }, [open]);
}

// Keeps the phone's reminders in step with the program. Re-run whenever their data changes.
export function useReminderSync(state: ProgramState, ready: boolean) {
  useEffect(() => {
    if (ready) scheduleReminders(state).catch(() => {});
  }, [state, ready]);
}

export function useRemindersOn(): [boolean | null, (on: boolean) => Promise<void>] {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    remindersOn()
      .then(setOn)
      .catch(() => setOn(false));
  }, []);
  const set = async (want: boolean) => setOn(want ? await turnRemindersOn() : (await turnRemindersOff(), false));
  return [on, set];
}

export const remindersSupported = supported;
