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

class LlmService {
  private readonly baseUrl: string;
  private readonly credentials: string;

  constructor() {
    this.baseUrl = process.env["LLM_BASE_URL"] || "http://10.10.248.41";
    const username = process.env["LLM_USERNAME"] || "student1";
    const password = process.env["LLM_PASSWORD"] || "pass123";
    this.credentials = Buffer.from(`${username}:${password}`).toString("base64");
  }

  private async generateJson(prompt: string, temperature: number): Promise<KeywordResponse> {
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
    return {
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((keyword): keyword is string => typeof keyword === "string" && keyword.length > 0)
        : [],
    };
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

    try {
      return await this.generateJson(prompt, 0.3);
    } catch (error) {
      console.error("LLM service error:", error);
      return { keywords: [] };
    }
  }
}

export default new LlmService();
