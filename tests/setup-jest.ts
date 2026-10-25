import { Response } from 'cross-fetch';

if (typeof globalThis.Response === 'undefined') {
  Object.assign(globalThis, { Response });
}
