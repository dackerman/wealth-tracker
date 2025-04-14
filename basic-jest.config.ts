import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/client/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  // Don't use the setup file for now
  setupFilesAfterEnv: [],
  testMatch: ['**/basic.test.ts', '**/forecast-calculator.basic.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;