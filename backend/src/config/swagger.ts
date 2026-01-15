import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const serverUrl = isProduction
  ? (process.env.BACKEND_URL || 'https://collab-hub-backend.up.railway.app')
  : `http://localhost:${process.env.PORT || 3000}`;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CollabHub API',
    version: '1.0.0',
    description: 'Production-ready backend with JWT Auth',
  },
  servers: [
    {
      url: serverUrl,
      description: isProduction ? 'Production server' : 'Local dev server',
    },
  ],
  components: {
    schemas: {
      AuthInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'User password',
          },
        },
      },
      CreateProjectInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'The name of the project',
            example: 'New Website Launch',
          },
          description: {
            type: 'string',
            description: 'A brief description of the project',
            example: 'This project is for the new company website.',
          },
        },
      },
      UpdateProjectInput: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the project',
            example: 'New Website Launch V2',
          },
          description: {
            type: 'string',
            description: 'A brief description of the project',
            example: 'This project is for the new company website, with new features.',
          },
        },
      },
      SendInvitationInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address of the user to invite',
            example: 'user@example.com',
          },
        },
      },
      CreateTaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            description: 'The title of the task',
            example: 'Design the homepage',
          },
          description: {
            type: 'string',
            description: 'A detailed description of the task',
            example: 'Create a wireframe and a high-fidelity mockup.',
          },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'DONE'],
            description: 'The current status of the task',
            example: 'TODO',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'The optional due date for the task',
            example: '2024-12-31T23:59:59.000Z',
          },
          assignments: {
            type: 'array',
            description: 'Optional at-creation assignments (owner only).',
            items: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                note: { type: 'string', description: 'Optional per-assignee description' },
              },
            },
            example: [
              { userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', note: 'Implement hero section' },
            ],
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts'], // Path to your route files
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
