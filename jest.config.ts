import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/client/src', '<rootDir>/server'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transform: {
    // Use ts-jest for all TypeScript and TypeScript JSX files
    '^.+\\.(ts|tsx)$': ['ts-jest', { 
      isolatedModules: true,
      jsx: 'react-jsx'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@replit|@radix-ui|cmdk|wouter|rehype|remark|unified|bail|trough|vfile|unist|hast|hastscript|property-information|space-separated-tokens|comma-separated-tokens|micromark|character-entities|decode-named-character-reference|trim-lines)/).+\\.js$'
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Add a timeout of 30 seconds for tests
  testTimeout: 30000,
};

export default config;