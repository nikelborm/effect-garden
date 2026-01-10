/** @type {import('stylelint').Config} */
export default {
  customSyntax: '@linaria/postcss-linaria',
  // customSyntax: "postcss-styled-syntax",
  // extends: ['@linaria/stylelint-config-standard-linaria'],
  extends: ['stylelint-config-standard'],
  rules: {
    'value-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'string-no-newline': true,
    'no-empty-source': null,
    'nesting-selector-no-missing-scoping-root': null,
    'declaration-property-value-no-unknown': [
      true,
      {
        ignoreProperties: {
          '/.+/': ['/^pcss_lin/'],
        },
      },
    ],
  },
}
