"use client"

import { API_BASE, getAuthHeaders } from "@/lib/api"

export type LevelInfo = {
  level: number
  xp_into_level: number
  xp_for_next_level: number
  total_xp: number
  progress_pct: number
}

export type GamificationState = {
  total_xp: number
  streak_current: number
  streak_max?: number
  event_count?: number
  xp_per_day?: Record<string, number>
  xp_per_source?: Record<string, number>
  active_days?: string[]
  badges_unlocked?: Record<string, string>
  mission_completions?: Record<string, string>
  level?: LevelInfo
  last_synced_at?: string
}

export type BadgeStatus = {
  badge_id: string
  icon: string
  title: string
  description: string
  xp_reward: number
  condition: string
  rare: boolean
  status: "unlocked" | "in-progress" | "locked"
  unlocked_at?: string | null
  progress?: number | null
  progress_max?: number | null
}

export type AchievementsBundle = {
  total_xp: number
  level: LevelInfo
  achievements: BadgeStatus[]
  catalog_size: number
}

export type DailyMission = {
  mission_id: string
  title: string
  description?: string
  reward_xp?: number
  status: "pending" | "completed" | string
  cta_href?: string
  category?: string
}

export type XPHistoryItem = {
  event_id?: string
  amount: number
  source?: string
  description?: string
  created_at?: string
  metadata?: Record<string, unknown>
}

export type UnlockedBadge = {
  badge_id: string
  icon: string
  title: string
  description: string
  unlocked_at?: string
}

export type LeaderboardRow = {
  user_id: string
  name: string
  xp: number
  is_you?: boolean
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    credentials: "include",
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
      else if (body.message) detail = body.message
    } catch {
      if (res.statusText) detail = `${res.status} ${res.statusText}`
    }
    throw new Error(detail)
  }
  return res.json()
}

export async function fetchGamificationState(): Promise<GamificationState> {
  return apiFetch<GamificationState>("/gamification/state")
}

export async function fetchDailyMissions(): Promise<DailyMission[]> {
  const data = await apiFetch<{ missions?: DailyMission[] }>("/gamification/missions/today")
  return Array.isArray(data.missions) ? data.missions : []
}

export async function completeDailyMission(missionId: string): Promise<{
  mission_id: string
  status: string
  reward_xp: number
  newly_unlocked?: UnlockedBadge[]
  already?: boolean
}> {
  return apiFetch(`/gamification/missions/${encodeURIComponent(missionId)}/complete`, {
    method: "POST",
  })
}

export async function fetchXPHistory(limit = 20): Promise<XPHistoryItem[]> {
  const data = await apiFetch<{ items?: XPHistoryItem[] }>(`/gamification/xp-history?limit=${limit}`)
  return Array.isArray(data.items) ? data.items : []
}

export async function fetchBadges(): Promise<BadgeStatus[]> {
  const data = await apiFetch<{ badges?: BadgeStatus[] }>("/gamification/badges")
  return Array.isArray(data.badges) ? data.badges : []
}

export async function fetchAchievements(): Promise<AchievementsBundle> {
  return apiFetch<AchievementsBundle>("/gamification/achievements")
}

export async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardRow[] }> {
  return apiFetch<{ leaderboard: LeaderboardRow[] }>("/gamification/leaderboard")
}

export function xpActionLabel(action?: string): string {
  const labels: Record<string, string> = {
    "coding_practice.solve": "Code Lab solve",
    "book_practice.session_complete": "Book drill session",
    "chat.message_sent": "Chat message",
    "chat.session_start": "New chat session",
    "book.create": "Book created",
    "book.publish": "Book published",
    "tutorbot.create": "Tutor bot created",
    "notebook.create": "Notebook note",
    "knowledge.upload": "Knowledge upload",
    "mission.complete": "Daily mission",
  }
  if (!action) return "XP earned"
  return labels[action] ?? action.replace(/\./g, " ")
}
