import { createXai } from "@ai-sdk/xai";
import type { User } from "./auth";
import { userApiKey } from "./auth";

export const DEFAULT_MODEL = "grok-4.6";

export function getXai(user: User) {
  const apiKey = userApiKey(user);
  if (!apiKey) {
    throw new Error(
      "No SpaceXAI API key. Add XAI_API_KEY to .env.local or paste your key in Settings.",
    );
  }
  return createXai({ apiKey });
}

export function getModel(user: User) {
  return getXai(user).responses(DEFAULT_MODEL);
}
