const { validateProperty } = require('./helpers');
const log = require('../../util/logger');

module.exports = class Step {
  /**
   * Create a step
   * @param {string} name - A human readable description of the step.
   * @param {function} fnToExecute - A promise that will execute when the step is started
   * @param {function} fnToRollback - A promise that will execute when the step is rolled back
   */
  constructor(name, fnToExecute, fnToRollback = async () => {}) {
    this.name = validateProperty(name, 'name', 'string');
    this.fnToExecute = validateProperty(fnToExecute, 'fnToExecute', 'function');
    this.fnToRollback = validateProperty(fnToRollback, 'fnToRollback', 'function');
    this.output = null;
    this.rollbackOutput = null;
  }

  /**
   * Start step, and throw an error if function fails
   * @param {*} data - any data that is required for this step to start
   * @throws {Error}
   * @returns {*} Value returned after successful start
   */
  async start(data) {
    this.output = await Promise.resolve(this.fnToExecute(data)).catch((e) => {
      log.error(e);
      throw new Error(`Step ${this.name} failed to execute. Additional Error: ${e}`);
    });

    return this.output;
  }

  /**
   * Start step, and throw an error if function fails
   * @param {Error} Optional error message
   * @throws {Error}
   * @returns {*} Value returned after successful rollback
   */
  async rollback(data, error) {
    log.error(error);
    this.rollbackOutput = await Promise.resolve(this.fnToRollback(data, error)).catch((e) => {
      log.error(e);
      throw new Error(`Unable to roll back step ${this.name}. Error: ${e}`);
    });

    return this.rollbackOutput;
  }

  /**
   * Get name of the step
   * @returns {string} this.name
   */
  getName() {
    return this.name;
  }

  /**
   * Get fnToExecute that was provided in constructor
   * @returns {*} this.fnToExecute
   */
  getStartFunction() {
    return this.fnToExecute;
  }

  /**
   * Get fnToRollback that was provided in constructor
   * @returns {*} this.fnToRollback
   */
  getRollbackFunction() {
    return this.fnToRollback;
  }

  /**
   * Get data returned from executing the start function
   * @returns {*} this.output
   */
  getOutput() {
    return this.output;
  }

  /**
   * Get data returned from executing the rollback function
   * @returns {*} this.rollbackOutput
   */
  getRollbackOutput() {
    return this.rollbackOutput;
  }
};
