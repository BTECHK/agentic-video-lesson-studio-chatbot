// Root ESLint flat config (Remotion + pipeline scripts).
// Lenient by design: `tsc --noEmit` is the primary type gate; ESLint adds a
// lightweight lint pass (unused code, obvious mistakes). The chatbot has its
// own eslint config and is excluded here.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'output/**',
      'out/**',
      'coverage/**',
      '.test-results/**',
      '.claude/**',
      '.agents/**',
      'chatbot/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Unused code is signal, not a hard stop — keep the gate fast to satisfy.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Pipeline scripts intentionally use `any` at JSON boundaries.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
