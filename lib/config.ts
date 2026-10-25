import raw from '@/config/app.config.json';

// The app's editable settings (config/app.config.json): helplines, onboarding choices, questionnaire.
export const config = raw;

export type HelpService = (typeof raw.help.services)[number] & { web?: string };
