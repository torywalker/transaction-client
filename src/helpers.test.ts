import { getErrorMsg, log, validateProperty } from "./helpers";

// Test variable setup
const testString = "test string";
const testName = "testString";

describe("#validateProperty()", () => {
  it("should throw error when type does not match", () => {
    try {
      validateProperty(testString, testName, "object");
    } catch (e) {
      expect(e.message).toEqual(
        `Invalid value provided for ${testName} while initalizing class`
      );
    }
  });

  it("should be able to handle multiple types ", () => {
    const output = validateProperty(testString, testName, [
      "string",
      "function"
    ]);
    expect(output).toEqual(testString);
  });

  it("should return the property when successful validation", () => {
    const output = validateProperty(testString, testName, "string");
    expect(output).toEqual(testString);
  });
});

describe("#getErrorMsg()", () => {
  const errorMessage = "This is an error message";
  const error = new Error(errorMessage);

  it("should get error message from Error object", () => {
    const testError = getErrorMsg(error);
    expect(testError).toEqual(errorMessage);
  });

  it("should get error message as string", () => {
    const testError = getErrorMsg(errorMessage);
    expect(testError).toEqual(errorMessage);
  });
});

describe("#log()", () => {
  it("should generate object with error function", () => {
    const logger = log;
    expect(logger).toHaveProperty("error");
    expect(typeof logger.error === "function").toBe(true);
  });
});
