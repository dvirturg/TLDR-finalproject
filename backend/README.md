# 🔧 TLDR Backend API - Express.js + MongoDB

Production-ready REST API and WebSocket server for the TLDR social platform, built with Express.js, TypeScript, MongoDB, and Socket.IO.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Authentication & Security](#authentication--security)
- [Real-Time Features](#real-time-features)
- [AI & Recommendations](#ai--recommendations)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The TLDR backend is a sophisticated REST API server that:
- Manages user authentication with JWT and refresh tokens
- Handles post/comment/chat CRUD operations
- Provides AI-powered recommendation engine
- Enables real-time messaging via Socket.IO
- Serves comprehensive Swagger API documentation
- Runs comprehensive automated tests

**Status**: ✅ Production-Ready  
**Test Coverage**: 5 comprehensive test suites (all passing)  
**TypeScript**: Strict mode enabled  
**Node.js**: v18+

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | v18+ |
| **Framework** | Express.js | 5.x |
| **Language** | TypeScript | 5.9+ |
| **Database** | MongoDB | 5.0+ |
| **ODM** | Mongoose | 9.3+ |
| **Real-Time** | Socket.IO | 4.8+ |
| **Testing** | Jest | 29.7+ |
| **HTTP Testing** | Supertest | 7.2+ |
| **Authentication** | jsonwebtoken | 9.0+ |
| **Password Hash** | bcrypt | 6.0+ |
| **File Upload** | multer | 2.1+ |
| **OAuth** | google-auth-library | 10.6+ |
| **API Docs** | Swagger/OpenAPI | 6.2+ |

---

## 📁 Project Structure

```
backend/
│
├── src/
│   ├── index.ts                    # Application entry point (port setup)
│   ├── server.ts                   # Server startup with DB connection
│   ├── socket.ts                   # Socket.IO real-time handler
│   ├── swagger.ts                  # Swagger/OpenAPI specification
│   │
│   ├── controllers/                # REQUEST HANDLERS (Business Logic)
│   │   ├── userController.ts       # Auth, token refresh, profiles
│   │   │   ├── register()          - Email/password registration
│   │   │   ├── login()             - Authenticate user
│   │   │   ├── googleLogin()       - OAuth2 authentication
│   │   │   ├── refresh()           - Token rotation
│   │   │   ├── logout()            - Invalidate tokens
│   │   │   └── getUserProfile()    - User data retrieval
│   │   │
│   │   ├── postController.ts       # Posts: CRUD, likes, recommendations
│   │   │   ├── createPost()        - Create new post
│   │   │   ├── getAllPosts()       - Paginated feed
│   │   │   ├── getPostById()       - Single post
│   │   │   ├── updatePostById()    - Edit post
│   │   │   ├── deletePostById()    - Remove post
│   │   │   ├── likePost()          - Toggle like
│   │   │   ├── searchPosts()       - Full-text search
│   │   │   └── getRecommendedPosts() - AI recommendations
│   │   │
│   │   ├── commentController.ts    # Comments: CRUD operations
│   │   │   ├── createComment()     - Add comment
│   │   │   ├── updateComment()     - Edit comment
│   │   │   └── deleteComment()     - Remove comment
│   │   │
│   │   └── chatController.ts       # Chat: conversations & messages
│   │       ├── getConversations()  - List chat threads
│   │       ├── getChatHistory()    - Message history
│   │       └── markAsRead()        - Update read status
│   │
│   ├── routes/                     # EXPRESS ROUTES (Endpoint Mapping)
│   │   ├── usersRoute.ts           # /api/user/*
│   │   ├── postsRoute.ts           # /api/post/*
│   │   ├── commentRoute.ts         # /api/comment/*
│   │   └── chatRoute.ts            # /api/chat/*
│   │
│   ├── models/                     # DATA LAYER (Mongoose Schemas)
│   │   ├── userModel.ts
│   │   │   ├── IUser interface
│   │   │   ├── username: unique
│   │   │   ├── email: unique
│   │   │   ├── password: hashed
│   │   │   ├── authProvider: local|google
│   │   │   ├── refreshTokens: array (for rotation)
│   │   │   └── Pre-save hook for bcrypt
│   │   │
│   │   ├── postModel.ts
│   │   │   ├── text: required
│   │   │   ├── imageUrl: optional
│   │   │   ├── author: User ref
│   │   │   ├── likes: User[] refs
│   │   │   └── timestamps
│   │   │
│   │   ├── commentModel.ts
│   │   │   ├── text: required
│   │   │   ├── postId: Post ref
│   │   │   ├── author: User ref
│   │   │   └── timestamps
│   │   │
│   │   └── chatModel.ts
│   │       ├── sender: User ref
│   │       ├── recipient: User ref
│   │       ├── message: text
│   │       ├── read: boolean
│   │       └── timestamps
│   │
│   ├── services/                   # BUSINESS LOGIC LAYER
│   │   ├── authService.ts          # Core authentication logic
│   │   │   ├── generateTokens()    - JWT creation
│   │   │   ├── verifyGoogleIdToken() - OAuth validation
│   │   │   ├── buildAuthResponse() - Response formatting
│   │   │   └── Google client setup
│   │   │
│   │   ├── llmService.ts           # AI recommendations
│   │   │   ├── getRecommendations() - Intelligent ranking
│   │   │   ├── analyzeUserPreferences() - Profile building
│   │   │   └── calculateRelevanceScore() - Scoring algorithm
│   │   │
│   │   └── searchService.ts        # Full-text search
│   │       ├── searchPosts()       - Text matching
│   │       └── fuzzyMatch()        - Flexible search
│   │
│   ├── middleware/                 # EXPRESS MIDDLEWARE
│   │   ├── authenticate.ts         # JWT verification
│   │   │   └── Extracts userId from token
│   │   │
│   │   └── postImageUpload.ts      # Multer file upload
│   │       ├── Memory storage
│   │       ├── File validation
│   │       └── Size limits
│   │
│   ├── utils/                      # HELPER FUNCTIONS
│   │   ├── authUtils.ts
│   │   │   ├── verifyRefreshToken() - Token validation
│   │   │   └── Token parsing
│   │   │
│   │   └── postSerializer.ts       # DTO transformation
│   │       └── toPostDTO()         - Response formatting
│   │
│   ├── types/                      # TYPESCRIPT INTERFACES
│   │   └── auth.ts
│   │       ├── AuthResponse
│   │       ├── AuthUser
│   │       ├── GoogleProfile
│   │       └── JwtPayload
│   │
│   ├── tests/                      # JEST TEST SUITES
│   │   ├── user.test.ts            # Auth endpoints (10+ tests)
│   │   ├── post.test.ts            # Post operations (12+ tests)
│   │   ├── comment.test.ts         # Comment CRUD (8+ tests)
│   │   ├── search.test.ts          # Search functionality (6+ tests)
│   │   └── socket.test.ts          # WebSocket events (5+ tests)
│   │
│   ├── scripts/                    # UTILITY SCRIPTS
│   │   ├── seedMockUsers.ts        # Generate test users
│   │   └── seedMockPosts.ts        # Generate test posts
│   │
│   └── docs/                       # SWAGGER API SPECS
│       ├── user.swagger.ts         # Auth endpoints
│       ├── post.swagger.ts         # Post endpoints
│       ├── comment.swagger.ts      # Comment endpoints
│       └── chat.swagger.ts         # Chat endpoints
│
├── jest.config.ts                  # Jest configuration
├── jest.setup.ts                   # Test environment setup
├── tsconfig.json                   # TypeScript compiler options
├── tsconfig.test.json              # Test-specific TS config
│
├── package.json                    # Dependencies & scripts
├── .env                            # Dev environment variables
├── .env.production                 # Prod environment variables
│
├── dist/                           # Compiled JavaScript (generated)
├── uploads/                        # User-uploaded files
│   └── posts/                      # Post images
│
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites
```bash
# Check Node.js version
node --version    # Should be v18+
npm --version

# Check MongoDB is accessible
# Local: mongod running, or
# Cloud: MongoDB Atlas connection string ready
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Configure environment (see Configuration section)
# Edit .env with your database URI and secrets

# 4. Seed sample data (optional)
npm run seed:posts

# 5. Start development server
npm run dev
```

### Scripts

```bash
npm run dev              # Start with nodemon (auto-reload)
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled server (production)
npm test                 # Run all Jest tests
npm run seed:posts       # Populate DB with mock data
```

---

## ⚙️ Configuration

### Environment Variables

#### Development (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/tldr

# JWT Secrets (use strong random strings)
JWT_SECRET=your-random-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-random-refresh-secret-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Optional: LLM API for recommendations
OPENAI_API_KEY=sk-... (optional)
```

#### Production (.env.production)
```env
NODE_ENV=production
PORT=5000
LOG_LEVEL=error

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tldr

# Use secure secrets from environment
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Production domain
CLIENT_ORIGIN=https://node92.cs.colman.ac.il
```

### TypeScript Configuration

Key compiler options in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["jest", "node"]
  }
}
```

---

## 📡 API Endpoints

All endpoints require authentication via JWT token in `Authorization: Bearer <token>` header.

### User Authentication

#### Register
```http
POST /api/user/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 201:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 200: (same as register)
```

#### Google OAuth Login
```http
POST /api/user/google-login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2OTc4ZjFjNDUxZTdmNzI..."
}

