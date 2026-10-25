import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export const requestLogger: RequestHandler = (request, response, next) => {
  const suppliedRequestId = request.header('x-request-id');
  const requestId =
    suppliedRequestId && requestIdPattern.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
  const startedAt = process.hrtime.bigint();

  response.setHeader('X-Request-Id', requestId);
  response.once('finish', () => {
    const statusCode = response.statusCode;
    const routePath =
      request.route && typeof request.route.path === 'string'
        ? `${request.baseUrl}${request.route.path}`
        : 'unmatched';
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      message: 'http_request',
      requestId,
      method: request.method,
      route: routePath,
      statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    });

    if (statusCode >= 500) {
      console.error(entry);
    } else if (statusCode >= 400) {
      console.warn(entry);
    } else {
      console.info(entry);
    }
  });

  next();
};
