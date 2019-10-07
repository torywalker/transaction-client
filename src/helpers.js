module.exports = {
  /**
   * Validate properties that are passed into the constructor
   * @param {*} property - The property taht will be evaluated
   * @param {string} name - Name to display if validation fails
   * @param {string|Array} type - The expected type of the value, or an array of types
   * @throws {TypeError}
   * @returns {*} The property that was originally passed in
   */
  validateProperty(property, name, type) {
    if (
      (typeof type === 'string' && typeof property !== type) || // eslint-disable-line
      (Array.isArray(type) && !type.includes(typeof property)) // eslint-disable-line
    ) {
      throw new TypeError(`Invalid value provided for ${name} while initalizing class`);
    }
    return property;
  },
};
