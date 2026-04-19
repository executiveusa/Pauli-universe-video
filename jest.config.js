module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@pauli/shared$': '<rootDir>/packages/@pauli/shared/src',
    '^@pauli/cinema-core$': '<rootDir>/packages/@pauli/cinema-core/src',
    '^@pauli/game-engine$': '<rootDir>/packages/@pauli/game-engine/src',
    '^@pauli/engine-api$': '<rootDir>/packages/@pauli/engine-api/src',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/index.ts',
    'apps/*/app/**/*.{ts,tsx}',
    '!apps/*/app/**/layout.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },
};
