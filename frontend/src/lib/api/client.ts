import type { ChatRequest, ChatResponse, ModelsResponse } from "@/lib/types/api";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_AURA_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>;
    };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d) => {
          const where = Array.isArray(d.loc) ? d.loc.join(".") : "";
          const msg = d.msg ?? JSON.stringify(d);
          return where ? `${where}: ${msg}` : msg;
        })
        .join("; ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`;
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/models`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<ModelsResponse>;
}

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/chat`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<ChatResponse>;
}
