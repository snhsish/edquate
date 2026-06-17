import { API_BASE } from "@/lib/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("eq_access_token")
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string>),
    },
    credentials: "include",
  })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("eq_access_token")
      localStorage.removeItem("eq_token_expiry")
      window.location.href = "/login"
      throw new Error("Session expired")
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
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface SpaceFeedItem {
  id: string
  type: "chat" | "book" | "knowledge" | "notebook"
  title: string
  subtitle?: string
  updated_at: string
  link?: string
  metadata?: Record<string, unknown>
}

export interface SpaceStats {
  sessions: number
  books: number
  knowledge_bases: number
  notebooks: number
  memory_fresh: boolean
  last_memory_at?: string
}

export interface SpaceSearchResult {
  type: string
  id: string
  title: string
  link: string
}

export async function fetchSpaceFeed(limit = 30): Promise<SpaceFeedItem[]> {
  const data = await apiFetch<{ items?: SpaceFeedItem[] }>(`/space/feed?limit=${limit}`)
  return Array.isArray(data.items) ? data.items : []
}

export async function fetchSpaceStats(): Promise<SpaceStats> {
  return apiFetch<SpaceStats>("/space/stats")
}

export async function searchSpace(query: string, limit = 20): Promise<SpaceSearchResult[]> {
  const data = await apiFetch<{ results?: SpaceSearchResult[] }>(
    `/space/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  )
  return Array.isArray(data.results) ? data.results : []
}
