/** @type {import('jest').Config} */
export default {
  globalSetup: "<rootDir>/src/test/globalSetup.cjs",
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@vms/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@vms/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/test/jest.env.ts"],
  maxWorkers: 1,
  testTimeout: 15000,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/test/**",
    "!src/db/seed*.ts",
    "!src/index.ts",
  ],
  coverageReporters: ["text", "html", "lcov"],
};
