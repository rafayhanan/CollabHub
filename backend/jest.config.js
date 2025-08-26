/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    globalSetup: '<rootDir>/tests/global-setup.ts',
    globalTeardown: '<rootDir>/tests/global-teardown.ts',
    testMatch: ['**/?(*.)+(spec|test).ts'],
    clearMocks: true,
    maxWorkers: 1,
    testTimeout: 45000, // Increased to 45 seconds for chat tests
};


