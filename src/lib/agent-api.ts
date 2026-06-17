import { API_BASE } from "@/lib/api"
import type { BotInfo, BotHistoryMessage, SoulTemplate } from "@/components/agents/types"

export interface AgentSummary {
  bot_id: string
  name: string
  message_count?: number
  description?: string
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("eq_access_token")
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("eq_access_token")
      localStorage.removeItem("eq_token_expiry")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
      else if (body.message) detail = body.message
      else if (body.error) detail = body.error
    } catch {
      if (res.statusText) detail = `${res.status} ${res.statusText}`
    }
    throw new Error(detail)
  }

  return res.json()
}

function mapBot(raw: Record<string, unknown>): BotInfo {
  return {
    bot_id: String(raw.bot_id ?? raw.id ?? ""),
    name: String(raw.name ?? "Untitled bot"),
    owner_id: raw.owner_id ? String(raw.owner_id) : undefined,
    description: String(raw.description ?? ""),
    persona: String(raw.persona ?? ""),
    channels: raw.channels as BotInfo["channels"],
    model: raw.model ? String(raw.model) : null,
    running: Boolean(raw.running),
    started_at: raw.started_at ? String(raw.started_at) : null,
    last_reload_error: raw.last_reload_error
      ? String(raw.last_reload_error)
      : null,
    message_count: Number(raw.message_count ?? 0),
  }
}

function mapSoul(raw: Record<string, unknown>): SoulTemplate {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    content: String(raw.content ?? ""),
  }
}

export async function listAgentSummaries(): Promise<AgentSummary[]> {
  const bots = await listBots()
  return bots.map((b) => ({
    bot_id: b.bot_id,
    name: b.name,
    message_count: b.message_count,
    description: b.description || undefined,
  }))
}

export async function listBots(): Promise<BotInfo[]> {
  const data = await apiFetch<unknown>("/tutorbot")
  if (!Array.isArray(data)) return []
  return data.map((b) => mapBot(b as Record<string, unknown>))
}

export async function getAgent(botId: string): Promise<BotInfo> {
  const data = await apiFetch<Record<string, unknown>>(
    `/tutorbot/${encodeURIComponent(botId)}`,
  )
  return mapBot(data)
}

export async function createAgent(payload: {
  bot_id: string
  name: string
  description?: string
  persona?: string
  soul_template_id?: string
}): Promise<BotInfo> {
  const data = await apiFetch<Record<string, unknown>>("/tutorbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return mapBot(data)
}

export async function startAgent(botId: string): Promise<BotInfo> {
  const data = await apiFetch<Record<string, unknown>>("/tutorbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bot_id: botId }),
  })
  return mapBot(data)
}

export async function patchAgent(
  botId: string,
  patch: Record<string, unknown>,
): Promise<BotInfo> {
  const data = await apiFetch<Record<string, unknown>>(
    `/tutorbot/${encodeURIComponent(botId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  )
  return mapBot(data)
}

export async function stopAgent(botId: string): Promise<void> {
  await apiFetch(`/tutorbot/${encodeURIComponent(botId)}`, {
    method: "DELETE",
  })
}

export async function destroyAgent(botId: string): Promise<void> {
  await apiFetch(
    `/tutorbot/${encodeURIComponent(botId)}/destroy`,
    { method: "DELETE" },
  )
}

export async function listSouls(): Promise<SoulTemplate[]> {
  const data = await apiFetch<unknown>("/tutorbot/souls")
  if (!Array.isArray(data)) return []
  return data.map((s) => mapSoul(s as Record<string, unknown>))
}

export async function createSoul(payload: {
  id?: string
  name: string
  content: string
}): Promise<SoulTemplate> {
  const data = await apiFetch<Record<string, unknown>>("/tutorbot/souls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return mapSoul(data)
}

export async function updateSoul(
  soulId: string,
  payload: { name: string; content: string },
): Promise<void> {
  await apiFetch(
    `/tutorbot/souls/${encodeURIComponent(soulId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteSoul(soulId: string): Promise<void> {
  await apiFetch(
    `/tutorbot/souls/${encodeURIComponent(soulId)}`,
    { method: "DELETE" },
  )
}

export async function getBotHistory(
  botId: string,
): Promise<BotHistoryMessage[]> {
  const data = await apiFetch<unknown>(
    `/tutorbot/${encodeURIComponent(botId)}/history`,
  )
  if (!Array.isArray(data)) return []
  return data
    .filter((m): m is Record<string, unknown> =>
      typeof m === "object" && m !== null,
    )
    .map((m) => ({
      role: (m.role === "user" || m.role === "assistant")
        ? (m.role as "user" | "assistant")
        : "user" as const,
      content: String(m.content ?? ""),
    }))
    .filter((m) => m.role === "user" || m.role === "assistant")
}

export function streamAgentMessage(
  botId: string,
  message: string,
  handlers: {
    onToken: (token: string) => void
    onError: (error: string) => void
    onComplete: () => void
  },
): void {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  fetch(`${API_BASE}/tutorbot/${encodeURIComponent(botId)}/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("eq_access_token")
          localStorage.removeItem("eq_token_expiry")
          handlers.onError("Please sign in to continue.")
          return
        }
        const data = (await response.json().catch(() => ({}))) as {
          message?: string
          detail?: string
        }
        handlers.onError(
          data.message ?? data.detail ?? "Failed to send message",
        )
        return
      }

      if (!response.body) {
        handlers.onError("Streaming is not supported in this browser")
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          handlers.onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split("\n\n")
        buffer = chunks.pop() ?? ""

        for (const chunk of chunks) {
          const parts = chunk.split("\n")
          let eventType = "message"
          let dataRaw = ""

          for (const part of parts) {
            if (part.startsWith("event: ")) {
              eventType = part.slice(7).trim()
            } else if (part.startsWith("data: ")) {
              dataRaw = part.slice(6).trim()
            }
          }

          if (!dataRaw) continue

          try {
            const data = JSON.parse(dataRaw) as {
              content?: string
              message?: string
            }

            if (eventType === "stream") {
              handlers.onToken(data.content ?? "")
            } else if (eventType === "error") {
              handlers.onError(data.message ?? "Request failed")
            } else if (eventType === "done") {
              handlers.onComplete()
              return
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    })
    .catch((err: unknown) => {
      handlers.onError(
        err instanceof Error ? err.message : "Failed to connect to server",
      )
    })
}
