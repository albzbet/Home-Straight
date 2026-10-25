// Code checks (npm run lint): Expo's recommended rules for React Native, hooks and imports.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'web-build/*', '.expo/*'] },
  {
    rules: {
      // Apostrophes in text are only a problem in web HTML, not in React Native <Text>.
      'react/no-unescaped-entities': 'off',
    },
  },
  // Layout is Prettier's job (npm run format), so ESLint stays out of it.
  prettierConfig,
]);
