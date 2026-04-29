export const ragTags = [
  {
    name: "RAG",
    description: "Retrieval augmented generation over post content",
  },
];

export const ragSchemas = {
  RagAskRequest: {
    type: "object",
    required: ["question"],
    properties: {
      question: {
        type: "string",
        example: "What posts discuss Ferrari tire strategy?",
      },
    },
  },
  RagSource: {
    type: "object",
    properties: {
      postId: { type: "string" },
      chunkIndex: { type: "integer" },
      text: { type: "string" },
      score: { type: "number", example: 0.84 },
    },
  },
  RagAskResponse: {
    type: "object",
    properties: {
      answer: { type: "string" },
      sources: {
        type: "array",
        items: { $ref: "#/components/schemas/RagSource" },
      },
      meta: {
        type: "object",
        properties: {
          topK: { type: "integer", example: 5 },
          threshold: { type: "number", example: 0.72 },
          embeddingModel: { type: "string", example: "gemini-embedding-001" },
        },
      },
    },
  },
};

export const ragPaths = {
  "/api/rag/ask": {
    post: {
      tags: ["RAG"],
      summary: "Ask a grounded question over post content",
      description: "Embeds the question, retrieves relevant post chunks from MongoDB, and answers using only retrieved context.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RagAskRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Grounded answer with source chunks",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RagAskResponse" },
            },
          },
        },
        "400": { description: "Missing question" },
        "401": { description: "Unauthorized" },
        "503": { description: "RAG service unavailable" },
      },
    },
  },
};
