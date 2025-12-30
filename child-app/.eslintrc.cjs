module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2021: true, node: true, jest: true },
  rules: {
    'react/react-in-jsx-scope': 'off'
  }
};