Response 201: (same as register)
```

#### Refresh Tokens
```http
POST /api/user/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200:
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

#### Logout
```http
POST /api/user/logout
Authorization: Bearer <accessToken>

Response 200:
{
  "message": "Logged out successfully"
}
```

#### Get User Profile
```http
GET /api/user/:userId
Authorization: Bearer <accessToken>

Response 200:
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com",
  "profileUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Posts

#### Create Post
```http
POST /api/post
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

text: "Check out this amazing summary..."
image: <file>

Response 201:
{
  "id": "507f1f77bcf86cd799439012",
  "text": "Check out this amazing summary...",
  "imageUrl": "https://...",
  "author": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe"
  },
  "likes": [],
  "likeCount": 0,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Feed
```http
GET /api/post?page=1&limit=10
Authorization: Bearer <accessToken>

Response 200:
{
  "data": [
    { post objects... },
  ],
  "total": 45,
  "pages": 5,
  "currentPage": 1
}
```

#### Get Single Post
```http
GET /api/post/:postId
Authorization: Bearer <accessToken>

Response 200:
{
  id: "...",
  text: "...",
  author: { ... },
  likes: [ { id, username }, ... ],
  likeCount: 5,
  commentCount: 3,
  isLiked: false,
  createdAt: "..."
}
```

