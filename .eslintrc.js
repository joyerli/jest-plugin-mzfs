module.exports = {
  root: true,

  extends: ['airbnb'],

  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },

  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      modules: true,
      experimentalObjectRestSpread: true
    },
    sourceType: 'module'
  },

  rules: {
    'no-underscore-dangle': 0,
    'global-require': 0,
  }
};
