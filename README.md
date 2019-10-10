# Transaction Client

## Description

A transaction client to ensure all logical steps in an atomic transaction are completed or rolled back

## Use

### Install

```bash
yarn add transaction-client
```

### Example

```javascript
import { TransactionClient, TransactionStep } from 'transaction-client';

const client = new TransactionClient();

const getFirstTodoItem = new TransactionStep('fetchRoleFromDb', async () => ({
  todo1: await fetch('https://jsonplaceholder.typicode.com/todos/1'),
}));

const getSecondTodoItem = new TransactionStep('fetchRoleFromDb', async () => ({
  todo2: await fetch('https://jsonplaceholder.typicode.com/todos/2'),
}));

const data = client
  .addStep(getFirstTodoItem)
  .addStep(getSecondTodoItem)
  .start({ checkErrors: true })
  .then(({ todo1, todo2 }) => {
    console.log({ todo1, todo2 });
  });
```

## Development

### Dependencies

The following dependencies must be available on your machine:

- node @ ^8.10.0 || ^10.13.0 || >=11.10.1
- yarn @ ^1.17

### Local Setup

1. Run `yarn install` to install package dependencies
1. Run `yarn test` to ensure that tests are passing
1. Run `yarn dev` to build TypeScript with hot reloading
1. Make changes to package

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for code of conduct details, and the process for submitting pull requests.

## License

This project is licensed under the GNU 3 License - see the [LICENSE](LICENSE) file for details
