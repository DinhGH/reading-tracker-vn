export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary", "json"],
  clearMocks: true,
};
