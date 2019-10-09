module.exports = {
  roots: ["<rootDir>"],
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  preset: "ts-jest",
  collectCoverageFrom: ["lib/**/*.{ts,tsx}"],
  testPathIgnorePatterns: ["/dist"],
  testRegex: "\\.test\\.(ts|tsx)"
};
