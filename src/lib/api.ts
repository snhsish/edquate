const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4700/api/v2"

const TOKEN_KEY = "eq_access_token"
const TOKEN_EXPIRY_KEY = "eq_token_expiry"
const TWENTY_EIGHT_DAYS_MS = 28 * 24 * 60 * 60 * 1000

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

function getStoredToken(): string | null {
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
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TWENTY_EIGHT_DAYS_MS))
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
