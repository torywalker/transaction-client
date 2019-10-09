import Client, { ClientResult } from "./client";
import Step from "./step";

// Test variable setup
const errorMessage = "This is an error";
const errorFunction = jest.fn(() => Promise.reject(errorMessage));
const successMessage = "Everything is okay";
const successFunction = jest.fn(() => Promise.resolve(successMessage));
const stepName = "testName";
const passingStep = new Step(stepName, successFunction, successFunction);
const failingStep = new Step(stepName, errorFunction, errorFunction);
let client: Client;

beforeEach(() => {
  client = new Client();
});

describe("#addStep()", () => {
  it("should throw error if invalid step is added", () => {
    expect(() => (client as any).addStep("Not a step")).toThrowError(
      "Only objects of type Step can be added to the client"
    );
  });

  it("should add to internal array when new step is added", () => {
    client.addStep(passingStep);
    client.addStep(passingStep);
    const currentSteps = client.steps;

    expect(Array.isArray(currentSteps)).toBeTruthy();
    expect(currentSteps.length).toBe(2);
  });

  it("should be chainable", () => {
    const addStep = client.addStep(passingStep);
    expect(addStep instanceof Client).toBeTruthy();
  });
});

describe("#getSteps()", () => {
  it("should return all steps", () => {
    const expectedResult = [passingStep];
    client.addStep(passingStep);
    const steps = client.steps;
    expect(steps).toEqual(expectedResult);
  });
});

describe("#getCompletedSteps()", () => {
  it("should return all steps that have completed", async () => {
    const expectedResult = [passingStep];
    client.addStep(passingStep);
    await client.start().catch(/* throwaway error */);

    const steps = client.completedSteps;
    expect(steps).toEqual(expectedResult);
  });
});

describe("#_rollback()", () => {
  it("should call each step rollback function", async () => {
    (client as any)._completedSteps = [failingStep];
    await (client as any)._rollback();

    expect(errorFunction).toHaveBeenCalledTimes(1);
  });

  it("should error if any rollbacks failed to execute", async () => {
    client.addStep(failingStep);

    await client.start().catch(e => {
      expect(e).toEqual(
        Error(
          `Unable to rollback all transactions. Transaction rollback failed with the error: Error: Unable to roll back step ${stepName}`
        )
      );
    });
  });
});

describe("#start()", () => {
  it("should call all steps in sequence", async () => {
    const spyFn1 = jest.fn(() => Promise.resolve(successMessage));
    const spyFn2 = jest.fn(() => Promise.resolve(successMessage));
    const step1 = new Step("test1", spyFn1, successFunction);
    const step2 = new Step("test2", spyFn2, successFunction);
    client.addStep(step1).addStep(step2);

    await client.start();

    expect(spyFn1).toHaveBeenCalledTimes(1);
    expect(spyFn2).toHaveBeenCalledTimes(1);
  });

  it("should call all rollback steps in sequence upon step failure", async () => {
    const spyFn1 = jest.fn(successFunction);
    const spyFn2 = jest.fn(successFunction);
    const step1 = new Step("test1", successFunction, spyFn1);
    const step2 = new Step("test2", errorFunction, spyFn2);
    client.addStep(step1).addStep(step2);

    await client.start().catch(/* throwaway error */);

    expect(spyFn1).toHaveBeenCalledTimes(1);
    expect(spyFn2).toHaveBeenCalledTimes(1);
  });

  it("should return aggregated data from all step starts", async () => {
    const fn1data = { test1: "this is a test" };
    const fn2data = { test2: "this is also a test" };
    const fn1 = () => Promise.resolve(fn1data);
    const fn2 = () => Promise.resolve(fn2data);
    const step1 = new Step(stepName, fn1, successFunction);
    const step2 = new Step(stepName, fn2, successFunction);
    const expectedOutput = Object.assign(
      { rolledBack: false },
      fn1data,
      fn2data
    );

    const data = await client
      .addStep(step1)
      .addStep(step2)
      .start();
    expect(data).toEqual(expectedOutput);
  });

  it("should pass aggregated data to each sequential step", async () => {
    const fn1data = { test1: "this is a test" };
    const fn2data = { test2: "this is also a test" };
    const fn1 = () => Promise.resolve(fn1data);
    const fn2 = (data: { [key: string]: any }) =>
      Promise.resolve(
        data.test1 === fn1data.test1 ? fn2data : { nope: "failure" }
      );
    const fn3 = (data: { [key: string]: any }) =>
      Promise.resolve(
        data.test1 === fn1data.test1 && data.test2 === fn2data.test2
          ? fn2data
          : { nope: "failure" }
      );
    const step1 = new Step(stepName, fn1, successFunction);
    const step2 = new Step(stepName, fn2, successFunction);
    const step3 = new Step(stepName, fn3, successFunction);
    const expectedOutput = Object.assign(
      { rolledBack: false },
      fn1data,
      fn2data
    );

    const data = await client
      .addStep(step1)
      .addStep(step2)
      .addStep(step3)
      .start();
    expect(data).toEqual(expectedOutput);
  });

  it("should add rollback data to return on rollback", async () => {
    const data: ClientResult = await client
      .addStep(passingStep)
      .addStep(failingStep)
      .start();
    expect(data.rollbackSteps).toEqual(["testName", "testName"]);
    expect(data.rolledBack).toEqual(true);
    expect(data.rollbackInitiator).toEqual("testName");
    expect(data.rollbackErrors).toEqual([
      Error("Unable to roll back step testName. Error: This is an error")
    ]);
  });

  it("should not continue executing steps if one step fails", async () => {
    const uncalledSuccessFn = jest.fn(successFunction);
    const step1 = new Step(stepName, successFunction, errorFunction);
    const step2 = new Step(stepName, errorFunction, successFunction);
    const step3 = new Step(stepName, uncalledSuccessFn, successFunction);
    await client
      .addStep(step1)
      .addStep(step2)
      .addStep(step3)
      .start();

    expect(uncalledSuccessFn).toHaveBeenCalledTimes(0);
  });

  it("should continue rolling steps back if one rollback fails", async () => {
    const spySuccessFn = jest.fn(successFunction);

    const step1 = new Step(stepName, successFunction, spySuccessFn);
    const step2 = new Step(stepName, successFunction, errorFunction);
    const step3 = new Step(stepName, errorFunction, successFunction);
    await client
      .addStep(step1)
      .addStep(step2)
      .addStep(step3)
      .start();

    expect(spySuccessFn).toBeCalledTimes(1);
  });
});
