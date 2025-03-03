/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  preset: "jest-puppeteer",
};
