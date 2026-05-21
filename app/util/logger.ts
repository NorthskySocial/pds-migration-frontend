type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

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
  warn: 2,
  info: 3,
  debug: 4,
};

function enabled(min: LogLevel) {
  return order[level] >= order[min];
}

/**
 * Formats the DID prefix for log messages.
 */
function formatDidPrefix(did: string | undefined): string {
  if (!did) return "";

  return `[${did}] `;
}

/**
 * Prepends DID prefix to the first argument if it's a string,
 * otherwise inserts the prefix as the first element.
 */
function prependDid(did: string | undefined, args: any[]): any[] {
  const prefix = formatDidPrefix(did);
  if (!prefix) return args;

  if (args.length === 0) return [prefix.trim()];

  if (typeof args[0] === "string") {
    return [prefix + args[0], ...args.slice(1)];
  }

  return [prefix.trim(), ...args];
}

export type Logger = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  /**
   * Creates a scoped logger that automatically prepends the user's DID to all log messages.
   * Use this to track a user's journey through the application.
   *
   * @param did - The user's DID (Decentralized Identifier)
   * @returns A logger instance with the same API, but with DID prefix on all messages
   *
   * @example
   * const userLogger = logger.withDid(session.get("did"));
   * userLogger.info("Starting migration"); // Logs: "[...abc123xy] Starting migration"
   */
  withDid: (did: string | undefined) => Omit<Logger, "withDid">;
};

/**
 * Creates a logger instance, optionally scoped to a specific DID.
 */
function createLogger(did?: string): Logger {
  return {
    log: (...args: any[]) => {
      if (enabled("info")) console.log(...prependDid(did, args));
    },
    info: (...args: any[]) => {
      if (enabled("info")) console.info(...prependDid(did, args));
    },
    warn: (...args: any[]) => {
      if (enabled("warn")) console.warn(...prependDid(did, args));
    },
    error: (...args: any[]) => {
      if (enabled("error")) console.error(...prependDid(did, args));
    },
    debug: (...args: any[]) => {
      if (enabled("debug")) console.debug(...prependDid(did, args));
    },
    withDid: (newDid: string | undefined) => createLogger(newDid),
  };
}

export const logger: Logger = createLogger();
