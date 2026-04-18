/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  displayName: "unit",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "bundler",
          target: "ES2022",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["node", "jest"],
          baseUrl: ".",
          paths: {
            "~/*": ["./app/*"],
          },
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
  },
  testMatch: ["<rootDir>/test/unit/**/*.test.ts"],
};