#### Update Post
```http
PUT /api/post/:postId
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

text: "Updated summary..."
image: <optional-file>

Response 200: (updated post object)
```

#### Delete Post
```http
DELETE /api/post/:postId
Authorization: Bearer <accessToken>

Response 200:
{
  "message": "Post deleted successfully"
}
```

#### Like Post
```http
POST /api/post/:postId/like
Authorization: Bearer <accessToken>

Response 200:
{
  "isLiked": true,
  "likeCount": 6
}
```

#### Search Posts
```http
GET /api/post/search?q=summary&page=1
Authorization: Bearer <accessToken>

Response 200:
{
  "data": [ ...matching posts... ],
  "total": 8,
  "pages": 1
}
```

#### Get Recommendations
```http
GET /api/post/recommendations?limit=10
Authorization: Bearer <accessToken>

Response 200:
{
  "data": [ ...personalized posts... ],
  "message": "Based on your interests"
}
```

### Comments

#### Create Comment
```http
POST /api/comment
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "text": "Great post!",
  "postId": "507f1f77bcf86cd799439012"
}

Response 201:
{
  "id": "507f1f77bcf86cd799439013",
  "text": "Great post!",
  "postId": "507f1f77bcf86cd799439012",
  "author": { ... },
  "createdAt": "..."
}
```

