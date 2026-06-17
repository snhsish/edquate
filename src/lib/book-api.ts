import { API_BASE, getAuthHeaders } from "@/lib/api"
import type {
  Book,
  BookDetail,
  BookModuleInfo,
  BookOutline,
  ChapterBlocks,
  Chapter,
  CreateBookRequest,
  ExportFormat,
  GenerationJob,
  IngestResult,
  OutlineChapter,
  ProgressEvent,
  Section,
} from "@/lib/book-types"

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (body.detail) return body.detail
    if (body.error) return body.error
    if (body.message) return body.message
  } catch {
    // not json
  }
  return res.statusText || `Request failed (${res.status})`
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    credentials: "include",
  })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("eq_access_token")
      localStorage.removeItem("eq_token_expiry")
      window.location.href = "/login"
      throw new Error("Session expired")
    }
    throw new Error(await parseError(res))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function fetchBookModules(): Promise<BookModuleInfo> {
  return apiFetch<BookModuleInfo>("/book/modules")
}

export async function listBooks(): Promise<Book[]> {
  const data = await apiFetch<Book[] | null>("/book/")
  return Array.isArray(data) ? data : []
}

export async function createBook(req: CreateBookRequest): Promise<Book> {
  return apiFetch<Book>("/book/", {
    method: "POST",
    body: JSON.stringify(req),
  })
}

export async function getBook(bookId: string): Promise<Book> {
  return apiFetch<Book>(`/book/${bookId}`)
}

export async function getBookDetail(bookId: string): Promise<BookDetail> {
  const data = await apiFetch<BookDetail>(`/book/${bookId}/detail`)
  return {
    ...data,
    chapters: Array.isArray(data.chapters) ? data.chapters : [],
  }
}

export async function generateOutline(bookId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/book/${bookId}/outline/generate`, {
    method: "POST",
  })
}

export async function getOutline(bookId: string): Promise<BookOutline | null> {
  return apiFetch<BookOutline | null>(`/book/${bookId}/outline`)
}

export async function approveOutline(
  bookId: string,
  chapters?: OutlineChapter[],
): Promise<BookOutline> {
  return apiFetch<BookOutline>(`/book/${bookId}/outline/approve`, {
    method: "PUT",
    body: JSON.stringify({ chapters: chapters ?? [] }),
  })
}

export async function startBookGeneration(bookId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/book/${bookId}/generate`, {
    method: "POST",
  })
}

export async function getGenerationProgress(
  bookId: string,
): Promise<ProgressEvent | null> {
  return apiFetch<ProgressEvent | null>(`/book/${bookId}/progress`)
}

export async function getChapter(
  bookId: string,
  chapterId: string,
): Promise<{ chapter: Chapter; sections: Section[] }> {
  return apiFetch(`/book/${bookId}/chapters/${chapterId}`)
}

export async function regenerateChapter(
  bookId: string,
  chapterId: string,
): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(
    `/book/${bookId}/chapters/${chapterId}/regenerate`,
    { method: "POST" },
  )
}

export async function getJob(
  bookId: string,
  jobId: string,
): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/book/${bookId}/jobs/${jobId}`)
}

export async function retryJob(
  bookId: string,
  jobId: string,
): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/book/${bookId}/jobs/${jobId}/retry`, {
    method: "POST",
  })
}

export async function getChapterBlocks(
  bookId: string,
  chapterId: string,
): Promise<ChapterBlocks> {
  return apiFetch<ChapterBlocks>(
    `/book/${bookId}/chapters/${chapterId}/blocks`,
  )
}

export async function ingestDocument(
  bookId: string,
  file: File,
): Promise<IngestResult> {
  const form = new FormData()
  form.append("file", file)
  const headers = await getAuthHeaders()
  delete (headers as Record<string, string>)["Content-Type"]
  const res = await fetch(`${API_BASE}/book/${bookId}/ingest`, {
    method: "POST",
    headers: { ...headers, credentials: "include" },
    body: form,
    credentials: "include",
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<IngestResult>
}

export function exportBookUrl(bookId: string, format: ExportFormat): string {
  return `${API_BASE}/book/${bookId}/export/${format}`
}

export async function downloadBookExport(
  bookId: string,
  format: ExportFormat,
): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(exportBookUrl(bookId, format), {
    headers,
    credentials: "include",
  })
  if (!res.ok) throw new Error(await parseError(res))
  const blob = await res.blob()
  const disposition = res.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="(.+)"/)
  const filename = match?.[1] ?? `book.${format}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function subscribeBookProgress(
  bookId: string,
  handlers: {
    onProgress: (evt: ProgressEvent) => void
    onDone: () => void
    onError: (msg: string) => void
  },
): () => void {
  const controller = new AbortController()
  const baseUrl = API_BASE.replace("/api/v2", "")

  ;(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${baseUrl}/api/v2/book/${bookId}/stream`, {
        signal: controller.signal,
        headers,
        credentials: "include",
      })
      if (!res.ok) {
        handlers.onError(await parseError(res))
        return
      }
      if (!res.body) {
        handlers.onError("Streaming not supported")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let sawTerminalEvent = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split("\n\n")
        buffer = chunks.pop() ?? ""

        for (const chunk of chunks) {
          let eventType = "message"
          let dataRaw = ""
          for (const line of chunk.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim()
            else if (line.startsWith("data: ")) dataRaw = line.slice(6).trim()
          }
          if (!dataRaw) continue

          try {
            if (eventType === "progress") {
              handlers.onProgress(JSON.parse(dataRaw) as ProgressEvent)
            } else if (eventType === "done") {
              sawTerminalEvent = true
              handlers.onDone()
            } else if (eventType === "error") {
              sawTerminalEvent = true
              const data = JSON.parse(dataRaw) as { message?: string }
              handlers.onError(data.message ?? "Stream error")
            }
          } catch {
            // skip malformed
          }
          if (sawTerminalEvent) return
        }
      }

      if (!sawTerminalEvent) {
        handlers.onError("Progress stream ended unexpectedly")
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        handlers.onError(
          err instanceof Error ? err.message : "Stream failed",
        )
      }
    }
  })()

  return () => controller.abort()
}
