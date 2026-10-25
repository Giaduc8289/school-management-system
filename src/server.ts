import { createApp } from './app';
import { createConfiguredStudentRepository } from './infrastructure/repositories/student-repository.factory';

const portValue = process.env.PORT ?? '3000';
const port = Number(portValue);
if (
  !/^\d+$/.test(portValue) ||
  !Number.isSafeInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

createApp(createConfiguredStudentRepository()).listen(port, () => {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'server_started',
      port,
    }),
  );
});
