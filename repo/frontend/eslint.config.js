import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

// Reglas de dependencia entre capas: docs/frontend-specs.md §7.
const forbid = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
})

const dexieOnlyInData = {
  group: ['dexie', 'dexie-react-hooks'],
  message: 'Solo data/db y repositorios importan dexie.',
}
const supabaseOnlyInRemote = {
  group: ['@supabase/supabase-js'],
  message: 'Solo data/*/supabase importa @supabase/supabase-js.',
}

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...forbid([dexieOnlyInData, supabaseOnlyInRemote]),
    },
  },
  // domain: sin React, Dexie ni nada fuera de domain.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: forbid([
      dexieOnlyInData,
      supabaseOnlyInRemote,
      {
        group: ['react', 'react-dom', 'react-router', 'react/*'],
        message: 'domain no depende de React.',
      },
      {
        group: ['**/data/**', '**/features/**', '**/components/**', '**/app/**', '**/lib/**'],
        message: 'domain solo importa de domain.',
      },
    ]),
  },
  // components: no importan de features.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: forbid([
      dexieOnlyInData,
      supabaseOnlyInRemote,
      { group: ['**/features/**'], message: 'components no importa de features.' },
    ]),
  },
  // Excepciones: dónde sí se permite dexie y supabase.
  {
    files: ['src/data/db/**', 'src/data/repositories/**', 'src/data/hooks/**'],
    rules: forbid([supabaseOnlyInRemote]),
  },
  {
    files: ['src/data/remote/supabase/**', 'src/data/auth/supabase/**'],
    rules: forbid([dexieOnlyInData]),
  },
  { files: ['**/*.test.{ts,tsx}', 'src/test/**'], rules: { 'no-restricted-imports': 'off' } },
  prettier,
)
