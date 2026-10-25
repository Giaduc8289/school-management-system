import type { Application } from 'express';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

const testSigningKey =
  'test-only-signing-key-that-is-not-for-production';
const adminAuthorization = `Bearer ${jwt.sign(
  { role: 'admin' },
  testSigningKey,
  {
    algorithm: 'HS256',
    subject: 'test-admin@example.test',
    expiresIn: 3600,
  },
)}`;

export function request(app: Application) {
  const client = supertest(app);
  return {
    get: (path: string) =>
      client.get(path).set('Authorization', adminAuthorization),
    post: (path: string) =>
      client.post(path).set('Authorization', adminAuthorization),
    put: (path: string) =>
      client.put(path).set('Authorization', adminAuthorization),
  };
}
