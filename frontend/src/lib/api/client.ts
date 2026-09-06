import type { ChatRequest, ChatResponse, ModelsResponse } from "@/lib/types/api";

export function getApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_AURA_API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  // Same-origin via Next.js rewrite → FastAPI. Avoids CORS and dead 8000 fetches.
  return "";
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

function friendlyFetchError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      "Backend is not running. From the AURA project root run: python server.py",
    );
  }
  return err instanceof Error ? err : new Error("Request failed");
}

export async function fetchModels(): Promise<ModelsResponse> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/models`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json() as Promise<ModelsResponse>;
  } catch (err) {
    throw friendlyFetchError(err);
  }
}

export async function postChat(body: ChatRequest): Promise<ChatResponse> {
  try {
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
  } catch (err) {
    throw friendlyFetchError(err);
  }
}
