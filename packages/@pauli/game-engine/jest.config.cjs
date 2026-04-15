module.exports = {
  setupFilesAfterEnv: ['<rootDir>/../../../jest.setup.js'],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@pauli/shared$': '<rootDir>/../../@pauli/shared/src',
    '^@pauli/cinema-core$': '<rootDir>/../../@pauli/cinema-core/src',
    '^@pauli/game-engine$': '<rootDir>/src',
    '^@pauli/engine-api$': '<rootDir>/../../@pauli/engine-api/src',
  },
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
