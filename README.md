# TLDR Final Project

TLDR is a full-stack social platform built with a TypeScript backend and a React frontend. The application includes user authentication, posts, comments, likes, real-time chat, AI-powered search, recommendations, and a backend RAG pipeline using Gemini embeddings with MongoDB storage.

This repository contains two main applications:

- `backend/` - Express, TypeScript, MongoDB, JWT authentication, Socket.IO, Swagger, AI/RAG services.
- `frontend/` - React, Vite, TypeScript, Bootstrap, client routing, authentication flow, posts, search, recommendations, and chat UI.

For detailed documentation, see:

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## Main Features

- Email/password and Google authentication.
- JWT access tokens and refresh token rotation.
- Post CRUD with image upload.
- Comments and likes.
- Personalized recommendations.
- AI-powered post search.
- RAG over post content using Gemini embeddings.
- MongoDB storage for users, posts, comments, chat messages, and post embeddings.
- Real-time chat with Socket.IO.
- Swagger API documentation.

## Project Structure

```text
.
├── backend/        # API server, database models, AI/RAG logic, tests
├── frontend/       # React client application
├── images/         # Local image assets used by the project
└── README.md       # Project-level overview
```

## Prerequisites

- Node.js 18 or newer.
- npm.
- MongoDB running locally or a MongoDB connection string.
- Gemini API key for embeddings and AI features.
- HTTPS local certificates expected by the backend/frontend dev setup.

## Environment

Backend environment files live inside `backend/`.

Common required values:

```env
MONGO_URI=mongodb://localhost:27017/tldr_test
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_ORIGIN=https://localhost:5173

GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=768
GEMINI_EMBEDDING_TIMEOUT_MS=15000

RAG_TOP_K=5
RAG_MIN_SCORE=0.72
RAG_RECOMMENDATION_MIN_SCORE=0.45
RAG_CHUNK_SIZE=900
RAG_CHUNK_OVERLAP=120
```

Frontend environment is documented in `frontend/README.md`.

## Install

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Backend API: `https://localhost:5000`
- Frontend: `https://localhost:5173`
- Swagger docs: `https://localhost:5000/api-docs`

## Build and Test

Backend:

```bash
cd backend
npm run build
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

## Notes for Submission

- Backend source code is TypeScript.
- AI provider keys must stay server-side.
- Generated folders such as `dist`, `build`, `coverage`, and `node_modules` should not be committed.
- Run backend tests and build before final submission.
