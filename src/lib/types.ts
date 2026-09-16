export const MODES = ["work", "tutor", "research", "knowledge"] as const;
export type AgentMode = (typeof MODES)[number];

export function isMode(value: unknown): value is AgentMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}
