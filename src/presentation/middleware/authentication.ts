import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { AccessTokenService } from '../../application/ports/access-token.service.interface';

export const authentication = (
  accessTokens: AccessTokenService,
): RequestHandler => (request, response, next) => {
  const authorization = request.header('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    response.status(401).json({ error: 'Authentication is required.' });
    return;
  }

  try {
    const identity = accessTokens.verify(match[1]);
    response.locals.authenticatedUser = identity;
    next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError
    ) {
      response.status(401).json({ error: 'Invalid or expired access token.' });
      return;
    }
    next(error);
  }
};
