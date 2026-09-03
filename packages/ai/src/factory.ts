import { HeuristicProvider } from "./heuristic";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { AIProvider } from "./types";

export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export function createProvider(config: ProviderConfig): AIProvider {
  if (config.provider === "openai-compatible" && config.apiKey && config.baseURL) {
    return new OpenAICompatibleProvider({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model ?? "gpt-4o-mini",
    });
  }
  return new HeuristicProvider();
}
