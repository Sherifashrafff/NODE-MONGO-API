module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['<rootDir>/test/**/*.test.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: process.env.JEST_JUNIT_OUTPUT_NAME || 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
      },
    ],
  ],
  collectCoverageFrom: ['<rootDir>/src/**/*.js', '!<rootDir>/src/server.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'clover'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70, statements: 80 },
  },
};
