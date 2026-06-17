export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4700/api/v2"

const TOKEN_KEY = "eq_access_token"
const TOKEN_EXPIRY_KEY = "eq_token_expiry"

let _onTokenExpired: (() => void) | null = null

export function onTokenExpired(callback: () => void) {
  _onTokenExpired = callback
  return () => { _onTokenExpired = null }
}

function broadcastTokenExpired() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  if (_onTokenExpired) _onTokenExpired()
  else window.location.href = "/login"
}

export interface AuthUser {
  user_id: string
  username: string
  role: string
  display_name: string
}

export interface LoginResponse {
  ok: boolean
  role: string
  access_token: string
}

export interface RegisterResponse {
  ok: boolean
  role: string
  is_first_user: boolean
  needs_email_verification: boolean
}

export interface StatusResponse {
  enabled: boolean
  authenticated: boolean
  user_id?: string
  username?: string
  role?: string
  display_name?: string
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  return token
}

function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  const payload = decodeJwtPayload(token)
  const expMs = payload?.exp ? (payload.exp as number) * 1000 : Date.now() + 3600_000
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expMs))
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  return {
    user_id: (payload.sub as string) || "",
    username: (payload.email as string) || "",
    role: (payload.role as string) || "student",
    display_name: (payload.email as string)?.split("@")[0] || "",
  }
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
  } catch (err) {
    const msg =
      err instanceof TypeError
        ? `Network error: ${err.message}`
        : `Request failed: ${err instanceof Error ? err.message : String(err)}`
    throw new Error(msg)
  }

  if (!res.ok) {
    if (res.status === 401) {
      broadcastTokenExpired()
      throw new Error("Session expired. Please log in again.")
    }
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
      else if (body.error) detail = body.error
      else if (body.message) detail = body.message
    } catch {
      // Response body is not JSON — use status text
      if (res.statusText) detail = `${res.status} ${res.statusText}`
    }
    throw new Error(detail)
  }

  return res.json()
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await authFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  if (data.ok && data.access_token) {
    storeToken(data.access_token)
  }
  return data
}

export async function register(
  email: string,
  password: string,
): Promise<RegisterResponse> {
  return authFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function checkAuthStatus(): Promise<StatusResponse> {
  return authFetch<StatusResponse>("/auth/status")
}

export async function logout(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" })
  } finally {
    clearToken()
  }
}

// ── Chat Types ──────────────────────────────────────────────────────────

export interface Message {
  id: number
  session_id: string
  role: "user" | "assistant"
  content: string
  capability: string
  events: unknown[]
  attachments: unknown[]
  metadata: Record<string, unknown>
  created_at: string
  parent_message_id: number | null
}

export interface Session {
  id: string
  session_id: string
  title: string
  created_at: string
  updated_at: string
  status: string
  is_shared: boolean
  preferences: { mode: string; selected_branches: Record<string, number> }
  messages: Message[]
  active_turns: unknown[]
}

export interface ChatStreamRequest {
  message: string
  session_id?: string
  mode?: string
  kb_name?: string
  enable_rag?: boolean
  memory_facets?: string[]
}

export type SSEStatusEvent = { type: "status"; stage: string; message: string }
export type SSEStreamEvent = { type: "stream"; content: string }
export type SSEDoneEvent = { type: "done" }
export type SSEErrorEvent = { type: "error"; message: string }
export type SSEUpgradeRequiredEvent = { type: "upgrade_required"; feature: string; message: string; code: string }

export type SSEEvent =
  | SSEStatusEvent
  | SSEStreamEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEUpgradeRequiredEvent

// ── Chat API Functions ──────────────────────────────────────────────────

export async function createSession(title = "New chat", mode = "deep_learn"): Promise<Session> {
  const data = await authFetch<{ session: Session } | Session>("/sessions/", {
    method: "POST",
    body: JSON.stringify({ title, mode }),
  })
  return "session" in data ? data.session : data
}

export async function getSession(sessionId: string): Promise<Session> {
  return authFetch<Session>(`/sessions/${sessionId}`)
}

export interface ChatSessionSummary {
  id: string
  session_id: string
  title: string
  last_message?: string
  message_count?: number
  updated_at?: number
  preferences?: { mode?: string }
}

export async function listChatSessions(limit = 50, offset = 0): Promise<ChatSessionSummary[]> {
  const data = await authFetch<unknown>(`/sessions/?limit=${limit}&offset=${offset}`)
  if (Array.isArray(data)) return data as ChatSessionSummary[]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.sessions)) return obj.sessions as ChatSessionSummary[]
    if (Array.isArray(obj.items)) return obj.items as ChatSessionSummary[]
    if (Array.isArray(obj.data)) return obj.data as ChatSessionSummary[]
  }
  return []
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const token = getStoredToken()
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ title }),
    credentials: "include",
  })
  if (!res.ok) {
    if (res.status === 401) { broadcastTokenExpired(); return }
    throw new Error(`Failed to rename session (${res.status})`)
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const token = getStoredToken()
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })
  if (!res.ok) {
    if (res.status === 401) { broadcastTokenExpired(); return }
    throw new Error(`Failed to delete session (${res.status})`)
  }
}

export async function listSessions(limit = 50, offset = 0): Promise<Session[]> {
  const data = await authFetch<unknown>(`/sessions/?limit=${limit}&offset=${offset}`)
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.sessions)) return obj.sessions
    if (Array.isArray(obj.items)) return obj.items
    if (Array.isArray(obj.data)) return obj.data
  }
  return []
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = getStoredToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

export async function chatStream(
  request: ChatStreamRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
    credentials: "include",
    signal,
  })

  if (!res.ok) {
    if (res.status === 401) {
      broadcastTokenExpired()
      throw new Error("Session expired. Please log in again.")
    }
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
      else if (body.error) detail = body.error
      else if (body.message) detail = body.message
    } catch {
      if (res.statusText) detail = `${res.status} ${res.statusText}`
    }
    throw new Error(detail)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("Response body is not readable")

  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith("data: ")) {
        const raw = line.slice(6)
        try {
          const data = JSON.parse(raw)
          switch (currentEvent) {
            case "status":
              onEvent({ type: "status", stage: data.stage, message: data.message })
              break
            case "stream":
              onEvent({ type: "stream", content: data.content })
              break
            case "done":
              onEvent({ type: "done" })
              break
            case "error":
              onEvent({ type: "error", message: data.message })
              break
            case "upgrade_required":
              onEvent({ type: "upgrade_required", feature: data.feature, message: data.message, code: data.code })
              break
          }
        } catch {
          // skip malformed JSON
        }
        currentEvent = ""
      }
    }
  }
}
