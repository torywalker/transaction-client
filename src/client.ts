import Step from './step';

export type ClientResult = {
  rolledBack: boolean;
  rollbackErrors?: Error[];
  rollbackSteps?: string[];
  rollbackInitiator?: string;
  [key: string]: any;
};

export default class Client {
  private _steps: Step[];
  private _completedSteps: Step[];

  /**
   * Create a transaction client
   */
  constructor() {
    this._steps = [];
    this._completedSteps = [];
  }

  /**
   * Roll back all steps that have already been committed
   * @param {object} data - All step data accumulated up to this point
   * @param {Error} error - Optional error message
   * @returns {object} { errors, steps } errors encountered and steps executed during rollback
   */
  async _rollback(
    data: {},
    error: Error | string
  ): Promise<{ rollbackErrors: Error[]; rollbackSteps: string[] }> {
    const rollbackErrors: Error[] = [];
    const rollbackSteps: string[] = [];

    if (this._completedSteps.length) {
      // Execute each rollback step in order
      for (const step of this._completedSteps) {
        rollbackSteps.push(step.name);
        await step.rollback(data, error).catch(e => {
          const rollbackError = e instanceof Error ? e : new Error(e || 'Undefined Error');
          rollbackErrors.push(rollbackError);
        });
      }
    }

    return { rollbackErrors, rollbackSteps };
  }

  /**
   * Start transaction, executing all steps that have been added
   * @param {object} configuration - Configuration object
   * @param {boolean} configuration.checkErrors - Handle error checking within this method by throwing Error
   * @returns {object} Contains accumulated data from steps and rollback info
   */
  async start(configuration = { checkErrors: false }): Promise<ClientResult> {
    const { checkErrors } = configuration;
    let rollbackErrors: Error[] = [];
    let rollbackSteps: string[] = [];
    let rollbackInitiator = '';
    let accumulator: ClientResult = {
      rolledBack: false,
    };

    for (const step of this._steps) {
      // Add completed step to list so we can rollback if needed
      this._completedSteps.unshift(step);

      // Set error if we fail to execute rollback on step failure
      const stepData = await step.start(accumulator).catch(async e => {
        rollbackInitiator = step.name;
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
        `The following steps were rolled back: [${accumulator.rollbackSteps}]. Rollback was initiated by: ${accumulator.rollbackInitiator}`
      );
    }

    return accumulator;
  }

  /**
   * Add a step to the collection of steps to run
   * @param {Step} step - An instance of a step
   * @returns {Client} To make the method chainable
   */
  addStep(step: Step): this {
    if (!(step instanceof Step)) {
      throw new Error('Only objects of type Step can be added to the client');
    }
    this._steps.push(step);
    return this;
  }

  /**
   * Return all steps that will be ran during a transaction
   * @param {Step} instance of a step
   * @returns {array} All of the steps that will be ran at start time
   */
  get steps(): Step[] {
    return this._steps;
  }

  /**
   * Return all steps that have been completed
   * @param {Step} instance of a step
   * @returns {array} All of the steps that have been ran
   */
  get completedSteps(): Step[] {
    return this._completedSteps;
  }
}
