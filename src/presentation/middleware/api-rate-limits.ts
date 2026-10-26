import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';

const rateLimitResponse = { error: 'Too many requests. Please try again later.' };
const fifteenMinutes = 15 * 60 * 1000;

export function createApiRateLimits() {
  const commonOptions = {
    windowMs: fifteenMinutes,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (_request: Request, response: Response) => {
      response.status(429).json(rateLimitResponse);
    },
  };

  return {
    login: rateLimit({
      ...commonOptions,
      limit: 5,
    }),
    api: rateLimit({
      ...commonOptions,
      limit: 100,
    }),
  };
}