#### Update Comment
```http
PUT /api/comment/:commentId
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "text": "Updated comment"
}

Response 200: (updated comment)
```

#### Delete Comment
```http
DELETE /api/comment/:commentId
Authorization: Bearer <accessToken>

Response 200:
{
  "message": "Comment deleted"
}
```

### Chat

#### Get Conversations
```http
GET /api/chat/conversations
Authorization: Bearer <accessToken>

Response 200:
{
  "conversations": [
    {
      "userId": "507f1f77bcf86cd799439014",
      "username": "user2",
      "lastMessage": "Hey!",
      "lastMessageTime": "2024-01-15T10:30:00Z",
      "unreadCount": 2
    }
  ]
}
```

#### Get Chat History
```http
GET /api/chat/:userId
Authorization: Bearer <accessToken>

Response 200:
{
  "messages": [
    {
      "id": "507f1f77bcf86cd799439015",
      "sender": { id, username },
      "message": "Hello!",
      "read": true,
      "createdAt": "..."
    }
  ]
}
```

#### Mark Message as Read
```http
POST /api/chat/message/:messageId/read
Authorization: Bearer <accessToken>

Response 200:
{
  "message": "Marked as read"
}
```

---

## 🗄️ Database Schema

### User Collection

```typescript
interface IUser extends Document {
  username: string;           // Unique, required, trimmed
  email: string;             // Unique, required, lowercase
  password?: string;         // Hashed with bcrypt (10 rounds)
  authProvider: "local" | "google";
  googleId?: string;         // For OAuth users
  profileUrl: string;        // Profile picture URL
  refreshTokens: string[];   // Token rotation array
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- { username: 1 } (unique)
- { email: 1 } (unique)
- { googleId: 1 } (unique, sparse)
```

### Post Collection

```typescript
interface IPost extends Document {
  text: string;                  // Required, trimmed
  imageUrl: string;              // Optional, uploaded image
  author: ObjectId;              // References User._id
  likes: ObjectId[];             // Array of User IDs who liked
  createdAt: Date;
  updatedAt: Date;
}

// Virtual: commentCount (derived from Comment collection)
// Indexes
- { author: 1 }
- { createdAt: -1 }
- { likes: 1 }
```

### Comment Collection

```typescript
interface IComment extends Document {
  text: string;                  // Required, trimmed
  postId: ObjectId;              // References Post._id
  author: ObjectId;              // References User._id
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- { postId: 1 }
- { author: 1 }
```

### ChatMessage Collection

```typescript
interface IChatMessage extends Document {
  sender: ObjectId;              // References User._id
  recipient: ObjectId;           // References User._id
  message: string;               // Message content
  read: boolean;                 // Read status
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- { sender: 1, recipient: 1, createdAt: -1 }
- { recipient: 1, read: 1 }
```

---

## 🏗️ Architecture Deep Dive

### Request Processing Pipeline

```
HTTP Request
    ↓
Express Router (routes/*.ts)
    ↓
[CORS Middleware] - Verify origin
    ↓
[authenticate Middleware] - Extract/verify JWT
    ↓
[upload Middleware] (if POST/PUT) - Handle file upload
    ↓
Controller (controllers/*.ts) - Process request
    ├─ Input validation
    ├─ Business logic via Service layer
    ├─ Database operations via Models
    └─ Format response
    ↓
Response Formatting
    ├─ Success: 200/201 + JSON
    └─ Error: 400/401/404/500 + error message
    ↓
HTTP Response to Client
```

### Layer Responsibilities

#### Routes Layer
- Maps HTTP methods/paths to controllers
- Applies middleware (auth, upload)
- Validates request parameters

#### Controller Layer
- Receives request data
- Calls service methods
- Formats responses
- Handles HTTP status codes

#### Service Layer
- Core business logic
- Coordination between models
- External API calls (Google, LLM)
- Error handling

