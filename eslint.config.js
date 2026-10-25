// Code checks (npm run lint): Expo's recommended rules for React Native, hooks and imports.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // The Edge Function entry files run on Deno (Supabase), not in the app.
  { ignores: ['dist/*', 'web-build/*', '.expo/*', 'supabase/functions/**/index.ts'] },
  {
    rules: {
      // Apostrophes in text are only a problem in web HTML, not in React Native <Text>.
      'react/no-unescaped-entities': 'off',
    },
  },
  // Layout is Prettier's job (npm run format), so ESLint stays out of it.
  prettierConfig,
]);
