/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/**/*.entity.ts', '!src/**/*.input.ts', '!src/**/*.type.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterSetup: [],
};
