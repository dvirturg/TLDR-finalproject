export interface TextChunk {
  chunkIndex: number;
  text: string;
}

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

class ChunkingService {
  get chunkSize() {
    return readPositiveInt(process.env.RAG_CHUNK_SIZE, 900);
  }

  get overlap() {
    const configuredOverlap = readPositiveInt(process.env.RAG_CHUNK_OVERLAP, 120);
    return Math.min(configuredOverlap, this.chunkSize - 1);
  }

  normalizeText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  chunkText(text: string): TextChunk[] {
    const normalized = this.normalizeText(text);
    if (!normalized) return [];

    if (normalized.length <= this.chunkSize) {
      return [{ chunkIndex: 0, text: normalized }];
    }

    const chunks: TextChunk[] = [];
    let start = 0;

    while (start < normalized.length) {
      const maxEnd = Math.min(start + this.chunkSize, normalized.length);
      let end = maxEnd;

      if (maxEnd < normalized.length) {
        const lastSpace = normalized.lastIndexOf(" ", maxEnd);
        if (lastSpace > start + Math.floor(this.chunkSize * 0.6)) {
          end = lastSpace;
        }
      }

      const chunk = normalized.slice(start, end).trim();
      if (chunk) {
        chunks.push({ chunkIndex: chunks.length, text: chunk });
      }

      if (end >= normalized.length) break;
      start = Math.max(end - this.overlap, start + 1);
    }

    return chunks;
  }
}

export default new ChunkingService();
