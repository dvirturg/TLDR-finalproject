import express, { Express } from "express";
import mongoose from "mongoose";
import path from "path";
import { swaggerUi, swaggerSpec } from "./swagger";
import dotenv from "dotenv";
import postsRoute from "./routes/postsRoute";
import commentRoute from "./routes/commentRoute";
import chatRoute from "./routes/chatRoute";
import userRoute from "./routes/usersRoute";
import ragRoute from "./routes/ragRoute";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.dev",
});

const app = express();
const publicDir = path.resolve(process.cwd(), "public");
const uploadsDir = path.resolve(process.cwd(), "uploads");
const clientOrigin = process.env.CLIENT_ORIGIN || "https://localhost:5173";

app.use(express.json());
app.use("/public", express.static(publicDir));
app.use("/uploads", express.static(uploadsDir));

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TLDR API Documentation'
}));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", clientOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (_req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use("/api/post", postsRoute);
app.use("/api/comment", commentRoute);
app.use("/api/chat", chatRoute);
app.use("/api/user", userRoute);
app.use("/api/rag", ragRoute);


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
/*
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
*/
export default initApp;
