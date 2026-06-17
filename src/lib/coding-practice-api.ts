import { API_BASE } from "@/lib/api"

const TOKEN_KEY = "eq_access_token"

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}/coding-practice${path}`, {
      ...init,
      headers,
      credentials: "include",
    })
  } catch (err) {
    throw new Error(err instanceof TypeError ? `Network error: ${err.message}` : `Request failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = "/login"
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

  return res.json()
}

export type CodingSampleTest = {
  args: unknown[]
  expected: unknown
}

export type CodingProblemPayload = {
  problem_id: string
  title: string
  description: string
  starter_code: string
  topic: string
  difficulty: string
  language: string
  entrypoint: string
  sample_tests?: CodingSampleTest[]
  hints: string[]
  offline?: boolean
}

export type CodingTestRow = {
  ok: boolean
  index: number
  got?: string | null
  expected?: string | null
  error?: string | null
}

export type CodingRunResult = {
  stdout: string
  stderr: string
  exit_code: number
  elapsed_ms: number
  all_passed?: boolean
  tests?: CodingTestRow[]
}

export type CodingSubmitResult = {
  all_passed: boolean
  awarded_xp: number
  tests: CodingTestRow[]
  stdout: string
  stderr: string
  exit_code: number
  streak_current: number
  total_xp: number
  solve_seconds?: number | null
  newly_unlocked?: {
    badge_id: string
    icon: string
    title: string
    description: string
    unlocked_at?: string
  }[]
}

export type CodingToolchainInfo = {
  available: boolean
  path?: string | null
  message: string
}

export type CodingToolchainsResponse = {
  languages: Record<string, CodingToolchainInfo>
}

export async function fetchCodingToolchains(): Promise<CodingToolchainsResponse> {
  return apiFetch<CodingToolchainsResponse>("/toolchains")
}

export async function fetchCodingProblem(
  params: { topic?: string; difficulty?: string; language?: string; nonce?: string },
  init?: { signal?: AbortSignal },
): Promise<CodingProblemPayload> {
  const sp = new URLSearchParams()
  if (params.topic) sp.set("topic", params.topic)
  if (params.difficulty) sp.set("difficulty", params.difficulty)
  if (params.language) sp.set("language", params.language)
  sp.set("nonce", params.nonce ?? String(Date.now()))
  return apiFetch<CodingProblemPayload>(`/problem?${sp}`, { signal: init?.signal })
}

export async function runCodingSnippet(
  payload: { problem_id: string; code: string },
  init?: { signal?: AbortSignal },
): Promise<CodingRunResult> {
  return apiFetch<CodingRunResult>("/run", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: init?.signal,
  })
}

export async function submitCodingSolution(
  payload: { problem_id: string; code: string; solve_seconds?: number; submit_attempt?: number },
  init?: { signal?: AbortSignal },
): Promise<CodingSubmitResult> {
  return apiFetch<CodingSubmitResult>("/submit", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: init?.signal,
  })
}