#### Model Layer
- Mongoose schema definitions
- Database operations (CRUD)
- Data validation
- Relationships/references

### Authentication Flow

```
CLIENT
  ↓
[Login with email/password] → userController.login()
  ↓
[Verify password] → bcrypt.compare(password, user.password)
  ↓
[Generate JWT pair] → authService.generateTokens()
  ├─ Access Token: sign(userId, username, 15m)
  └─ Refresh Token: sign(userId, username, 7d)
  ↓
[Save refresh token] → user.refreshTokens.push(token)
  ↓
[Return to client] ← accessToken + refreshToken
  ↓
[CLIENT stores in localStorage]
  ↓
[Subsequent requests] → Include "Authorization: Bearer <accessToken>"
  ↓
[authenticate middleware] → Verify JWT signature + expiry
  ├─ Valid: Extract userId → req.userId
  └─ Expired (401) → Axios interceptor triggers refresh
      ↓
      [POST /user/refresh] with refreshToken
      ↓
      [Backend validates] Verify token in user.refreshTokens[]
      ↓
      [Rotate tokens] Generate new pair + update DB
      ↓
      [Return new tokens]
      ↓
      [Retry original request]
```

### Recommendation Engine

```
USER makes POST request to /post/recommendations
    ↓
[llmService.getRecommendations(userId)]
    ├─ Fetch user's own posts (recent 5)
    ├─ Fetch all other posts (from DB)
    │
    ├─ FOR EACH OTHER POST:
    │   ├─ Analyze relevance score
    │   ├─ Factors:
    │   │  ├─ Keyword overlap with user's posts
    │   │  ├─ Author engagement
    │   │  ├─ Post recency
    │   │  └─ Like/comment count
    │   └─ Calculate score (0-100)
    │
    ├─ Sort by score (descending)
    ├─ Remove user's own posts
    ├─ Return top 10 recommendations
    └─ Fallback: Return recent posts if algo fails
    ↓
[postController.getRecommendedPosts()]
    ├─ Serialize posts with DTOs
    ├─ Include like counts and comment counts
    └─ Return JSON response
```

---

## 🔐 Authentication & Security

### JWT Token Structure

```
Access Token:
  Header: { alg: "HS256", typ: "JWT" }
  Payload: { userId, username, iat, exp (15m) }
  Secret: JWT_SECRET
  
Refresh Token:
  Header: { alg: "HS256", typ: "JWT" }
  Payload: { userId, username, iat, exp (7d) }
  Secret: JWT_REFRESH_SECRET
```

### Token Refresh Flow

```
[Token Expired (401)]
    ↓
[Axios Response Interceptor Triggered]
    ↓
[Check: _retry flag exists?]
    ├─ YES (already tried) → Reject request
    └─ NO → Mark _retry = true
    ↓
[POST /user/refresh with old refreshToken]
    ↓
[Backend: verifyRefreshToken()]
    ├─ Check signature valid
    ├─ Check not expired
    ├─ Check exists in user.refreshTokens[]
    └─ If ALL pass → Generate new pair
    ↓
[Token Rotation]
    ├─ Remove old token from user.refreshTokens
    ├─ Push new refreshToken to array
    ├─ Save user document
    └─ Return new pair
    ↓
[Client: Update localStorage]
    ├─ localStorage.accessToken = new token
    └─ localStorage.refreshToken = new token
    ↓
[Retry Original Request]
    └─ Use new accessToken in header
```

### Password Security

```typescript
// Registration/Password Change
1. Receive plaintext password
2. await bcrypt.genSalt(10)     // 10 cost factor
3. await bcrypt.hash(password, salt)
4. Store hash in database

// Login
1. Receive plaintext password
2. Retrieve hash from database
3. await bcrypt.compare(password, hash)
4. If match: generate tokens
```

### Protected Routes

All routes except `/user/register`, `/user/login`, `/user/google-login` require:
```typescript
router.post("/", authenticate, postController.createPost);

// authenticate middleware:
// 1. Extract token from "Authorization: Bearer <token>"
// 2. Verify signature: jwt.verify(token, JWT_SECRET)
// 3. If invalid/expired: respond 401
// 4. If valid: extract payload.userId → req.userId
```

