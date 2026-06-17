import { API_BASE } from "@/lib/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("eq_access_token")
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string>),
  }
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
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

export interface KnowledgeBaseSummary {
  id: string
  name: string
  description?: string
  status?: string
  document_count?: number
  is_default?: boolean
}

export interface KbFileInfo {
  name: string
  size: number
  modified: number
  mime_type?: string
  preview_url?: string
}

export interface KbSearchChunk {
  id: string
  content: string
  summary?: string
  keywords?: string[]
  source_page?: number
  book_id?: string
}

export async function listKnowledgeBases(): Promise<KnowledgeBaseSummary[]> {
  const data = await apiFetch<KnowledgeBaseSummary[] | { knowledge_bases?: KnowledgeBaseSummary[]; items?: KnowledgeBaseSummary[] }>("/knowledge/list")
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.knowledge_bases)) return data.knowledge_bases!
  if (Array.isArray(data?.items)) return data.items!
  return []
}

export async function createKnowledgeBase(name: string, description = ""): Promise<KnowledgeBaseSummary> {
  return apiFetch<KnowledgeBaseSummary>("/knowledge", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  })
}

export async function deleteKnowledgeBase(name: string): Promise<void> {
  await apiFetch<void>(`/knowledge/${encodeURIComponent(name)}`, { method: "DELETE" })
}

export async function listKbFiles(name: string): Promise<KbFileInfo[]> {
  const data = await apiFetch<{ files?: KbFileInfo[] }>(`/knowledge/${encodeURIComponent(name)}/files`)
  return Array.isArray(data.files) ? data.files : []
}

export async function uploadKbDocument(kbId: string, file: File): Promise<unknown> {
  const form = new FormData()
  form.append("document", file)
  return apiFetch<unknown>(`/knowledge/${encodeURIComponent(kbId)}/documents`, {
    method: "POST",
    body: form,
  })
}

export async function searchKnowledgeBase(name: string, query: string, limit = 5): Promise<KbSearchChunk[]> {
  const data = await apiFetch<{ chunks?: KbSearchChunk[] }>(
    `/knowledge/${encodeURIComponent(name)}/search`,
    { method: "POST", body: JSON.stringify({ query, limit }) },
  )
  return Array.isArray(data.chunks) ? data.chunks : []
}

export async function reindexKnowledgeBase(name: string): Promise<void> {
  await apiFetch<void>(`/knowledge/${encodeURIComponent(name)}/reindex`, { method: "POST" })
}
