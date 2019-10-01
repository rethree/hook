module.exports = {
  roots: ["<rootDir>"],
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  collectCoverageFrom: ["lib/**/*.{ts,tsx}"]
};
