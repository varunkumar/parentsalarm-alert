/* eslint-disable no-underscore-dangle */
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.config({
    env: {
      es2021: true,
      node: true,
    },
    ignorePatterns: ['node_modules/', '**/*.config.js'],
    extends: ['airbnb-base', 'prettier', 'plugin:security/recommended'],
    plugins: ['security'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'import/extensions': ['error', 'ignorePackages'],
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['*.config.js'] },
      ],
    },
  }),
];
