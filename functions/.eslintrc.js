module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
  plugins: ["import"],
  "eslint:recommended",
  "plugin:import/errors",
  "plugin:import/warnings",
  rules: {
    "import/no-dynamic-require": "off", // disables the rule entirely
    "require-jsdoc": "off", // disables Google's JSDoc requirement
    "valid-jsdoc": "off",
    "no-unused-vars": "warn",
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "prefer-arrow-callback": "error",
    "no-restricted-globals": ["error", "name", "length"],
    "linebreak-style": "off",
    "object-curly-spacing": "off",
    "indent": "off",
    "max-len": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: { mocha: true },
    },
  ],
};
