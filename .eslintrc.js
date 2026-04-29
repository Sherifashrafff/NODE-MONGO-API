module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    'no-console': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    eqeqeq: ['error', 'always'],
    'no-return-await': 'error',
    'no-throw-literal': 'error',
  },
  ignorePatterns: ['coverage/', 'reports/', 'node_modules/'],
};
