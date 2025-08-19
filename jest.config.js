export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/client/src'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'server/domain/**/*.ts',
    '!server/domain/**/*.spec.ts',
    'client/src/utils/**/*.ts',
    '!client/src/utils/**/*.test.ts',
  ],
};