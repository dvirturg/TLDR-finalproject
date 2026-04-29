# 🎨 TLDR Frontend - React 19 + Vite + TypeScript

Modern, responsive SPA (Single Page Application) for the TLDR social platform, built with React 19, Vite, TypeScript, and Bootstrap 5.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Routing & Navigation](#routing--navigation)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Components](#components)
- [Pages](#pages)
- [Real-Time Features](#real-time-features)
- [Authentication](#authentication)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The TLDR frontend is a sophisticated React single-page application that provides:
- User authentication (email/password + Google OAuth)
- Social feed with AI-powered recommendations
- Real-time messaging with Socket.IO
- Full-text search across posts
- User profile management
- Image upload for posts
- Responsive design for all devices

**Status**: ✅ Production-Ready  
**Build Tool**: Vite (ultra-fast)  
**Framework**: React 19 (latest features)  
**Language**: TypeScript (strict mode)  
**UI Framework**: Bootstrap 5

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 19.2+ |
| **Build Tool** | Vite | 5.x |
| **Language** | TypeScript | 5.x |
| **HTTP Client** | Axios | 1.13+ |
| **UI Framework** | Bootstrap | 5.3+ |
| **Icons** | Bootstrap Icons | 1.13+ |
| **OAuth** | @react-oauth/google | 0.13+ |
| **State** | React Context API | (built-in) |
| **Testing** | Vitest | (ready) |
| **Styling** | CSS3 + Bootstrap | Custom + defaults |

---

## 📁 Project Structure

```
frontend/
│
├── src/
│   ├── main.tsx                    # React entry point (DOM mount)
│   ├── App.tsx                     # Root component wrapper
│   ├── routes.tsx                  # Client-side routing definitions
│   ├── types.ts                    # Global TypeScript interfaces
│   │
│   ├── api/                        # HTTP CLIENT LAYER
│   │   ├── axiosInstance.ts        # Axios config + interceptors
│   │   │   ├─ Request interceptor: Add JWT to headers
│   │   │   └─ Response interceptor: Refresh token on 401
│   │   │
│   │   ├── authApi.ts              # Authentication endpoints
│   │   │   ├─ register()
│   │   │   ├─ login()
│   │   │   ├─ googleLogin()
│   │   │   └─ logout()
│   │   │
│   │   ├── postsApi.ts             # Post CRUD endpoints
│   │   │   ├─ createPost()
│   │   │   ├─ getAllPosts()
│   │   │   ├─ getPostById()
│   │   │   ├─ updatePost()
│   │   │   ├─ deletePost()
│   │   │   ├─ likePost()
│   │   │   ├─ searchPosts()
│   │   │   └─ getRecommendations()
│   │   │
│   │   ├── commentsApi.ts          # Comment endpoints
│   │   │   ├─ createComment()
│   │   │   ├─ updateComment()
│   │   │   └─ deleteComment()
│   │   │
│   │   ├── chatApi.ts              # Chat endpoints
│   │   │   ├─ getConversations()
│   │   │   ├─ getChatHistory()
│   │   │   └─ markAsRead()
│   │   │
│   │   ├── usersApi.ts             # User profile endpoints
│   │   │   └─ getUserProfile()
│   │   │
│   │   └── index.ts                # API barrel export
│   │
│   ├── context/                    # STATE MANAGEMENT
│   │   └── AuthContext.tsx
│   │       ├─ AuthContext (interface)
│   │       ├─ AuthProvider (wrapper component)
│   │       ├─ useAuth() hook
│   │       └─ Functions:
│   │          ├─ login()
│   │          ├─ register()
│   │          ├─ googleLogin()
│   │          ├─ logout()
│   │          ├─ getAccessToken()
│   │          ├─ getRefreshToken()
│   │          └─ persist() [localStorage]
│   │
│   ├── components/                 # REUSABLE COMPONENTS
│   │   ├── Layout.tsx              # Page wrapper
│   │   │   └─ Navbar + footer + content
│   │   │
│   │   ├── Navbar.tsx              # Top navigation bar
│   │   │   ├─ Logo + home link
│   │   │   ├─ Search bar
│   │   │   ├─ Navigation links
│   │   │   └─ User menu (profile, logout)
│   │   │
│   │   ├── PostCard.tsx            # Individual post display
│   │   │   ├─ Post text/image
│   │   │   ├─ Author name + avatar
│   │   │   ├─ Like button (with count)
│   │   │   ├─ Comment count
│   │   │   ├─ Timestamp
│   │   │   └─ Edit/delete (if author)
│   │   │
│   │   ├── CommentSection.tsx      # Comments thread
│   │   │   ├─ Comment input form
│   │   │   ├─ Comment list
│   │   │   ├─ Edit comment
│   │   │   └─ Delete comment
│   │   │
│   │   ├── RecommendationsSidebar.tsx # Suggested posts
│   │   │   ├─ Recommended posts list
│   │   │   └─ "See More" link
│   │   │
│   │   └── ProtectedRoute.tsx      # Route guard HOC
│   │       ├─ Check if user authenticated
│   │       ├─ Redirect to login if not
│   │       └─ Render component if auth
│   │
│   ├── pages/                      # PAGE COMPONENTS
│   │   ├── LoginPage.tsx           # /login
│   │   │   ├─ Email/password form
│   │   │   ├─ Google OAuth button
│   │   │   ├─ Register link
│   │   │   └─ Error display
│   │   │
│   │   ├── FeedPage.tsx            # / (home)
│   │   │   ├─ Posts feed (paginated)
│   │   │   ├─ Recommendations sidebar
│   │   │   ├─ "New Post" button
│   │   │   └─ Load more
│   │   │
│   │   ├── UploadPage.tsx          # /upload
│   │   │   ├─ Post creation form
│   │   │   ├─ Text input
│   │   │   ├─ Image upload
│   │   │   └─ Submit button
│   │   │
│   │   ├── PostCommentsPage.tsx    # /post/:id
│   │   │   ├─ Full post display
│   │   │   ├─ Comment section
│   │   │   ├─ Comment history
│   │   │   └─ Navigation back
│   │   │
│   │   ├── ChatPage.tsx            # /chat
│   │   │   ├─ Conversation list
│   │   │   ├─ Chat window
│   │   │   ├─ Message input
│   │   │   ├─ Socket.IO integration
│   │   │   └─ Typing indicators (ready)
│   │   │
│   │   ├── ProfilePage.tsx         # /profile
│   │   │   ├─ Current user data
│   │   │   ├─ User avatar
│   │   │   ├─ User's posts
│   │   │   └─ Edit profile (ready)
│   │   │
│   │   ├── UserProfilePage.tsx     # /user/:userId
│   │   │   ├─ View other user data
│   │   │   ├─ Their posts
│   │   │   ├─ Follow button (ready)
│   │   │   └─ Message button
│   │   │
│   │   ├── SearchPage.tsx          # /search?q=...
│   │   │   ├─ Search results
│   │   │   ├─ Filter/sort
│   │   │   └─ Pagination
│   │   │
│   │   └── RecommendationsPage.tsx # /recommendations
│   │       ├─ Full recommendations feed
│   │       ├─ AI-powered suggestions
│   │       └─ Personalized content
│   │
│   ├── config/                     # CONFIGURATION
│   │   └── api.ts                  # API base URL config
│   │       └─ Reads from VITE_API_URL or localhost
│   │
│   ├── assets/                     # STATIC ASSETS
│   │   └── (images, icons, etc.)
│   │
│   ├── public/                     # PUBLIC STATIC FILES
│   │   └── (favicon, etc.)
│   │
│   ├── App.css                     # Global styles
│   ├── main.tsx                    # DOM mount point
│   ├── setupTests.ts               # Vitest setup
│   ├── vite-env.d.ts               # Vite environment types
│   └── types.ts                    # Global interfaces
│
├── public/                         # Public static files
│
├── index.html                      # HTML entry (SPA shell)
│
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── tsconfig.app.json               # App-specific TS config
├── tsconfig.node.json              # Node tooling TS config
│
├── package.json                    # Dependencies & scripts
├── .env.production                 # Prod API configuration
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

# OR if using yarn
yarn --version
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

### Scripts

```bash
npm run dev              # Start Vite dev server (hot reload)
npm run build            # Compile for production
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run test             # Run Vitest
npm run test:watch       # Watch mode for tests
npm run test:coverage    # Generate coverage report
```

---

## ⚙️ Configuration

### API Configuration

**Development** (`config/api.ts`):
```typescript
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
```

**Environment Variables** (`.env.production`):
```env
VITE_API_URL=https://node92.cs.colman.ac.il/api
```

### Axios Configuration

**axiosInstance.ts**:
- Automatically adds JWT token to request headers
- Intercepts 401 responses to refresh tokens
- Prevents infinite refresh loops
- Updates localStorage with new tokens
- Clears auth state on refresh failure

```typescript
// Request Interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh token and retry request
    }
    return Promise.reject(error);
  }
);
```

### TypeScript Configuration

Key compiler options:
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client", "vitest/globals"]
  }
}
```

---

## 🗺️ Routing & Navigation

### Route Definitions (routes.tsx)

```typescript
const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <ProtectedRoute><FeedPage /></ProtectedRoute>
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        path: "upload",
        element: <ProtectedRoute><UploadPage /></ProtectedRoute>
      },
      {
        path: "post/:id",
        element: <ProtectedRoute><PostCommentsPage /></ProtectedRoute>
      },
      {
        path: "chat",
        element: <ProtectedRoute><ChatPage /></ProtectedRoute>
      },
      {
        path: "profile",
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
      },
      {
        path: "user/:userId",
        element: <ProtectedRoute><UserProfilePage /></ProtectedRoute>
      },
      {
        path: "search",
        element: <ProtectedRoute><SearchPage /></ProtectedRoute>
      },
      {
        path: "recommendations",
        element: <ProtectedRoute><RecommendationsPage /></ProtectedRoute>
      }
    ]
  }
];
```

### Protected Routes

The `ProtectedRoute` component checks authentication:

```typescript
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

---

## 🎛️ State Management

### Context API Architecture

The app uses React Context API for global authentication state (no Redux/Zustand needed for this scope).

**AuthContext.tsx**:

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

// Usage in component
const { isAuthenticated, user, login } = useAuth();
```

### Token Persistence

Tokens stored in localStorage with automatic refresh:

```typescript
const persist = () => {
  if (accessToken && refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};
```

### Context Provider Wrapper

App.tsx wraps routes with AuthProvider:

```typescript
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>
```

---

## 🔌 API Integration

### API Modules Structure

Each API file groups related endpoints:

**authApi.ts**:
```typescript
export const register = async (username: string, email: string, password: string) => {
  const response = await axiosInstance.post('/user/register', {
    username, email, password
  });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post('/user/login', { email, password });
  return response.data;
};

export const googleLogin = async (idToken: string) => {
  const response = await axiosInstance.post('/user/google-login', { idToken });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/user/logout');
  return response.data;
};
```

**postsApi.ts**:
```typescript
export const createPost = async (text: string, image?: File) => {
  const formData = new FormData();
  formData.append('text', text);
  if (image) formData.append('image', image);
  
  const response = await axiosInstance.post('/post', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getAllPosts = async (page: number = 1, limit: number = 10) => {
  const response = await axiosInstance.get('/post', {
    params: { page, limit }
  });
  return response.data;
};

export const searchPosts = async (query: string) => {
  const response = await axiosInstance.get('/post/search', {
    params: { q: query }
  });
  return response.data;
};

export const getRecommendations = async () => {
  const response = await axiosInstance.get('/post/recommendations');
  return response.data;
};
```

### Error Handling Pattern

```typescript
try {
  const data = await loginUser(email, password);
  setUser(data.user);
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'Login failed';
    setError(message);
  }
}
```

---

## 🧩 Components

### PostCard Component

Displays individual post with interactions:

```typescript
interface PostCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

// Features
<PostCard post={post} onUpdate={handleUpdate} onDelete={handleDelete} />
// - Post text and image
// - Author name and avatar
// - Like button with count
// - Comment count
// - Delete button (if author)
// - Relative timestamp
```

### CommentSection Component

Manages comment thread on posts:

```typescript
interface CommentSectionProps {
  postId: string;
}

// Features
<CommentSection postId={postId} />
// - Comment input form
// - Comment list with author info
// - Edit comment (if author)
// - Delete comment (if author)
// - Relative timestamps
```

### RecommendationsSidebar Component

Shows AI-powered suggestions:

```typescript
// Features
<RecommendationsSidebar />
// - List of recommended posts (top 5)
// - Post previews
// - "See All Recommendations" link
// - Refresh recommendations
```

### Navbar Component

Top navigation with search and user menu:

```typescript
// Features
<Navbar />
// - Logo/home link
// - Search bar
// - Navigation links (Feed, Upload, Chat, Profile)
// - User dropdown menu
// - Logout button
```

### Layout Component

Wrapper for all pages:

```typescript
// Features
<Layout>
  <Page />
</Layout>
// - Navbar
// - Main content area
// - Footer (optional)
// - Sidebar (recommendations)
```

---

## 📄 Pages

### LoginPage

User authentication:

```typescript
// Features
- Email/password form
- Validation error messages
- "Don't have account?" link to register
- Google OAuth sign-in button
- Session persistence
```

### FeedPage

Main social feed:

```typescript
// Features
- Paginated post list
- Load more button
- Post cards with interactions
- Recommendations sidebar
- "New Post" floating action button
- Infinite scroll ready
```

### UploadPage

Create new post:

```typescript
// Features
- Text input for post content
- Image file upload with preview
- Character count display
- Submit button (disabled while loading)
- Success/error messages
- Redirect to feed on success
```

### PostCommentsPage

Post detail view:

```typescript
// Features
- Full post display
- Comment section
- Comment list with pagination
- Edit/delete own comments
- Reply/nested comments (ready)
- Navigation back to feed
```

### ChatPage

Real-time messaging:

```typescript
// Features
- Conversation list
- Chat window with message history
- Message input
- Send button
- Socket.IO real-time updates
- Read/unread indicators
- Typing indicators (ready)
- User online status (ready)
```

### ProfilePage

Current user profile:

```typescript
// Features
- User avatar/profile picture
- Username and email
- Join date
- User's posts list
- Edit profile button (ready)
- Post statistics
```

### UserProfilePage

View other user:

```typescript
// Features
- User avatar
- Username and join date
- User's posts
- Follow button (ready)
- Message button
- User statistics
```

### SearchPage

Search results:

```typescript
// Features
- Search query display
- Results list
- Filter options (ready)
- Sort by relevance/date/likes
- Pagination
- "No results" message
```

### RecommendationsPage

Full recommendations feed:

```typescript
// Features
- AI-powered post suggestions
- Full feed view (not sidebar)
- Post interactions
- Refresh recommendations
- Personalization explanation
```

---

## ⚡ Real-Time Features

### Socket.IO Integration (ChatPage.tsx)

```typescript
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

const ChatPage = () => {
  const socketRef = useRef(io(API_BASE_URL));
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const socket = socketRef.current;
    
    // Connect to server
    socket.connect();
    
    // Listen for incoming messages
    socket.on('message_received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Handle typing indicator
    socket.on('user_typing', (userId: string) => {
      setTypingUsers(prev => [...prev, userId]);
    });
    
    return () => socket.disconnect();
  }, []);
  
  const sendMessage = (text: string, recipientId: string) => {
    socketRef.current.emit('send_message', {
      text,
      recipientId,
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
};
```

### Real-Time Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `connection` | Server→Client | socket ID | Connection established |
| `send_message` | Client→Server | { text, recipientId } | Send message |
| `message_received` | Server→Client | { id, sender, text, timestamp } | Receive message |
| `user_typing` | Bidirectional | { userId } | Show typing (ready) |
| `mark_as_read` | Client→Server | { messageId } | Mark read |
| `disconnect` | Server→Client | - | User left |

---

## 🔐 Authentication

### Login Flow

```
User enters email/password
    ↓
Click "Login" button
    ↓
[LoginPage] → authApi.login()
    ↓
[Backend] → Verify credentials
    ↓
[Response] ← Access Token + Refresh Token
    ↓
[AuthContext.login()] → Store tokens
    ├─ localStorage.accessToken = token
    ├─ localStorage.refreshToken = token
    └─ setIsAuthenticated(true)
    ↓
[persist()] → Save to localStorage
    ↓
[useEffect] → Redirect to home (/feed)
    ↓
[FeedPage] → Load user's posts
```

### Google OAuth

```
User clicks "Sign in with Google"
    ↓
[Google Sign-In Button]
    ├─ Opens Google auth dialog
    ├─ User selects account
    └─ Returns idToken
    ↓
[onSuccess callback] → authApi.googleLogin(idToken)
    ↓
[Backend] → Verify idToken with Google
    ↓
[Response] ← Access Token + Refresh Token
    ↓
[AuthContext.googleLogin()] → Store tokens
    ↓
[Redirect] → FeedPage
```

### Token Refresh

```
[Axios Response Interceptor]
    ↓
[Response status 401?]
    ├─ YES → Token expired
    │   ├─ Retrieve refreshToken from localStorage
    │   ├─ POST /user/refresh with token
    │   ├─ Receive new tokens
    │   ├─ Update localStorage
    │   ├─ Retry original request
    │   └─ Return data
    └─ NO → Continue normally
```

---

## 🧪 Testing

### Test Structure

```bash
frontend/src/
├── components/
│   └── __tests__/
│       ├── PostCard.test.tsx
│       ├── Navbar.test.tsx
│       └── CommentSection.test.tsx
└── pages/
    └── __tests__/
        ├── LoginPage.test.tsx
        ├── FeedPage.test.tsx
        └── ChatPage.test.tsx
```

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test LoginPage.test.tsx
```

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '@/pages/LoginPage';

describe('LoginPage', () => {
  it('should submit form with valid credentials', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    // Assert form submission
    expect(mockLoginFn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

---

## 🏗️ Building & Deployment

### Development Build

```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
# Hot module replacement enabled
# Source maps for debugging
```

### Production Build

```bash
npm run build
# Creates dist/ directory with optimized bundle
# TypeScript compilation
# Asset minification
# CSS/JS optimization
```

### Production Files

```
dist/
├── index.html           # Entry HTML
├── assets/
│   ├── index-XXX.js     # Main bundle (minified)
│   ├── vendor-XXX.js    # Dependencies bundle
│   └── style-XXX.css    # CSS bundle
└── favicon.ico
```

### Deployment to Production

#### 1. Build Frontend
```bash
npm run build
# Output: dist/ directory ready for serving
```

#### 2. Copy to Server
```bash
# Copy dist/ contents to /var/www/tldr/frontend/
scp -r dist/* user@node92:/var/www/tldr/frontend/dist/
```

#### 3. Nginx Configuration
```nginx
root /var/www/tldr/frontend/dist;

location / {
  try_files $uri /index.html;  # SPA routing
}

location /api/ {
  proxy_pass http://127.0.0.1:5000;
}
```

#### 4. Set Environment
```bash
# Create .env.production
VITE_API_URL=https://node92.cs.colman.ac.il/api
```

#### 5. Build with Production Config
```bash
npm run build  # Uses .env.production
```

---

## 🔧 Troubleshooting

### Blank Page After Build

```bash
# 1. Check HTML is served from root
# 2. Verify index.html in dist/
# 3. Check browser console for JS errors
# 4. Ensure API_BASE_URL is correct in production env
```

### API Requests Failing

```bash
# 1. Check VITE_API_URL in .env.production
# 2. Verify backend is running
# 3. Check CORS headers from backend
# 4. Look at Network tab in DevTools

# Common issue: /api/ path
# ✅ Correct: https://node92.cs.colman.ac.il/api
# ❌ Wrong: https://node92.cs.colman.ac.il/
```

### 401 Errors (Unauthorized)

```bash
# 1. Check localStorage has accessToken
# console.log(localStorage.getItem('accessToken'))

# 2. Verify token not expired
# Copy token and decode at jwt.io

# 3. Check backend JWT_SECRET matches

# 4. Try logging in again to refresh tokens
```

### Socket.IO Not Connecting

```bash
# 1. Check socket.io route in Nginx (add /socket.io/)
# 2. Verify WebSocket not blocked by firewall
# 3. Look at Network → WS tab in DevTools
# 4. Check browser console for socket errors
```

### Build Optimization Issues

```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Clear Vite cache
rm -rf dist node_modules/.vite

# 3. Check tsconfig for strict settings
npm run build -- --verbose
```

### Hot Module Replacement Not Working (npm run dev)

```bash
# 1. Restart dev server
# 2. Check port 5173 is not in use
# 3. Clear .vite cache: rm -rf node_modules/.vite
# 4. Hard refresh browser: Ctrl+Shift+R
```

### TypeScript Errors

```bash
# 1. Check all types defined in types.ts
# 2. Verify API response types match interfaces
# 3. Run: npm run build (to see all errors)
# 4. Check tsconfig.json "strict" mode is enabled
```

---

## 📚 Additional Resources

### Official Documentation
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bootstrap Components](https://getbootstrap.com/docs/5.3/)
- [Axios Documentation](https://axios-http.com/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

### Learning Resources
- [React Router](https://reactrouter.com/)
- [Context API Guide](https://react.dev/reference/react/useContext)
- [Async Operations in React](https://react.dev/reference/react/useEffect)

---

## 📝 Code Style Guide

### Component Naming
```typescript
// ✅ Correct
const UserProfile: React.FC<Props> = ({ userId }) => {}
function PostCard({ post }: PostCardProps) {}

// ❌ Avoid
const userProfile = () => {}
const post_card = () => {}
```

### Hook Usage
```typescript
// ✅ Correct
const { user, login } = useAuth();
const [posts, setPosts] = useState<Post[]>([]);

// ❌ Avoid
const auth = useAuth();
const posts = useState<Post[]>([]);
```

### Error Handling
```typescript
// ✅ Correct
try {
  const data = await fetchPosts();
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
  }
}

// ❌ Avoid
try {
  const data = await fetchPosts();
} catch (error: any) {
  console.log(error);
}
```

---

## 🎨 Styling

### Bootstrap Integration

Components use Bootstrap classes:
```typescript
<div className="container mt-4">
  <div className="row">
    <div className="col-md-8">
      <div className="card">
        <div className="card-body">
          Content
        </div>
      </div>
    </div>
  </div>
</div>
```

### Custom Styles

App.css for custom styling:
```css
/* Custom variables */
:root {
  --color-primary: #007bff;
  --color-text: #212529;
}

/* Component-specific styles */
.post-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.comment-section {
  margin-top: 2rem;
  padding: 1rem;
  border-top: 1px solid #ddd;
}
```

---

**Last Updated**: April 2026  
**Status**: ✅ Production Ready
