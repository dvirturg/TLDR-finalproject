export const userSchemas = {
  User: {
    type: "object",
    properties: {
      _id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      username: { type: "string", example: "NoaTest" },
      email: { type: "string", example: "noa@test.com" },
      profileUrl: { type: "string", example: "/uploads/profile-123.jpg" },
      refreshTokens: {
        type: "array",
        items: { type: "string" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      __v: { type: "integer", example: 0 },
    },
    required: ["_id", "username", "email"],
  },
  AuthResponse: {
    type: "object",
    properties: {
      accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      user: { $ref: "#/components/schemas/User" },
    },
    required: ["accessToken", "user"],
  },
  RegisterRequest: {
    type: "object",
    properties: {
      username: { type: "string", example: "NoaTest" },
      email: { type: "string", example: "noa@test.com" },
      password: { type: "string", example: "password123" },
    },
    required: ["username", "email", "password"],
  },
  LoginRequest: {
    type: "object",
    properties: {
      email: { type: "string", example: "noa@test.com" },
      password: { type: "string", example: "password123" },
    },
    required: ["email", "password"],
  },
  GoogleLoginRequest: {
    type: "object",
    properties: {
      idToken: { type: "string", example: "google-id-token" },
    },
    required: ["idToken"],
  },
  UpdateUserMultipart: {
    type: "object",
    properties: {
      username: { type: "string", example: "UpdatedUsername" },
      email: { type: "string", example: "updated@test.com" },
      profilePicture: { type: "string", format: "binary" },
    },
  },
  UserMessageResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "User deleted successfully" },
    },
    required: ["message"],
  },
  UserErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "User not found" },
    },
    required: ["message"],
  },
} as const;

export const userPaths = {
  "/api/user/register": {
    post: {
      tags: ["User"],
      summary: "Register a local user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthResponse" },
            },
          },
        },
        "400": { description: "User already exists or invalid payload" },
        "500": { description: "Error during registration" },
      },
    },
  },
  "/api/user/login": {
    post: {
      tags: ["User"],
      summary: "Login with email and password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Login succeeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthResponse" },
            },
          },
        },
        "401": { description: "Invalid email or password" },
        "500": { description: "Error during login" },
      },
    },
  },
  "/api/user/google-login": {
    post: {
      tags: ["User"],
      summary: "Authenticate with Google ID token",
      description: "Verifies a Google ID token and returns the app JWT plus user details.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/GoogleLoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Google login succeeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthResponse" },
            },
          },
        },
        "400": { description: "Missing Google ID token" },
        "401": { description: "Invalid Google credentials" },
        "500": { description: "Google authentication is not configured" },
      },
    },
  },
  "/api/user/search": {
    get: {
      tags: ["User"],
      summary: "Search for users",
      description: "Search users by username using regex. Requires authentication.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "query",
          name: "q",
          schema: { type: "string" },
          required: true,
          description: "Search query for username",
        },
      ],
      responses: {
        "200": {
          description: "Users found successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
  "/api/user/{id}": {
    get: {
      tags: ["User"],
      summary: "Get user by id",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "User retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        "404": { description: "User not found" },
      },
    },
    put: {
      tags: ["User"],
      summary: "Update user profile",
      description: "Updates username, email or profile picture. Only the user themselves can update their profile.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: { $ref: "#/components/schemas/UpdateUserMultipart" },
          },
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        "403": { description: "Forbidden - cannot update other users" },
        "404": { description: "User not found" },
      },
    },
    delete: {
      tags: ["User"],
      summary: "Delete user by id",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "204": { description: "User deleted successfully" },
        "403": { description: "Forbidden" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/user/{id}/posts": {
    get: {
      tags: ["User"],
      summary: "Get all posts by a specific user",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "The user id",
        },
      ],
      responses: {
        "200": {
          description: "Posts retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Post" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const userTags = [
  {
    name: "User",
    description: "User profile and search management",
  },
] as const;
