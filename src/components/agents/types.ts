export interface BotInfo {
  bot_id: string;
  name: string;
  owner_id?: string;
  description: string;
  persona: string;
  channels?: Record<string, unknown>;
  model: string | null;
  running: boolean;
  started_at: string | null;
  last_reload_error?: string | null;
  message_count?: number;
}

export interface SoulTemplate {
  id: string;
  name: string;
  content: string;
}

export type AgentsTab = "bots" | "souls";

export interface BotHistoryMessage {
  role: "user" | "assistant";
  content: string;
}
