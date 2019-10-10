import { log, validateProperty } from './helpers';

export default class Step {
  private _name: string;
  private _fnToExecute: Function;
  private _fnToRollback: Function;
  private _output: {};
  private _rollbackOutput: {};

  /**
   * Create a step
   * @param {string} name - A human readable description of the step.
   * @param {Function} fnToExecute - A promise that will execute when the step is started
   * @param {Function} fnToRollback - A promise that will execute when the step is rolled back
   */
  constructor(name: string, fnToExecute: Function, fnToRollback: Function = async () => {}) {
    this._name = validateProperty<string>(name, 'name', 'string');
    this._fnToExecute = validateProperty(fnToExecute, 'fnToExecute', 'function');
    this._fnToRollback = validateProperty(fnToRollback, 'fnToRollback', 'function');
    this._output = {};
    this._rollbackOutput = {};
  }

  /**
   * Start step, and throw an error if function fails
   * @param {*} [data] - data that is required for this step to start
   * @throws {Error}
   * @returns {*} Value returned after successful start
   */
  async start(data?: {}): Promise<{}> {
    this._output = await Promise.resolve(this._fnToExecute(data)).catch(e => {
      log.error(e);
      throw new Error(`Step ${this._name} failed to execute. Additional Error: ${e}`);
    });

    return this._output;
  }

  /**
   * Start step, and throw an error if function fails
   * @param {*} [data] accumulated data before rollback
   * @param {Error|string} [error] error object
   * @throws {Error}
   * @returns {*} Value returned after successful rollback
   */
  async rollback(data?: {}, error?: Error | string): Promise<{}> {
    error && log.error(error);

    this._rollbackOutput = await Promise.resolve(this._fnToRollback(data, error)).catch(e => {
      log.error(e);
      throw new Error(`Unable to roll back step ${this._name}. Error: ${e}`);
    });

    return this._rollbackOutput;
  }

  /**
   * Get name of the step
   * @returns {string} this._name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get fnToExecute that was provided in constructor
   * @returns {Function} this._fnToExecute
   */
  get startFunction(): Function {
    return this._fnToExecute;
  }

  /**
   * Get fnToRollback that was provided in constructor
   * @returns {Function} this._fnToRollback
   */
  get rollbackFunction(): Function {
    return this._fnToRollback;
  }

  /**
   * Get data returned from executing the start function
   * @returns {Object} this.output
   */
  get output(): {} {
    return this._output;
  }

  /**
   * Get data returned from executing the rollback function
   * @returns {Object} this.rollbackOutput
   */
  get rollbackOutput(): {} {
    return this._rollbackOutput;
  }
}
