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
  return res.json() as Promise<T>
}

export type MemoryFacet = "journey" | "strengths" | "gaps" | "preferences"

export interface MemorySnapshot {
  journey: Record<string, unknown>
  strengths: Record<string, unknown>
  gaps: Record<string, unknown>
  preferences: Record<string, unknown>
  facets_meta: Record<string, { updated_at?: string }>
}

export async function fetchMemory(): Promise<MemorySnapshot> {
  return apiFetch<MemorySnapshot>("/memory")
}

export async function updateMemoryFacet(
  facet: MemoryFacet,
  content: Record<string, unknown>,
): Promise<MemorySnapshot> {
  return apiFetch<MemorySnapshot>(`/memory/${facet}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  })
}

export async function consolidateMemory(): Promise<MemorySnapshot> {
  return apiFetch<MemorySnapshot>("/memory/consolidate", { method: "POST" })
}

export async function clearMemoryFacet(facet: MemoryFacet): Promise<MemorySnapshot> {
  return apiFetch<MemorySnapshot>(`/memory/${facet}`, { method: "DELETE" })
}
