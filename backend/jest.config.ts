/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./jest.setup.ts"],
  roots: ["<rootDir>/src/tests"],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["html", "lcov", "text-summary"],
};