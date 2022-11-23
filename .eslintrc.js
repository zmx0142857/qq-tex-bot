module.exports = {
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': [
    'standard',
    'eslint:recommended',
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module'
  },
  'rules': {
    'promise/param-names': 'off',
    'comma-dangle': 'off',
    'quote-props': 'off',
    'space-before-function-paren': 'off',
  }
}
