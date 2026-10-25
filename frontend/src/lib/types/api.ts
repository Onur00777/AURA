export type ModelItem = {
  name: string;
  path: string;
  size_bytes: number;
};

export type ModelsResponse = {
  models: ModelItem[];
  count: number;
  active_model: string | null;
  defaults: {
    n_ctx: number;
    temperature: number;
  };
};

export type ChatMode = "general" | "engineering";

export type ChatRequest = {
  model: string;
  /** Full active-session history including the latest user turn. */
  messages: Array<{ role: ChatRole; content: string }>;
  /** Selects the server system prompt. Default: general. */
  mode?: ChatMode;
};

export type ChatResponse = {
  reply: string;
  model_used: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  modelUsed?: string;
};
