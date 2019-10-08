import { validateProperty } from "./helpers";

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

// TODO: add log test
