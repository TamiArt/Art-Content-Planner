const isDebugEnabled = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
