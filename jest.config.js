module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.[jt]s?(x)",
    "<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  coverageDirectory: "coverage",
  collectCoverage: true,
  coverageReporters: ["json", "text"],
  collectCoverageFrom: ["src/**/*.{ts,js,jsx}"],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15
    }
  }
};
