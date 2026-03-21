"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const swagger_1 = require("./swagger");
const dotenv_1 = __importDefault(require("dotenv"));
const postsRoute_1 = __importDefault(require("./routes/postsRoute"));
dotenv_1.default.config({ path: ".env.dev" });
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Swagger UI setup
app.use("/api-docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TLDR API Documentation'
}));
app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    next();
});
// Routes
app.use("/api/post", postsRoute_1.default);
// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
const initApp = () => {
    const pr = new Promise((resolve, reject) => {
        const dbUrl = process.env.MONGO_URI;
        if (!dbUrl) {
            reject("MONGO_URI is not defined");
            return;
        }
        mongoose_1.default
            .connect(dbUrl, {})
            .then(() => {
            resolve(app);
        });
        const db = mongoose_1.default.connection;
        db.on("error", (error) => {
            if (process.env.NODE_ENV !== "test")
                console.error(error);
        });
        db.once("open", () => {
            if (process.env.NODE_ENV !== "test")
                console.log("Connected to Database");
        });
    });
    return pr;
};
// Start the app and handle errors
if (process.env.NODE_ENV !== "test") {
    initApp()
        .then((app) => {
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
        .catch((err) => {
        console.error("Failed to start app:", err);
        process.exit(1);
    });
}
exports.default = initApp;
