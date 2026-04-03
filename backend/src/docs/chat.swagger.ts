export const chatSchemas = {
  ChatMessage: {
    type: "object",
    properties: {
      _id: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a9a" },
      sender: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4c" },
      recipient: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      content: { type: "string", example: "Hey, are you available to chat?" },
      read: { type: "boolean", example: false },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["_id", "sender", "recipient", "content", "read", "createdAt", "updatedAt"],
  },
  ConversationSummary: {
    type: "object",
    properties: {
      userId: { type: "string", example: "67dc1f5e0f8d8d1f1c2b3a4d" },
      username: { type: "string", example: "DemoUser002" },
      profileUrl: { type: "string", example: "/public/uploads/profiles/demo-002.png" },
      lastMessage: { type: "string", example: "Let me know when you review the PR." },
      lastMessageAt: { type: "string", format: "date-time" },
      unread: { type: "integer", example: 2 },
    },
    required: ["userId", "username", "profileUrl", "lastMessage", "lastMessageAt", "unread"],
  },
  ChatMarkReadResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Message marked as read" },
    },
    required: ["message"],
  },
} as const;

export const chatPaths = {
  "/api/chat/conversations": {
    get: {
      tags: ["Chat"],
      summary: "Get conversation list for the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Conversation summaries retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/ConversationSummary" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "500": { description: "Failed to fetch conversations" },
      },
    },
  },
  "/api/chat/{userId}": {
    get: {
      tags: ["Chat"],
      summary: "Get chat history with another user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "The other user's id",
        },
      ],
      responses: {
        "200": {
          description: "Chat history retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/ChatMessage" },
              },
            },
          },
        },
        "400": { description: "Invalid user ID or cannot fetch history with yourself" },
        "401": { description: "Unauthorized" },
        "500": { description: "Failed to fetch chat history" },
      },
    },
  },
  "/api/chat/message/{messageId}/read": {
    post: {
      tags: ["Chat"],
      summary: "Mark a chat message as read",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "messageId",
          required: true,
          schema: { type: "string" },
          description: "Message id",
        },
      ],
      responses: {
        "200": {
          description: "Message marked as read",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatMarkReadResponse" },
            },
          },
        },
        "400": { description: "Invalid sender/message ID or invalid read request" },
        "401": { description: "Unauthorized" },
        "500": { description: "Failed to mark message as read" },
      },
    },
  },
} as const;

export const chatTags = [
  {
    name: "Chat",
    description: "Chat history and conversation endpoints",
  },
] as const;
