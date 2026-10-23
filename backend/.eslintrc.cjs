module.exports = {
  root: true, env: { es2022: true }, parser: '@typescript-eslint/parser', plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: { '@typescript-eslint/no-explicit-any': 'error' }
};
