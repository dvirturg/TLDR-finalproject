"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerUi = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const post_swagger_1 = require("./docs/post.swagger");
const swaggerSpec = (0, swagger_jsdoc_1.default)({
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
                ...post_swagger_1.postSchemas,
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        paths: {
            ...post_swagger_1.postPaths,
        },
        tags: [...post_swagger_1.postTags],
    },
    apis: [],
});
exports.swaggerSpec = swaggerSpec;
