module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Business Decision Simulator - Test Report',
      outputPath: './test-report/index.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      theme: 'defaultTheme'
    }]
  ]
};
