import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { XaiProvider } from "@ai-sdk/xai";
import {
  bumpSkill,
  dueFlashcards,
  listSkills,
  saveFlashcard,
  saveMemory,
  saveReport,
  saveSkill,
  searchKnowledge,
  searchMemories,
  upsertTopic,
} from "./store";
import type { AgentMode } from "../types";

export function agentTools(userId: string, mode: AgentMode, xai: XaiProvider): ToolSet {
  const custom = {
    saveMemory: tool({
      description:
        "Save a durable memory about the user: a fact, preference, goal, or lesson from a mistake.",
      inputSchema: z.object({
        kind: z.enum(["fact", "preference", "goal", "lesson"]),
        content: z.string().describe("One concise, standalone sentence"),
      }),
      execute: async ({ kind, content }) => saveMemory({ userId, kind, content, source: mode }),
    }),
    searchMemory: tool({
      description: "Search previously saved memories about this user.",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => ({ results: await searchMemories(userId, query) }),
    }),
    searchKnowledge: tool({
      description: "Search the user's uploaded documents and notes.",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => ({ results: await searchKnowledge(userId, query) }),
    }),
    saveSkill: tool({
      description:
        "Save or update a reusable skill/procedure the agent should follow next time.",
      inputSchema: z.object({
        name: z.string().describe("Short skill name, like 'srs-review-session'"),
        description: z.string(),
        body: z.string().describe("Step-by-step procedure in markdown"),
      }),
      execute: async ({ name, description, body }) =>
        saveSkill({ userId, name, description, body }),
    }),
    listSkills: tool({
      description: "List skills this agent has already learned for this user.",
      inputSchema: z.object({}),
      execute: async () => ({ skills: await listSkills(userId) }),
    }),
    useSkill: tool({
      description: "Mark a named skill as used so it ranks higher next time.",
      inputSchema: z.object({ name: z.string() }),
      execute: async ({ name }) => {
        await bumpSkill(userId, name);
        return { ok: true };
      },
    }),
    updateMastery: tool({
      description: "Update how well the user knows a topic, 0-100.",
      inputSchema: z.object({
        topic: z.string(),
        mastery: z.number().min(0).max(100),
        note: z.string().optional(),
      }),
      execute: async ({ topic, mastery, note }) =>
        upsertTopic({ userId, name: topic, mastery, description: note }),
    }),
    saveFlashcard: tool({
      description: "Create a spaced-repetition flashcard for the user.",
      inputSchema: z.object({
        topic: z.string().optional(),
        front: z.string(),
        back: z.string(),
      }),
      execute: async ({ topic, front, back }) =>
        saveFlashcard({ userId, topic, front, back }),
    }),
    dueFlashcards: tool({
      description: "Fetch flashcards that are due for review.",
      inputSchema: z.object({}),
      execute: async () => ({ cards: await dueFlashcards(userId) }),
    }),
    saveResearchReport: tool({
      description: "Save a finished research report into the user's library.",
      inputSchema: z.object({
        title: z.string(),
        query: z.string(),
        content: z.string().describe("Markdown report"),
        sources: z.array(z.string()).default([]),
      }),
      execute: async ({ title, query, content, sources }) =>
        saveReport({ userId, title, query, content, sources }),
    }),
  };

  if (mode === "research" || mode === "work") {
    return {
      ...custom,
      web_search: xai.tools.webSearch({}),
    };
  }
  return custom;
}