### Best Practices Implemented

- ✅ JWT stored in localStorage (frontend) with Axios interceptors
- ✅ Refresh token rotation (invalidate old, issue new)
- ✅ Token expiration (access: 15m for security, refresh: 7d for convenience)
- ✅ CORS configured for specific origin
- ✅ HTTPS/TLS in production (Nginx)
- ✅ No secrets in version control (.env in .gitignore)
- ✅ Input validation on all endpoints
- ✅ Error messages don't leak system info

---

## ⚡ Real-Time Features

### Socket.IO Implementation

Located in `src/socket.ts`:

```typescript
import { Server as SocketIOServer } from "socket.io";

// Initialize with CORS for Nginx proxy
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_ORIGIN },
});

// Event Handlers:
io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  
  socket.on("send_message", async (data) => {
    // Save to database
    // Emit to recipient
  });
  
  socket.on("mark_as_read", async (messageId) => {
    // Update database
  });
  
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});
```

### Frontend Socket.IO Integration

```typescript
// In ChatPage.tsx
const socket = io(API_BASE_URL);

socket.on("message_received", (message) => {
  setMessages([...messages, message]);
});

const sendMessage = (text: string, recipientId: string) => {
  socket.emit("send_message", { text, recipientId });
};
```

### Real-Time Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `connection` | Server | socket object | User connects |
| `send_message` | Client→Server | { text, recipientId } | Send message |
| `message_received` | Server→Client | { id, sender, message, read } | Receive message |
| `mark_as_read` | Client→Server | { messageId } | Mark read |
| `typing_indicator` | Bidirectional | { userId } | Show typing (ready) |
| `disconnect` | Server | socket object | User leaves |

---

## 🤖 AI & Recommendations

### LLM Service Overview

Located in `src/services/llmService.ts`:

```typescript
export const getRecommendations = async (
  userId: string,
  userPosts: any[],
  allPosts: any[]
) => {
  // 1. Analyze user's post history
  const userKeywords = extractKeywords(userPosts);
  const userTopics = analyzeTrends(userPosts);
  
  // 2. Score each other post
  const scoredPosts = allPosts
    .filter(post => post.author.toString() !== userId)
    .map(post => ({
      post,
      score: calculateRelevance(post, userKeywords, userTopics)
    }));
  
  // 3. Sort and return top N
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ post }) => post);
};
```

### Recommendation Factors

```
Score = (Keyword Match × 0.4) 
       + (Topic Similarity × 0.3)
       + (Popularity × 0.2)
       + (Recency × 0.1)

Keyword Match:
  - Count of matching words between user posts and candidate post
  - Normalized by post length

Topic Similarity:
  - Hash-table of user's post topics
  - Check candidate post for same topics

Popularity:
  - Like count normalized
  - Comment count normalized

Recency:
  - Recent posts scored higher
  - Decay function based on age
```

### Integration with Controllers

```typescript
// In postController.getRecommendedPosts()
const userPosts = await Post.find({ author: req.userId });
const allPosts = await Post.find({ author: { $ne: req.userId } });

const recommendedPosts = await llmService.getRecommendations(
  req.userId,
  userPosts,
  allPosts
);

const serialized = await serializePosts(recommendedPosts, req.userId);
res.json({ data: serialized });
```

---

## 🧪 Testing

### Test Structure

```bash
backend/src/tests/
├── user.test.ts        # Authentication & user endpoints
├── post.test.ts        # Post CRUD & recommendations
├── comment.test.ts     # Comment operations
├── search.test.ts      # Search functionality
└── socket.test.ts      # WebSocket events
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Watch mode (rerun on changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Verbose output
npm test -- --verbose

# Clear cache
npm test -- --clearCache
```

### Test Example: User Registration

