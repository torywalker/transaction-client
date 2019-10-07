const Step = require('./steps/step');

module.exports = class TransactionClient {
  /**
   * Create a transaction client
   */
  constructor() {
    this.steps = [];
    this.completedSteps = [];
  }

  /**
   * Roll back all steps that have already been committed
   * @param {object} data - All step data accumulated up to this point
   * @param {string} error - Optional error message
   * @returns {object} { errors, steps } errors encountered and steps executed during rollback
   */
  async _rollback(data, error) {
    if (this.completedSteps.length) {
      const rollbackErrors = [];
      const rollbackSteps = [];

      // Execute each rollback step in order
      for (const step of this.completedSteps) {
        rollbackSteps.push(step.getName());
        await step.rollback(data, error).catch((e) => {
          rollbackErrors.push(e);
        });
      }

      return { rollbackErrors, rollbackSteps };
    }

    return {};
  }

  /**
   * Start transaction, executing all steps that have been added
   * @param {object} configuration - Configuration object
   * @param {boolean} configuration.checkErrors - Handle error checking within this method by throwing Error
   * @returns {object} Contains accumulated data from steps and rollback info
   */
  async start(configuration = {}) {
    const { checkErrors = false } = configuration;
    let rollbackErrors = [];
    let rollbackSteps = [];
    let rollbackInitiator;
    let accumulator = {};

    for (const step of this.steps) {
      // Add completed step to list so we can rollback if needed
      this.completedSteps.unshift(step);

      // Set error if we fail to execute rollback on step failure
      const stepData = await step.start(accumulator).catch(async (e) => {
        rollbackInitiator = step.getName();
        ({ rollbackErrors, rollbackSteps } = await this._rollback(accumulator, e));
      });

      // Merge step data with rest of data (flat structure)
      accumulator = Object.assign({}, accumulator, stepData);

      // Handle rollback data and associated errors
      if (rollbackSteps.length) {
        accumulator.rolledBack = true;
        accumulator.rollbackSteps = rollbackSteps;

        if (rollbackErrors.length) accumulator.rollbackErrors = rollbackErrors;
        if (rollbackInitiator) accumulator.rollbackInitiator = rollbackInitiator;

        break; // Stop execution of steps
      }
    }

    if (checkErrors && accumulator.rolledBack) {
      throw new Error(
        `The following steps were rolled back: [${accumulator.rollbackSteps}]. Rollback was initiated by: ${accumulator.rollbackInitiator}`,
      );
    }

    return accumulator;
  }

  /**
   * Add a step to the collection of steps to run
   * @param {Step} step - An instance of a step
   * @returns {TransactionClient} To make the method chainable
   */
  addStep(step) {
    if (!(step instanceof Step)) {
      throw new Error('Only objects of type Step can be added to the client');
    }
    this.steps.push(step);
    return this;
  }

  /**
   * Return all steps that will be ran during a transaction
   * @param {Step} instance of a step
   * @returns {array} All of the steps that will be ran at start time
   */
  getSteps() {
    return this.steps;
  }

  /**
   * Return all steps that have been completed
   * @param {Step} instance of a step
   * @returns {array} All of the steps that have been ran
   */
  getCompletedSteps() {
    return this.completedSteps;
  }
};
