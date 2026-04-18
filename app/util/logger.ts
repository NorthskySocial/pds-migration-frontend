type LogLevel = "silent" | "error" | "info" | "debug";

// Determine log level from env; default to "debug" in dev and "info" in prod.
// Priority: global SSR override -> VITE_LOG_LEVEL -> DEBUG flag -> DEV default
const globalLevel = (globalThis as any)?.__LOG_LEVEL as string | undefined;
const explicitLevel = (
  import.meta.env.VITE_LOG_LEVEL as string | undefined
)?.toLowerCase();
// Support Wrangler/Workers style `DEBUG` var; any truthy non-"false"/"0" enables debug
const debugFlag = (import.meta.env.DEBUG as string | undefined)?.toLowerCase();
const isDebugFlag =
  Boolean(debugFlag) && debugFlag !== "false" && debugFlag !== "0";
const isDev = Boolean(import.meta.env.DEV);
const level: LogLevel =
  (globalLevel as LogLevel) ||
  (explicitLevel as LogLevel) ||
  (isDebugFlag ? "debug" : isDev ? "debug" : "info");

const order: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  info: 2,
  debug: 3,
};

function enabled(min: LogLevel) {
  return order[level] >= order[min];
}

export const logger = {
  // Map `log` to `info" level semantics
  log: (...args: any[]) => {
    if (enabled("info")) console.log(...args);
  },
  info: (...args: any[]) => {
    if (enabled("info")) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (enabled("info")) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (enabled("error")) console.error(...args);
  },
  debug: (...args: any[]) => {
    if (enabled("debug")) console.debug(...args);
  },
} as const;
