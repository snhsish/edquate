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
    res = await fetch(`${API_BASE}${path}`, {
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

export type PracticeHighlight = "codelab" | "book" | "chat" | "revision" | "quiz" | "exam"

export type PracticeRecommendation = {
  kind: string
  title: string
  description?: string
  href: string
  highlight?: PracticeHighlight
}

export type PracticeHubResponse = {
  recommended: PracticeRecommendation[]
  coding: {
    solves_today: number
    suggested_topic: string
    streak_current: number
  }
  books: {
    total_items: number
    books: { id: string; title: string; item_count: number }[]
  }
  revision: {
    due_count: number
  }
  active_milestone?: {
    id: string
    title: string
    trigger_actions?: string[]
    skills?: string[]
  } | null
  quizzes?: {
    completed_today: number
    suggested_topic: string
  }
}

export type PracticeQuestionOption = { key: string; text: string }

export type PracticeQuestion = {
  id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  question: string
  options: PracticeQuestionOption[]
  tags?: string[]
}

export type PracticeQuizResponse = {
  quiz_id: string
  items: PracticeQuestion[]
  generated: boolean
  offline?: boolean
}

export type PracticeCheckResult = {
  question_id: string
  correct: string
  is_correct: boolean
  explanation: string
}

export type PracticeSubmitResult = {
  score: {
    correct: number
    incorrect: number
    total: number
    percentage: number
    per_topic?: Record<string, { correct: number; incorrect: number }>
  }
  awarded_xp: number
  events?: unknown[]
}

export type MockExamStartResult = {
  quiz_id: string
  items: PracticeQuestion[]
  timer_sec: number
  expires_at_ms: number
  question_count: number
  topic: string
  offline?: boolean
  generated?: boolean
}

export type MockExamReviewItem = {
  question_id: string
  question: string
  options: PracticeQuestionOption[]
  chosen: string
  correct: string
  is_correct: boolean
  explanation: string
}

export type MockExamSubmitResult = PracticeSubmitResult & {
  review: MockExamReviewItem[]
}

export async function fetchPracticeHub(): Promise<PracticeHubResponse> {
  return apiFetch<PracticeHubResponse>("/practice/hub")
}

export async function fetchPracticeTopics(): Promise<string[]> {
  const data = await apiFetch<{ topics?: string[] }>("/practice/topics")
  return Array.isArray(data.topics) ? data.topics : []
}

export async function fetchPracticeQuestions(params?: {
  topic?: string
  difficulty?: string
  limit?: number
  milestone?: string
}): Promise<PracticeQuizResponse> {
  const qs = new URLSearchParams()
  if (params?.topic) qs.set("topic", params.topic)
  if (params?.difficulty) qs.set("difficulty", params.difficulty)
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.milestone) qs.set("milestone", params.milestone)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiFetch<PracticeQuizResponse>(`/practice/questions${suffix}`)
}

export async function checkPracticeAnswer(payload: {
  quiz_id: string
  question_id: string
  answer: string
}): Promise<PracticeCheckResult> {
  return apiFetch<PracticeCheckResult>("/practice/check", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function submitPracticeQuiz(payload: {
  quiz_id: string
  answers: { question_id: string; answer: string }[]
  duration_seconds?: number
}): Promise<PracticeSubmitResult> {
  return apiFetch<PracticeSubmitResult>("/practice/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function startMockExam(payload?: {
  topic?: string
  difficulty?: string
  limit?: number
  milestone?: string
  timer_sec?: number
}): Promise<MockExamStartResult> {
  return apiFetch<MockExamStartResult>("/practice/exam/start", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  })
}

export async function submitMockExam(payload: {
  quiz_id: string
  answers: { question_id: string; answer: string }[]
  duration_seconds?: number
}): Promise<MockExamSubmitResult> {
  return apiFetch<MockExamSubmitResult>("/practice/exam/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
