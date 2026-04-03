export const postSchemas = {
  Post: {
    type: "object",
    properties: {
      _id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      text: { type: "string", example: "Post with image" },
      imageUrl: { type: "string", example: "/public/uploads/posts/post-1710000000-123456789.jpg" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      likes: {
        type: "array",
        items: { type: "string" },
        example: ["67dc1f5e0f8d8d1f1c2b3a4e"],
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      __v: { type: "integer", example: 0 },
    },
    required: ["_id", "text", "imageUrl", "author", "likes"],
  },
  PostAuthorSummary: {
    type: "object",
    nullable: true,
    properties: {
      id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      username: { type: "string", example: "PostAuthor" },
      profileUrl: { type: "string", example: "/uploads/profile-123.jpg" },
    },
  },
  PostFeedItem: {
    type: "object",
    properties: {
      _id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      text: { type: "string", example: "football drills for beginners" },
      imageUrl: { type: "string", example: "" },
      author: { $ref: "#/components/schemas/PostAuthorSummary" },
      likes: { type: "integer", example: 3 },
      likedByCurrentUser: { type: "boolean", example: false },
      commentCount: { type: "integer", example: 2 },
    },
    required: ["_id", "id", "text", "imageUrl", "author", "likes", "likedByCurrentUser", "commentCount"],
  },
  RecommendationFeedResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/PostFeedItem" },
      },
    },
    required: ["data"],
  },
  CreatePostMultipart: {
    type: "object",
    required: ["text", "author"],
    properties: {
      text: { type: "string", example: "Post text" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      image: { type: "string", format: "binary" },
    },
  },
  UpdatePost: {
    type: "object",
    properties: {
      text: { type: "string", example: "Updated post text" },
      imageUrl: { type: "string", example: "/public/uploads/posts/custom.jpg" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
    },
  },
  ToggleLikeRequest: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4e" },
    },
  },
  MessageResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Post liked successfully" },
    },
    required: ["message"],
  },
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Post not found" },
    },
    required: ["message"],
  },
} as const;

export const postPaths = {
  "/api/post": {
    post: {
      tags: ["Post"],
      summary: "Create a post",
      description: "Creates a new post. Accepts multipart form data with an optional image upload.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              $ref: "#/components/schemas/CreatePostMultipart",
            },
          },
          "application/json": {
            schema: {
              type: "object",
              required: ["text", "author"],
              properties: {
                text: { type: "string", example: "Post text" },
                author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Post created successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Post",
              },
            },
          },
        },
        "400": {
          description: "Invalid post payload or image upload",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while creating post",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
    get: {
      tags: ["Post"],
      summary: "Get all posts",
      description: "Returns all posts. Query parameters are passed directly as filters to MongoDB find.",
      parameters: [
        {
          in: "query",
          name: "author",
          schema: { type: "string" },
          description: "Optional author id filter",
        },
      ],
      responses: {
        "200": {
          description: "Posts retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Post",
                },
              },
            },
          },
        },
        "500": {
          description: "Server error while retrieving posts",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },
  "/api/post/recommendations": {
    get: {
      tags: ["Post"],
      summary: "Get personalized recommendation feed",
      description: "Builds a recommendation feed from the current user's liked posts using LLM keyword extraction and regex-based post matching.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Recommended posts retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RecommendationFeedResponse",
              },
            },
          },
        },
        "401": {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while generating recommendations",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "Failed to fetch recommendations" },
                },
                required: ["error"],
              },
            },
          },
        },
      },
    },
  },
  "/api/post/{id}": {
    get: {
      tags: ["Post"],
      summary: "Get post by id",
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
          description: "Post retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Post",
              },
            },
          },
        },
        "404": {
          description: "Post not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while retrieving post",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
    put: {
      tags: ["Post"],
      summary: "Update post by id",
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
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdatePost",
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Post updated successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Post",
              },
            },
          },
        },
        "404": {
          description: "Post not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while updating post",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Post"],
      summary: "Delete post by id",
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
          description: "Post deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        "404": {
          description: "Post not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while deleting post",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },
  "/api/post/{id}/like": {
    post: {
      tags: ["Post"],
      summary: "Toggle like on a post",
      description: "Adds the user to likes if absent, or removes the user if already liked.",
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
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ToggleLikeRequest",
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Like toggled successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        "404": {
          description: "Post not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while toggling like",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
      },
    },
  },
} as const;

export const postTags = [
  {
    name: "Post",
    description: "Post management endpoints",
  },
] as const;
