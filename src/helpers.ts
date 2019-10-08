import bunyan from "bunyan";
import Bformat from "bunyan-format";

/**
 * Validate properties that are passed into the constructor
 * @param {*} property - The property taht will be evaluated
 * @param {string} name - Name to display if validation fails
 * @param {string|Array} type - The expected type of the value, or an array of types
 * @throws {TypeError}
 * @returns {*} The property that was originally passed in
 */
export const validateProperty = <T>(
  property: T,
  name: string,
  type: string | string[]
): T => {
  if (
    (typeof type === "string" && typeof property !== type) || // eslint-disable-line
    (Array.isArray(type) && !type.includes(typeof property)) // eslint-disable-line
  ) {
    throw new TypeError(
      `Invalid value provided for ${name} while initalizing class`
    );
  }
  return property;
};

export const getErrorMsg = (err?: Error | string) =>
  err instanceof Error ? err.message : err;

export const log = (() => {
  const formatOut = new Bformat({
    outputMode: "json",
    jsonIndent: 2,
    levelInString: true
  });
  const getLogLevel = (environment?: string) => {
    switch (environment) {
      case "development":
        return "info";
      case "test":
        return "fatal";
      default:
        return "warn";
    }
  };

  return {
    error: (err: Error | string) => {
      const name = "transaction-client";
      const message = getErrorMsg(err);
      const logger = bunyan.createLogger({
        level: getLogLevel(process.env.NODE_ENV),
        name,
        stream: formatOut,
        env: process.env.NODE_ENV || "development",
        app: {
          group: "marvin",
          name
        }
      });

      logger.error(message);
    }
  };
})();
