export const logger = import.meta.env.DEV
  ? console
  : {
      log: console.log,
      info: console.info,
      error: console.error,
      debug: () => {}, // TODO find a way of enabling and disabling via env vars
    };
