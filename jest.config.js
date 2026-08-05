/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testMatch: ["<rootDir>/test/e2e.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.tests.json",
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
  },
  preset: "jest-puppeteer",
};
