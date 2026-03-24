import express, { Express } from "express";
import mongoose from "mongoose";
import path from "path";
import { swaggerUi, swaggerSpec } from "./swagger";
import dotenv from "dotenv";
import postsRoute from "./routes/postsRoute";
import commentRoute from "./routes/commentRoute";
import userRoute from "./routes/usersRoute";

dotenv.config({ path: ".env.dev" });

const app = express();
const publicDir = path.resolve(__dirname, "..", "public");

app.use(express.json());
app.use("/public", express.static(publicDir));
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
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
app.use("/api/post", postsRoute);
app.use("/api/comment", commentRoute);
app.use("/api/user", userRoute);


// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


const initApp = () => {
  const pr = new Promise<Express>((resolve, reject) => {
    const dbUrl = process.env.MONGO_URI;
    if (!dbUrl) {
      reject("MONGO_URI is not defined");
      return;
    }
    mongoose
      .connect(dbUrl, {})
      .then(() => {
        resolve(app);
      });
    const db = mongoose.connection;
    db.on("error", (error) => {
      if (process.env.NODE_ENV !== "test") console.error(error);
    });
    db.once("open", () => {
      if (process.env.NODE_ENV !== "test") console.log("Connected to Database");
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

export default initApp;
