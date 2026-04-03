import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { postPaths, postSchemas, postTags } from "./docs/post.swagger";
import { commentPaths, commentSchemas, commentTags } from "./docs/comment.swagger";
import { userSchemas, userPaths, userTags } from "./docs/user.swagger";
import { chatPaths, chatSchemas, chatTags } from "./docs/chat.swagger";

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TL;DR API",
      version: "1.0.0",
      description: "API documentation for the TL;DR social networking app",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token below",
        },
      },
      schemas: {
        ...chatSchemas,
        ...commentSchemas,
        ...postSchemas,
        ...userSchemas, 
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      ...chatPaths,
      ...commentPaths,
      ...postPaths,
      ...userPaths, 
    },
    tags: [
      ...chatTags,
      ...commentTags, 
      ...postTags, 
      ...userTags 
    ],
  },
  apis: [],
});

export { swaggerUi, swaggerSpec };
