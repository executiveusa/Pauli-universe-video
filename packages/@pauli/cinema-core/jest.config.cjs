module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@pauli/shared$': '<rootDir>/../../@pauli/shared/src',
    '^@pauli/cinema-core$': '<rootDir>/src',
    '^@pauli/game-engine$': '<rootDir>/../../@pauli/game-engine/src',
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
