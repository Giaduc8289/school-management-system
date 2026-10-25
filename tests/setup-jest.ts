import { Response } from 'cross-fetch';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    'test-only-signing-key-that-is-not-for-production';
}

if (typeof globalThis.Response === 'undefined') {
  Object.assign(globalThis, { Response });
}
