import { createProvider, type AIProvider } from "@careerpilot/ai";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cached) {
    cached = createProvider({
      provider: process.env.AI_PROVIDER ?? "heuristic",
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL,
    });
  }
  return cached;
}
