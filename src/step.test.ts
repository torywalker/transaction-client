import Step from './step';

// Test variable setup
const testName = 'testName';
const testOutput = { testData: 'test output' };
const errMessage = 'This is an error';
const successFn = () => Promise.resolve(testOutput);
const errorFn = () => Promise.reject(errMessage);

describe('#constructor()', () => {
  it('should error when name not present', () => {
    expect(() => new (Step as any)(undefined, successFn, successFn)).toThrowError(
      'Invalid value provided for name while initalizing class'
    );
  });

  it('should error when fnToExecute not present', () => {
    expect(() => new (Step as any)('testName', undefined, successFn)).toThrowError(
      'Invalid value provided for fnToExecute while initalizing class'
    );
  });

  it('should error when name not present', () => {
    expect(() => new (Step as any)('testName', successFn, 'invalid')).toThrow(
      'Invalid value provided for fnToRollback while initalizing class'
    );
  });

  it('should add class properties', () => {
    const step = new Step(testName, successFn, successFn);
    expect(step.name).toEqual(testName);
    expect((step as any)._fnToExecute).toEqual(successFn);
    expect((step as any)._fnToRollback).toEqual(successFn);
    expect((step as any)._output).toEqual({});
    expect((step as any)._rollbackOutput).toEqual({});
  });
});

describe('#start()', () => {
  it('should throw error if step fails', async () => {
    const step = new Step(testName, errorFn, successFn);
    await step.start().catch((e: Error) => {
      expect(e.message).toEqual(
        `Step ${testName} failed to execute. Additional Error: ${errMessage}`
      );
    });
  });

  it('should return result successful step completion', async () => {
    const step = new Step(testName, successFn, successFn);
    const result = await step.start();
    expect(result).toEqual(testOutput);
  });

  it('should send provided data to the fnToExecute', async () => {
    const testData = { data: 'this is test data' };
    const dataFunction = (data: { data: string }) => Promise.resolve(data);
    const step = new Step(testName, dataFunction, successFn);
    const result = await step.start(testData);
    expect(result).toEqual(testData);
  });
});

describe('#rollback()', () => {
  it('should call provided rollback function', async () => {
    const step = new Step(testName, successFn, successFn);
    const result = await step.rollback();
    expect(result).toEqual(testOutput);
  });

  it('should throw error if rollback fails', async () => {
    const testOutput = `Unable to roll back step ${testName}. Error: ${errMessage}`;
    const step = new Step(testName, successFn, errorFn);
    await step.rollback().catch((e: Error) => {
      expect(e.message).toEqual(testOutput);
    });
  });

  it('should pass data and errors as params during execution', async () => {
    const dataFn = (data: {}, error: Error) => Promise.resolve({ data, error });
    const step = new Step(testName, successFn, dataFn);
    const output = await step.rollback(testOutput, new Error(errMessage));
    expect(output).toEqual({ data: testOutput, error: new Error(errMessage) });
  });
});

describe('#getStartFunction()', () => {
  it('should return the provided start function', () => {
    const step = new Step(testName, successFn, errorFn);
    expect(step.startFunction).toEqual(successFn);
  });
});

describe('#getRollbackFunction()', () => {
  it('should return the provided rollback function', () => {
    const step = new Step(testName, successFn, errorFn);
    expect(step.rollbackFunction).toEqual(errorFn);
  });
});

describe('#getOutput()', () => {
  it('should return the data output from the start method', async () => {
    const step = new Step(testName, successFn, successFn);
    const output = await step.start();
    expect(output).toEqual(testOutput);
    expect(output).toEqual(step.output);
  });
});

describe('#getRollbackFunction()', () => {
  it('should return the data output from the rollback method', async () => {
    const step = new Step(testName, successFn, successFn);
    const output = await step.rollback();
    expect(output).toEqual(testOutput);
    expect(output).toEqual(step.rollbackOutput);
  });
});
