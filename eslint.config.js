import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  { ignores: ['dist', 'eslint.config.js'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Custom rule to prevent base44 references
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
        {
          selector: 'Identifier[name=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Custom rule to prevent base44 references
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
        {
          selector: 'Identifier[name=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw=/base44/i]',
          message: 'base44 references are not allowed in tracked files',
        },
      ],
    },
  },
]
