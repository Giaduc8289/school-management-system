import { createApp } from './app';
import { createConfiguredStudentRepository } from './infrastructure/repositories/student-repository.factory';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

createApp(createConfiguredStudentRepository()).listen(port, () => {
  console.log(`Student API listening on port ${port}.`);
});
