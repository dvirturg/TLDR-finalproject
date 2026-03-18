import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TL;DR API',
      version: '1.0.0',
      description: 'API documentation for the TL;DR social networking app',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token below',
        },
      },
    },
    // Global security requirement (optional, can also be applied per-route)
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Scan these files for JSDoc/Swagger comments
  apis: ['./src/routes/*.ts', './src/models/*.ts'], 
};

const completeOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: options.definition!.info!,
        servers: options.definition!.servers,
        components: options.definition!.components,
        tags: options.definition!.tags
    },
    apis: [] // No need for file parsing since we have manual paths
};

const swaggerSpec = swaggerJsdoc(completeOptions);
export { swaggerUi, swaggerSpec };