```typescript
describe("POST /api/user/register", () => {
  it("should register a new user with valid data", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send({
        username: "newuser",
        email: "new@example.com",
        password: "SecurePass123!"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body.user.username).toBe("newuser");
  });

  it("should reject duplicate email", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send({
        username: "user2",
        email: "existing@example.com", // Same as seeded user
        password: "SecurePass123!"
      });

    expect(response.status).toBe(400);
  });
});
```

### Jest Configuration

```typescript
// jest.config.ts
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./jest.setup.ts"],
  roots: ["<rootDir>/src/tests"],
};

// jest.setup.ts
import dotenv from "dotenv";
dotenv.config();
```

### Test Coverage

- ✅ User: register, login, logout, refresh, Google OAuth
- ✅ Posts: CRUD, likes, search, recommendations
- ✅ Comments: create, update, delete
- ✅ Search: text matching, filtering
- ✅ Socket: connection, message events

---

## 🚀 Deployment

### Build for Production

```bash
# 1. Compile TypeScript
npm run build

# 2. Create dist/ directory with compiled JavaScript
# dist/
# ├── controllers/
# ├── models/
# ├── routes/
# ├── services/
# ├── middleware/
# ├── utils/
# ├── server.js
# └── index.js
```

### Using PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd backend
pm2 start dist/server.js --name tldr-api

# View logs
pm2 logs tldr-api

# Save configuration
pm2 save

# Enable startup on reboot
pm2 startup
pm2 save

# Monitor resources
pm2 monit
```

### Nginx Reverse Proxy

```nginx
# Location: /etc/nginx/sites-available/tldr

upstream backend {
  server 127.0.0.1:5000;
}

server {
  listen 443 ssl http2;
  server_name node92.cs.colman.ac.il;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/node92.cs.colman.ac.il/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/node92.cs.colman.ac.il/privkey.pem;

  # Root: frontend static files
  root /var/www/tldr/frontend/dist;

  # API proxy
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Socket.IO proxy
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  # SPA routing
  location / {
    try_files $uri /index.html;
  }
}
```

### Environment Variables for Production

Set environment variables before starting:

```bash
# Via systemd service or .env.production
export JWT_SECRET="$(openssl rand -base64 32)"
export JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/tldr"
export GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
export CLIENT_ORIGIN="https://node92.cs.colman.ac.il"
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues

```bash
# Test connection string
mongosh "mongodb://localhost:27017/tldr"

# Check URI for Atlas
# Format: mongodb+srv://username:password@cluster.mongodb.net/database

# Common errors:
# - "connect ECONNREFUSED": MongoDB service not running
# - "authentication failed": Wrong username/password
# - "operation timed out": Network/firewall issue
```

### JWT Token Issues

```bash
# Token not validating:
# 1. Check JWT_SECRET matches between generation and verification
# 2. Verify token is in correct format: "Authorization: Bearer <token>"
# 3. Check token expiration: jwt.decode(token) should show exp < now

# Refresh token not working:
# 1. Verify refreshToken exists in user.refreshTokens[]
# 2. Check JWT_REFRESH_SECRET is set correctly
# 3. Ensure refresh token hasn't expired (max 7 days)
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run single test file
npm test -- user.test.ts

# Check MongoDB is running for tests
# Tests use: mongodb://localhost:27017/tldr

# View detailed error
npm test -- --verbose
```

### Socket.IO Not Connecting

```bash
# Check CORS origin in socket.ts matches CLIENT_ORIGIN
# Verify WebSocket is not blocked by firewall
# Check Nginx routes /socket.io/ correctly
# Look at browser console for connection errors

# Debug: Add socket logging
socket.on('error', (error) => console.error('Socket error:', error));
```

### File Upload Issues

```bash
# Check uploads/ directory exists and writable
# Verify multer limits in middleware:
# - maxFileSize
# - allowed MIME types

# Image not displaying:
# - Verify /public and /uploads routes in index.ts
# - Check image path in response matches actual location
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Mongoose Guide](https://mongoosejs.com/docs/)
- [Socket.IO Docs](https://socket.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: April 2026  
**Status**: ✅ Production Ready
