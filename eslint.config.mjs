import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

// ESLint v9 flat config for the Archive76 M2 frontend (React + TypeScript + Vite).
// Uses only packages declared in package.json: @eslint/js, globals, eslint-plugin-react,
// @typescript-eslint/parser, @typescript-eslint/eslint-plugin.
export default [
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'src-tauri/target/', '.tmp/'],
  },
  // JavaScript recommended (lints plain .js files too)
  js.configs.recommended,
  // TypeScript files: use the TS parser + recommended TS rules.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.dom,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  // React: enable recommended ruleset and report JSX for .tsx/.jsx.
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: { react },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Vite uses the automatic JSX runtime.
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Plain JS files (config, scripts)
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
];
