import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../openapi';

export function createApiDocumentationRouter(): Router | undefined {
  const configuration = process.env.API_DOCS_ENABLED?.trim().toLowerCase();
  if (
    configuration !== undefined &&
    configuration !== 'true' &&
    configuration !== 'false'
  ) {
    throw new Error('API_DOCS_ENABLED must be either true or false.');
  }

  if (process.env.NODE_ENV === 'production' || configuration === 'false') {
    return undefined;
  }

  const router = Router();
  router.get('/openapi.json', (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  const swaggerUiOptions = {
    swaggerUrl: '/openapi.json',
    customSiteTitle: 'School Management API Documentation',
    customJsStr: 'window.schoolManagementOpenApiUrl = "/openapi.json";',
  };
  const documentationHtml = swaggerUi
    .generateHTML(undefined, swaggerUiOptions)
    .replace('<head>', '<head>\n  <base href="/docs/">');
  router.get('/docs', (_request, response) => {
    response.status(200).type('html').send(documentationHtml);
  });
  router.use('/docs', swaggerUi.serve);

  return router;
}
