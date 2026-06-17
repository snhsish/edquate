"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Award, BookOpen, Bot, Brain, Bug, Crown, Crosshair, FileText, Flame, Gem, GraduationCap, Link2, Loader2, Lock, MessageCircle, Minus, Star, Timer, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchAchievements,
  fetchGamificationState,
  fetchXPHistory,
  xpActionLabel,
  type AchievementsBundle,
  type BadgeStatus,
  type GamificationState,
  type XPHistoryItem,
} from "@/lib/gamification-api"

type FilterTab = "all" | "unlocked" | "in-progress" | "locked"

function utcTodayYmd(): string {
  const n = new Date()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`
}

function last7UtcYmd(): string[] {
  const n = new Date()
  const y = n.getUTCFullYear()
  const mo = n.getUTCMonth()
  const d = n.getUTCDate()
  const out: string[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const t = new Date(Date.UTC(y, mo, d - i))
    out.push(
      `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`,
    )
  }
  return out
}

function weekdayNarrowUtc(iso: string): string {
  const [yy, mm, dd] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(yy, mm - 1, dd))
  return dt.toLocaleDateString("en", { weekday: "narrow", timeZone: "UTC" })
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function StreakSection({ state }: { state: GamificationState }) {
  const activeSet = useMemo(() => new Set(state.active_days ?? []), [state.active_days])
  const weekDays = useMemo(() => last7UtcYmd(), [state.last_synced_at])
  const weekXp = useMemo(() => {
    let sum = 0
    for (const iso of weekDays) {
      sum += state.xp_per_day?.[iso] ?? 0
    }
    return sum
  }, [state.xp_per_day, weekDays])

  const todayIso = utcTodayYmd()
  const studiedToday = activeSet.has(todayIso)
  const active = state.streak_current > 0

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Study streak</h2>
      </div>
      <div className="p-4">
        <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn("size-7 shrink-0", active ? "text-orange-500" : "text-muted-foreground/40")} />
            <div>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {active ? state.streak_current : "0"}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                {active
                  ? studiedToday
                    ? "day streak - active today"
                    : "day streak - keep it alive today"
                  : "Start your streak by earning XP today"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <div className="rounded-xl border bg-muted/30 px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This week</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{weekXp.toLocaleString()} XP</p>
            </div>
            {state.streak_max != null && state.streak_max > 0 && (
              <div className="rounded-xl border bg-muted/30 px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Best</p>
                <p className="text-xl font-bold tabular-nums text-foreground">{state.streak_max}</p>
              </div>
            )}
          </div>
        </div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">This week</p>
        <div className="flex justify-between gap-1.5">
          {weekDays.map((iso) => {
            const isActive = activeSet.has(iso)
            return (
              <div key={iso} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-semibold",
                    isActive
                      ? "border-primary/50 bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isActive ? <Zap className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </div>
                <span className="text-[9px] font-medium uppercase text-muted-foreground">
                  {weekdayNarrowUtc(iso)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-end">
          <Link
            href="/achievements/guide#streaks"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            How streaks work
          </Link>
        </div>
      </div>
    </section>
  )
}

const badgeIconMap: Record<string, React.ReactNode> = {
  Flame: <Flame className="size-6" />,
  "🔥": <Flame className="size-6" />,
  MessageCircle: <MessageCircle className="size-6" />,
  "💬": <MessageCircle className="size-6" />,
  Bug: <Bug className="size-6" />,
  "🐛": <Bug className="size-6" />,
  Zap: <Zap className="size-6" />,
  "⚡": <Zap className="size-6" />,
  Star: <Star className="size-6" />,
  "🌟": <Star className="size-6" />,
  Link2: <Link2 className="size-6" />,
  "🔗": <Link2 className="size-6" />,
  BookOpen: <BookOpen className="size-6" />,
  "📚": <BookOpen className="size-6" />,
  Bot: <Bot className="size-6" />,
  "🤖": <Bot className="size-6" />,
  FileText: <FileText className="size-6" />,
  "📝": <FileText className="size-6" />,
  Brain: <Brain className="size-6" />,
  "🧠": <Brain className="size-6" />,
  Timer: <Timer className="size-6" />,
  "⏱️": <Timer className="size-6" />,
  Crosshair: <Crosshair className="size-6" />,
  "🎯": <Crosshair className="size-6" />,
  Award: <Award className="size-6" />,
  "💯": <Award className="size-6" />,
  Crown: <Crown className="size-6" />,
  "👑": <Crown className="size-6" />,
  Gem: <Gem className="size-6" />,
  "💎": <Gem className="size-6" />,
  GraduationCap: <GraduationCap className="size-6" />,
  "🎓": <GraduationCap className="size-6" />,
}

function renderBadgeIcon(icon: string): React.ReactNode {
  if (icon in badgeIconMap) return badgeIconMap[icon]
  return <span className="text-3xl">{icon}</span>
}

function BadgeCard({ badge }: { badge: BadgeStatus }) {
  const unlocked = badge.status === "unlocked"
  const inProgress = badge.status === "in-progress"
  const pct =
    badge.progress != null && badge.progress_max != null && badge.progress_max > 0
      ? Math.round((badge.progress / badge.progress_max) * 100)
      : 0

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-colors",
        unlocked
          ? "border-primary/30 bg-primary/5"
          : inProgress
            ? "border-border bg-card"
            : "border-border bg-card opacity-60",
        badge.rare && unlocked && "ring-1 ring-primary/20",
      )}
    >
      {badge.rare && (
        <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
          Rare
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className={cn("flex size-8 items-center justify-center", !unlocked && !inProgress && "grayscale opacity-40")}>{renderBadgeIcon(badge.icon)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{badge.title}</h3>
            {!unlocked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{badge.description}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{badge.condition}</p>
          {inProgress && badge.progress != null && badge.progress_max != null && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span>
                  {badge.progress}/{badge.progress_max}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
          {unlocked && badge.unlocked_at && (
            <p className="mt-2 text-[10px] text-primary">Unlocked {formatRelativeTime(badge.unlocked_at)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [bundle, setBundle] = useState<AchievementsBundle | null>(null)
  const [gamification, setGamification] = useState<GamificationState | null>(null)
  const [xpHistory, setXpHistory] = useState<XPHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [b, g, h] = await Promise.all([
          fetchAchievements(),
          fetchGamificationState(),
          fetchXPHistory(8),
        ])
        if (cancelled) return
        setBundle(b)
        setGamification(g)
        setXpHistory(h)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load achievements")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading your wins…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive-foreground">
          {error}
        </div>
      </div>
    )
  }

  if (!bundle) return null

  const achievements = bundle.achievements
  const filtered =
    filter === "all" ? achievements : achievements.filter((a) => a.status === filter)
  const unlockedCount = achievements.filter((a) => a.status === "unlocked").length
  const inProgressCount = achievements.filter((a) => a.status === "in-progress").length
  const lockedCount = achievements.length - unlockedCount - inProgressCount
  const rareUnlocked = achievements.filter((a) => a.status === "unlocked" && a.rare).slice(0, 3)
  const todayIso = utcTodayYmd()
  const studiedToday = gamification?.active_days?.includes(todayIso) ?? false

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto p-6">
      <div className="border-b border-border pb-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Achievements & XP</h1>
            <p className="text-sm text-muted-foreground">Small wins that actually mean something</p>
            <Link
              href="/achievements/guide"
              className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Learn how to earn these →
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {gamification && (
              <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-1.5">
                <Flame className={cn("size-5", gamification.streak_current > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
                <span className="text-sm font-bold tabular-nums text-foreground">{gamification.streak_current}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Level {bundle.level.level}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-xl border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Level progress</h2>
          </div>
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                  {bundle.level.level}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {bundle.total_xp.toLocaleString()} total XP
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bundle.level.xp_into_level.toLocaleString()} / {bundle.level.xp_for_next_level.toLocaleString()} into next level
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-primary">
                {(bundle.level.xp_for_next_level - bundle.level.xp_into_level).toLocaleString()} XP to go
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${bundle.level.progress_pct}%` }}
              />
            </div>
          </div>
        </section>

        {gamification && <StreakSection state={gamification} />}

        <section className="rounded-xl border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent XP</h2>
          </div>
          <div className="p-4">
            {xpHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No XP yet — go earn your first win.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {xpHistory.slice(0, 8).map((item, i) => (
                  <div
                    key={item.event_id ?? i}
                    className="flex flex-col justify-between rounded-xl border px-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[10.5px] text-muted-foreground">
                        {formatRelativeTime(item.created_at)}
                      </p>
                      <p className="truncate text-xs font-medium text-foreground leading-tight">
                        {xpActionLabel(item.description)}
                      </p>
                    </div>
                    <span className="mt-1.5 self-end text-sm font-bold tabular-nums text-primary">
                      +{item.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {rareUnlocked.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Flex badges</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {rareUnlocked.map((b) => (
              <div
                key={b.badge_id}
                className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
              >
                <span className="flex size-8 items-center justify-center">{renderBadgeIcon(b.icon)}</span>
                <span className="text-sm font-medium text-foreground">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">Achievements</h2>
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {([
            { key: "all" as FilterTab, label: `All (${achievements.length})` },
            { key: "unlocked" as FilterTab, label: `Unlocked (${unlockedCount})` },
            { key: "in-progress" as FilterTab, label: `In progress (${inProgressCount})` },
            { key: "locked" as FilterTab, label: `Locked (${lockedCount})` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((badge) => (
            <BadgeCard key={badge.badge_id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  )
}
