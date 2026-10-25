const errorResponse = {
  description: 'Request failed.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

const studentSchema = {
  type: 'object',
  required: [
    'id',
    'code',
    'fullName',
    'email',
    'dateOfBirth',
    'status',
  ],
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    fullName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    dateOfBirth: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['active', 'inactive'] },
  },
};

const studentRequestSchema = {
  type: 'object',
  required: ['id', 'code', 'fullName', 'email', 'dateOfBirth'],
  properties: {
    id: { type: 'string', minLength: 1 },
    code: { type: 'string', pattern: '^STU-\\d{4}-\\d{4}$' },
    fullName: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    dateOfBirth: { type: 'string', format: 'date-time' },
  },
};

const authenticatedResponses = {
  '401': errorResponse,
  '403': errorResponse,
};

const securedOperation = {
  security: [{ bearerAuth: [] }],
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'School Management API',
    version: '1.0.0',
    description: 'API for staff authentication and student management.',
  },
  servers: [{ url: '/' }],
  paths: {
    '/health': {
      get: {
        summary: 'Legacy health status',
        responses: {
          '200': {
            description: 'The process is running.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
              },
            },
          },
        },
      },
    },
    '/health/live': {
      get: {
        summary: 'Check process liveness',
        responses: {
          '200': {
            description: 'The process is alive.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        summary: 'Check required dependency readiness',
        responses: {
          '200': {
            description: 'Required dependencies are ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
              },
            },
          },
          '503': {
            description: 'A required dependency is unavailable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UnavailableStatus' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate a staff member',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 0 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentication succeeded.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '400': errorResponse,
          '401': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/students': {
      get: {
        ...securedOperation,
        summary: 'List students',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'inactive'] },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', minLength: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'A paginated student list.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudentList' },
              },
            },
          },
          '400': errorResponse,
          ...authenticatedResponses,
          '500': errorResponse,
        },
      },
      post: {
        ...securedOperation,
        summary: 'Create a student',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: studentRequestSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'The student was created.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Student' },
              },
            },
          },
          '400': errorResponse,
          ...authenticatedResponses,
          '409': errorResponse,
          '500': errorResponse,
        },
      },
    },
    '/students/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', minLength: 1 },
        },
      ],
      get: {
        ...securedOperation,
        summary: 'Get a student by ID',
        responses: {
          '200': {
            description: 'The requested student.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Student' },
              },
            },
          },
          ...authenticatedResponses,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
      put: {
        ...securedOperation,
        summary: 'Update a student profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateStudentRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'The student profile was updated.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Student' },
              },
            },
          },
          '400': errorResponse,
          ...authenticatedResponses,
          '404': errorResponse,
          '500': errorResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: { error: { type: 'string' } },
      },
      HealthStatus: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['ok'] } },
      },
      UnavailableStatus: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['unavailable'] } },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 0 },
        },
      },
      LoginResponse: {
        type: 'object',
        required: ['accessToken', 'tokenType', 'expiresIn', 'role'],
        properties: {
          accessToken: { type: 'string' },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresIn: { type: 'integer', minimum: 1, maximum: 3600 },
          role: { type: 'string', enum: ['admin', 'staff'] },
        },
      },
      Student: studentSchema,
      CreateStudentRequest: studentRequestSchema,
      UpdateStudentRequest: {
        type: 'object',
        required: ['fullName', 'email'],
        properties: {
          fullName: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
        },
      },
      StudentList: {
        type: 'object',
        required: ['items', 'page', 'pageSize', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100 },
          total: { type: 'integer', minimum: 0 },
        },
      },
    },
  },
} as const;
