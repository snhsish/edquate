"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  type AuthUser,
  checkAuthStatus,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getUserFromToken,
  onTokenExpired,
} from "@/lib/api"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<{ needs_email_verification: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userFromStatus(status: { user_id?: string; username?: string; role?: string; display_name?: string }): AuthUser {
  return {
    user_id: status.user_id || "",
    username: status.username || "",
    role: status.role || "student",
    display_name: status.display_name || "",
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const mounted = useRef(false)

  useEffect(() => {
    let cancelled = false
    checkAuthStatus()
      .then((status) => {
        if (cancelled) return
        if (status.authenticated && status.user_id) {
          setUser(userFromStatus(status))
        } else {
          // Status endpoint returned unauthenticated — try decoding stored token as fallback
          const token = localStorage.getItem("eq_access_token")
          if (token) {
            const jwtUser = getUserFromToken(token)
            if (jwtUser) {
              setUser(jwtUser)
            } else {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      })
      .catch(() => {
        // Status endpoint failed — try decoding stored token as fallback
        if (cancelled) return
        const token = localStorage.getItem("eq_access_token")
        if (token) {
          const jwtUser = getUserFromToken(token)
          if (jwtUser) {
            setUser(jwtUser)
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    mounted.current = true
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const unsub = onTokenExpired(() => {
      setUser(null)
      router.push("/login")
    })
    return unsub
  }, [router])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password)
      if (data.ok) {
        // Decode JWT immediately so user is always set after login
        let jwtUser: AuthUser | null = null
        if (data.access_token) {
          jwtUser = getUserFromToken(data.access_token)
          if (jwtUser) setUser(jwtUser)
        }
        // Try status endpoint for authoritative user info
        try {
          const status = await checkAuthStatus()
          if (status.authenticated && status.user_id) {
            setUser(userFromStatus(status))
          }
        } catch {
          // Status endpoint failed — JWT-decoded user is already set
        }
        router.push("/")
      }
    },
    [router],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      const data = await apiRegister(email, password)
      return { needs_email_verification: data.needs_email_verification }
    },
    [],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
