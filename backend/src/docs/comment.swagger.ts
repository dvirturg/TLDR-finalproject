export const commentSchemas = {
  Comment: {
    type: "object",
    properties: {
      _id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a5a" },
      text: { type: "string", example: "This is a comment" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      postId: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      __v: { type: "integer", example: 0 },
    },
    required: ["_id", "text", "author", "postId"],
  },
  CreateCommentRequest: {
    type: "object",
    required: ["text", "author", "postId"],
    properties: {
      text: { type: "string", example: "New comment" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      postId: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
    },
  },
  UpdateCommentRequest: {
    type: "object",
    properties: {
      text: { type: "string", example: "Updated comment text" },
      author: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      postId: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
    },
  },
} as const;

export const commentPaths = {
  "/api/comment": {
    post: {
      tags: ["Comment"],
      summary: "Create a comment",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateCommentRequest",
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Comment created successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Comment",
              },
            },
          },
        },
        "400": {
          description: "Missing comment fields",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
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
          description: "Server error while creating comment",
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
  "/api/comment/post/{postId}": {
    get: {
      tags: ["Comment"],
      summary: "Get comments by post",
      parameters: [
        {
          in: "path",
          name: "postId",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Comments retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Comment",
                },
              },
            },
          },
        },
        "500": {
          description: "Server error while retrieving comments",
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
  "/api/comment/{id}": {
    get: {
      tags: ["Comment"],
      summary: "Get comment by id",
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
          description: "Comment retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Comment",
              },
            },
          },
        },
        "404": {
          description: "Comment not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while retrieving comment",
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
      tags: ["Comment"],
      summary: "Update comment by id",
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
              $ref: "#/components/schemas/UpdateCommentRequest",
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Comment updated successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Comment",
              },
            },
          },
        },
        "404": {
          description: "Comment not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while updating comment",
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
      tags: ["Comment"],
      summary: "Delete comment by id",
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
          description: "Comment deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        "404": {
          description: "Comment not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },
        "500": {
          description: "Server error while deleting comment",
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

export const commentTags = [
  {
    name: "Comment",
    description: "Comment management endpoints",
  },
] as const;
