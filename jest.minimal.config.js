// @ts-check
/** @type {import('jest').Config} */
const config = {
  // A minimal configuration that doesn't depend on the setup file
  testEnvironment: 'node', // Use node environment instead of jsdom
  roots: ['<rootDir>/client/src/__tests__'],
  testMatch: ['**/standalone-no-setup.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
    }]
  },
  setupFilesAfterEnv: [], // No setup files
  moduleFileExtensions: ['ts', 'js'],
};

export default config;