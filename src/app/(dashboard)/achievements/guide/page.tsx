"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ArrowRight, Award, BookOpen, Bot, Brain, Bug, Crown, Crosshair, FileText, Flame, Gem, GraduationCap, Link2, MessageCircle, Star, Timer, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ACHIEVEMENT_GUIDE,
  DAILY_MISSIONS,
  GUIDE_INTRO,
  GUIDE_SECTIONS,
  LEVEL_RULES,
  STREAK_RULES,
  TIER_LABELS,
  XP_SOURCES,
  achievementsByTier,
  type AchievementGuideEntry,
  type AchievementTier,
} from "@/lib/achievement-guide"

const TIERS: AchievementTier[] = ["micro", "streak", "feature", "skill", "legendary"]

const guideIconMap: Record<string, React.ReactNode> = {
  Flame: <Flame className="size-6" />,
  MessageCircle: <MessageCircle className="size-6" />,
  Bug: <Bug className="size-6" />,
  Zap: <Zap className="size-6" />,
  Star: <Star className="size-6" />,
  Link2: <Link2 className="size-6" />,
  BookOpen: <BookOpen className="size-6" />,
  Bot: <Bot className="size-6" />,
  FileText: <FileText className="size-6" />,
  Brain: <Brain className="size-6" />,
  Timer: <Timer className="size-6" />,
  Crosshair: <Crosshair className="size-6" />,
  Award: <Award className="size-6" />,
  Crown: <Crown className="size-6" />,
  Gem: <Gem className="size-6" />,
  GraduationCap: <GraduationCap className="size-6" />,
}

function renderGuideIcon(icon: string): React.ReactNode {
  if (icon in guideIconMap) return guideIconMap[icon]
  return <span className="text-3xl">{icon}</span>
}

function GuideAchievementCard({ entry }: { entry: AchievementGuideEntry }) {
  return (
    <article
      id={entry.badge_id}
      className="scroll-mt-24 rounded-xl border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 items-center justify-center shrink-0">{renderGuideIcon(entry.icon)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
            {entry.rare && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                Rare
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {entry.xp_reward_display} XP badge value (display only)
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-foreground">
            {entry.how_to.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {entry.pro_tip && (
            <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Pro tip: </span>
              {entry.pro_tip}
            </p>
          )}
          <Link
            href={entry.where_to_go.href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {entry.where_to_go.label}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function AchievementsGuidePage() {
  const [activeSection, setActiveSection] = useState<string>(GUIDE_SECTIONS[0]?.id ?? "xp")

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto p-6">
      <div className="border-b border-border pb-5 mb-6">
        <Link
          href="/achievements"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3" />
          Back to Achievements
        </Link>
        <h1 className="text-lg font-semibold text-foreground">How to earn achievements</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{GUIDE_INTRO}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="lg:hidden">
          <label htmlFor="guide-section-jump" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Jump to section
          </label>
          <select
            id="guide-section-jump"
            value={activeSection}
            onChange={(event) => {
              const id = event.target.value
              setActiveSection(id)
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
          >
            {GUIDE_SECTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </nav>

        <nav className="hidden shrink-0 lg:sticky lg:top-6 lg:block lg:w-44">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <ul className="space-y-1">
            {GUIDE_SECTIONS.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-8">
          <section id="xp" className="scroll-mt-24">
            <section className="rounded-xl border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">How XP works</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Every action that moves you forward</p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Action</th>
                        <th className="pb-2 pr-4 font-medium">XP</th>
                        <th className="pb-2 font-medium">Where</th>
                      </tr>
                    </thead>
                    <tbody>
                      {XP_SOURCES.map((row) => (
                        <tr key={row.action} className="border-b border-border/50">
                          <td className="py-2.5 pr-4 text-foreground">{row.action}</td>
                          <td className="py-2.5 pr-4 font-semibold tabular-nums text-primary">
                            +{row.xp}
                          </td>
                          <td className="py-2.5">
                            {row.href ? (
                              <Link
                                href={row.href}
                                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              >
                                {row.where}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{row.where}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </section>

          <section id="streaks" className="scroll-mt-24">
            <section className="rounded-xl border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Streaks</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Snapchat-style — earn XP to keep the fire alive</p>
              </div>
              <div className="p-4">
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {STREAK_RULES.map((rule, i) => (
                    <li key={i} className="flex gap-2">
                      <Zap className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-2xl font-bold tabular-nums text-amber-400">
                  <Flame className="size-6 text-amber-400" />
                  <span>7</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: this is what your streak looks like on the achievements page when you&apos;re at 7 days.
                </p>
              </div>
            </section>
          </section>

          <section id="levels" className="scroll-mt-24">
            <section className="rounded-xl border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Levels</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Triangular XP curve</p>
              </div>
              <div className="p-4">
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {LEVEL_RULES.map((rule, i) => (
                    <li key={i} className="flex gap-2">
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </section>

          <section id="missions" className="scroll-mt-24">
            <section className="rounded-xl border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Daily missions</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Bonus XP once per UTC day each</p>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {DAILY_MISSIONS.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tabular-nums text-primary">
                          +{m.reward_xp} XP
                        </span>
                        <Link
                          href={m.href}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          Go
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Complete from the dashboard or via the missions API — each mission can only be claimed once per day.
                </p>
              </div>
            </section>
          </section>

          <section id="catalog" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">All achievements</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {ACHIEVEMENT_GUIDE.length} badges — grouped by vibe
              </p>
            </div>
            {TIERS.map((tier) => {
              const entries = achievementsByTier(tier)
              if (entries.length === 0) return null
              return (
                <div key={tier}>
                  <h3
                    className={cn(
                      "mb-3 text-sm font-medium text-foreground",
                      tier === "legendary" && "text-primary",
                    )}
                  >
                    {TIER_LABELS[tier]}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {entries.map((entry) => (
                      <GuideAchievementCard key={entry.badge_id} entry={entry} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        </div>
      </div>
    </div>
  )
}
