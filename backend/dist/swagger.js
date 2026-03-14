"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerUi = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const options = {
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
const completeOptions = {
    definition: {
        openapi: '3.0.0',
        info: options.definition.info,
        servers: options.definition.servers,
        components: options.definition.components,
        tags: options.definition.tags
    },
    apis: [] // No need for file parsing since we have manual paths
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(completeOptions);
exports.swaggerSpec = swaggerSpec;
