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

export type NotebookSourceType = "manual" | "chat" | "book" | "code_lab" | "agent"

export interface NotebookNote {
  id: string
  title: string
  content: string
  source_type?: NotebookSourceType
  source_id?: string
  created_at?: string
  updated_at?: string
}

export async function listNotebookNotes(): Promise<NotebookNote[]> {
  const data = await apiFetch<{ notes?: NotebookNote[] }>("/notebook")
  return Array.isArray(data.notes) ? data.notes : []
}

export async function createNotebookNote(input: {
  title: string
  content: string
  source_type?: NotebookSourceType
  source_id?: string
}): Promise<NotebookNote> {
  return apiFetch<NotebookNote>("/notebook", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateNotebookNote(noteId: string, title: string, content: string): Promise<NotebookNote> {
  return apiFetch<NotebookNote>(`/notebook/${encodeURIComponent(noteId)}`, {
    method: "PUT",
    body: JSON.stringify({ title, content }),
  })
}

export async function deleteNotebookNote(noteId: string): Promise<void> {
  await apiFetch<void>(`/notebook/${encodeURIComponent(noteId)}`, { method: "DELETE" })
}
