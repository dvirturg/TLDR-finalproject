export interface ParsedQuery {
  keywords: string[];
  originalQuery: string;
}

type LlmApiResponse = {
  response?: string;
};

type KeywordResponse = {
  keywords: string[];
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

class LlmService {
  private readonly baseUrl: string;
  private readonly credentials: string;
  private readonly cacheTtlMs = Number(process.env["LLM_CACHE_TTL_MS"] || 5 * 60 * 1000);
  private readonly maxCacheEntries = Number(process.env["LLM_CACHE_MAX_ENTRIES"] || 100);
  private readonly requestWindowMs = Number(process.env["LLM_RATE_WINDOW_MS"] || 60 * 1000);
  private readonly maxRequestsPerWindow = Number(process.env["LLM_RATE_MAX_REQUESTS"] || 30);
  private readonly protectionsEnabled = process.env["NODE_ENV"] !== "test";
  private readonly jsonCache = new Map<string, CacheEntry<KeywordResponse>>();
  private readonly textCache = new Map<string, CacheEntry<string>>();
  private requestTimestamps: number[] = [];

  constructor() {
    this.baseUrl = process.env["LLM_BASE_URL"] || "http://10.10.248.41";
    const username = process.env["LLM_USERNAME"] || "student1";
    const password = process.env["LLM_PASSWORD"] || "pass123";
    this.credentials = Buffer.from(`${username}:${password}`).toString("base64");
  }

  private getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    cache.delete(key);
    cache.set(key, entry);
    return entry.value;
  }

  private setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
    const now = Date.now();

    for (const [entryKey, entry] of cache) {
      if (now > entry.expiresAt) {
        cache.delete(entryKey);
      }
    }

    while (cache.size >= this.maxCacheEntries) {
      const oldestKey = cache.keys().next().value;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }

    cache.set(key, {
      expiresAt: now + this.cacheTtlMs,
      value,
    });
  }

  private enforceRateLimit() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.requestWindowMs,
    );

    if (this.requestTimestamps.length >= this.maxRequestsPerWindow) {
      throw new Error("LLM rate limit exceeded");
    }

    this.requestTimestamps.push(now);
  }

  private async generateJson(prompt: string, temperature: number): Promise<KeywordResponse> {
    const cacheKey = JSON.stringify({ type: "json", prompt, temperature });
    if (this.protectionsEnabled) {
      const cached = this.getFromCache(this.jsonCache, cacheKey);
      if (cached) {
        return { keywords: [...cached.keywords] };
      }

      this.enforceRateLimit();
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.credentials}`,
      },
      body: JSON.stringify({
        model: "llama3.1:8b",
        prompt,
        format: "json",
        stream: false,
        options: {
          temperature,
          top_p: 0.9,
          num_predict: 500,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LlmApiResponse;
    if (!data.response) {
      throw new Error("No response from LLM API");
    }

    const parsed = JSON.parse(data.response) as { keywords?: unknown };
    const result = {
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((keyword): keyword is string => typeof keyword === "string" && keyword.length > 0)
        : [],
    };

    if (this.protectionsEnabled) {
      this.setCache(this.jsonCache, cacheKey, { keywords: [...result.keywords] });
    }

    return result;
  }

  async parseSearchQuery(query: string): Promise<ParsedQuery> {
    try {
      const prompt = `Parse this social media post search query and extract the most relevant search keywords as JSON.

Query: "${query}"

You are expanding this query into search keywords for a regex search over social media post text.
Your goal is MAXIMUM RECALL - return every word form and synonym that could appear in a real post about this topic.

Rules:
1. Word forms: include all tenses and forms (run -> run, ran, running, runner, runs)
2. Synonyms: include alternative words with the same meaning (running -> jogging, sprinting, jog)
3. Related activities/objects: include things commonly mentioned together (running -> 10K, marathon, race, mile, distance, workout, exercise, fitness, gym)
4. Exclude only pure stop words: 'posts', 'find', 'show', 'the', 'and', 'or', 'a', 'an', 'about', 'me'
5. Keep each keyword SHORT - single words preferred (regex will do partial matching)

Examples:
- "posts about running" -> ["run", "ran", "running", "runner", "jog", "jogging", "10K", "marathon", "race", "sprint", "fitness", "workout"]
- "coffee morning" -> ["coffee", "espresso", "cafe", "latte", "cappuccino", "morning", "brew", "caffeine", "breakfast", "mug", "beverage", "drink", "barista"]
- "happy hour drinks" -> ["happy", "drinks", "beer", "wine", "cocktail", "bar", "pub", "brew"]
- "coding bugs" -> ["bug", "bugs", "debug", "debugging", "error", "fix", "crash", "issue", "code", "coding"]

Return only valid JSON:
{
  "keywords": ["word1", "word2", "word3", "word4", "word5"]
}

Aim for 5-12 keywords. If nothing meaningful, return the original words split individually.`;

      const { keywords } = await this.generateJson(prompt, 0.2);
      if (keywords.length === 0) {
        return this.fallbackParsing(query);
      }

      return {
        originalQuery: query,
        keywords,
      };
    } catch (error) {
      console.error("LLM service error:", error);
      return this.fallbackParsing(query);
    }
  }

  async generateCompletion(prompt: string, system: string): Promise<string> {
    const cacheKey = JSON.stringify({ type: "text", prompt, system });
    if (this.protectionsEnabled) {
      const cached = this.getFromCache(this.textCache, cacheKey);
      if (cached) {
        return cached;
      }

      this.enforceRateLimit();
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.credentials}`,
      },
      body: JSON.stringify({
        model: "llama3.1:8b",
        prompt: `System Instructions: ${system}\n\nUser Query: ${prompt}`,
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LlmApiResponse;
    if (!data.response) {
      throw new Error("No response from LLM API");
    }

    if (this.protectionsEnabled) {
      this.setCache(this.textCache, cacheKey, data.response);
    }

    return data.response;
  }

  fallbackParsing(query: string): ParsedQuery {
    const stopWords = new Set([
      "the", "and", "or", "in", "from", "with", "by", "a", "an", "of",
      "to", "for", "is", "are", "was", "were", "posts", "about", "find",
      "show", "me", "i", "want", "give", "get", "search",
    ]);

    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    return {
      keywords: keywords.length > 0 ? keywords : [query],
      originalQuery: query,
    };
  }

  async extractInterestsFromLikes(likedPostTexts: string[]): Promise<KeywordResponse> {
    if (likedPostTexts.length === 0) {
      return { keywords: [] };
    }

    const combinedText = likedPostTexts
      .map((text, index) => `Post ${index + 1}: ${text}`)
      .join("\n");

    const prompt = `Analyze these social media posts that a user recently liked and infer their broad interests.

Liked posts:
${combinedText}

Extract 5 to 10 broad, single-word keywords representing the user's interests.
Rules:
1. Use only single-word broad topics.
2. Do not include phrases or explanations.
3. Return strictly valid JSON.

Return only:
{
  "keywords": ["word1", "word2", "word3"]
}`;
console.log("LLM prompt for interest extraction:", prompt);
    try {
      return await this.generateJson(prompt, 0.3);
    } catch (error) {
      console.error("LLM service error:", error);
      return { keywords: [] };
    }
  }
}

export default new LlmService();
