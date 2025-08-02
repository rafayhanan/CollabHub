import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CollabHub API',
    version: '1.0.0',
    description: 'Production-ready backend with JWT Auth',
  },
  servers: [
    {
      url: 'http://localhost:3000', // change to your deployed domain in prod
      description: 'Local dev server',
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
