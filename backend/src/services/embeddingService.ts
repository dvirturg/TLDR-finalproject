import { GoogleGenAI } from "@google/genai";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const hashToken = (token: string) => {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const normalizeVector = (values: number[]) => {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return values;
  return values.map((value) => value / magnitude);
};

class EmbeddingService {
  private client: GoogleGenAI | null = null;

  get model() {
    return process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  }

  get dimensions() {
    return readPositiveInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 768);
  }

  private get timeoutMs() {
    return readPositiveInt(process.env.GEMINI_EMBEDDING_TIMEOUT_MS, 15000);
  }

  private get shouldUseMockEmbeddings() {
    return process.env.NODE_ENV === "test" || process.env.GEMINI_MOCK_EMBEDDINGS === "true";
  }

  private getClient() {
    if (this.client) return this.client;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for Gemini embeddings");
    }

    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  private createMockEmbedding(text: string) {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    const tokens = text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    for (const token of tokens) {
      vector[hashToken(token) % this.dimensions] += 1;
    }

    return normalizeVector(vector);
  }

  async embedText(text: string, taskType: EmbeddingTaskType): Promise<number[]> {
    const input = text.trim();
    if (!input) {
      throw new Error("Cannot embed empty text");
    }

    if (this.shouldUseMockEmbeddings) {
      return this.createMockEmbedding(input);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.getClient().models.embedContent({
        model: this.model,
        contents: input,
        config: {
          taskType,
          outputDimensionality: this.dimensions,
          abortSignal: controller.signal,
        },
      });

      const embedding = response.embeddings?.[0]?.values;
      if (!embedding || embedding.length === 0) {
        throw new Error("Gemini embedding response did not include values");
      }

      if (embedding.length !== this.dimensions) {
        throw new Error(`Gemini embedding dimensions mismatch: expected ${this.dimensions}, got ${embedding.length}`);
      }

      return normalizeVector(embedding);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default new EmbeddingService();
