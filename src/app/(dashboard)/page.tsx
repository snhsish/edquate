"use client"

import { useState } from "react"
import {
  MessageSquare,
  Code,
  BookOpen,
  Bot,
  GraduationCap,
  Pencil,
  ExternalLink,
  X,
  Check,
} from "lucide-react"

const featureCards = [
  {
    id: "exam-prep",
    title: "Exam Prep",
    description: "Ace your exams with AI-powered study tools",
    icon: GraduationCap,
    url: "/exam",
    items: [
      "Upload your syllabus to get tailored study material",
      "Generate important questions from your notes",
      "Analyze PYQs to find high-frequency topics",
    ],
  },
  {
    id: "tutor",
    title: "Tutor",
    description: "Audiovisual learning with interactive whiteboards",
    icon: Pencil,
    url: "/tutor",
    items: [
      "Get audiovisual explanations with diagrams",
      "Pause and deep-dive into any concept",
      "Everything delivered with voice and visuals",
    ],
  },
  {
    id: "chat",
    title: "Chat",
    description: "Your personal AI study companion",
    icon: MessageSquare,
    url: "/chat",
    items: [
      "Ask anything using your stored memory",
      "Track progress, stats, and weak areas",
      "Get complex topics explained simply",
    ],
  },
  {
    id: "agents",
    title: "Agents",
    description: "Specialized AI agents for your niche",
    icon: Bot,
    url: "/agents",
    items: [
      "Create custom agents for any subject",
      "Deep expertise in maths, code, data science",
      "Ask domain-specific questions anytime",
    ],
  },
  {
    id: "books",
    title: "Books",
    description: "Generate and learn from AI-powered books",
    icon: BookOpen,
    url: "/books",
    items: [
      "Generate a book from your topics",
      "Brief, structured content for fast learning",
      "Ask questions directly to your books",
    ],
  },
  {
    id: "code-lab",
    title: "Code Lab",
    description: "Practice coding with curated challenges",
    icon: Code,
    url: "/code",
    items: [
      "Solve curated coding challenges",
      "Analyze and improve your solutions",
      "Practice across many languages and problems",
    ],
  },
]

const quickActions = [
  {
    title: "Exam Prep",
    description: "Upload syllabus and get study material",
    icon: GraduationCap,
    url: "/exam",
  },
  {
    title: "Tutor",
    description: "Audiovisual learning on whiteboard",
    icon: Pencil,
    url: "/tutor",
  },
  {
    title: "Chat",
    description: "Ask anything with your memory",
    icon: MessageSquare,
    url: "/chat",
  },
  {
    title: "Code lab",
    description: "Practice problems and earn XP",
    icon: Code,
    url: "/code",
  },
  {
    title: "Books",
    description: "Generate and read AI books",
    icon: BookOpen,
    url: "/books",
  },
  {
    title: "Agents",
    description: "Manage TutorBots",
    icon: Bot,
    url: "/agents",
  },
]

const dailyMissions = [
  {
    title: "Drop a message",
    description: "Send a message in Chat — even a hello counts",
    xp: 30,
  },
  {
    title: "Lock in on Code Lab",
    description: "Solve one Code Lab problem today",
    xp: 75,
  },
  {
    title: "Book era check-in",
    description: "Create a book or open an existing one",
    xp: 40,
  },
  {
    title: "Complete a book drill",
    description: "Run a quiz or flashcard session from your books",
    xp: 35,
  },
  {
    title: "Complete a topic quiz",
    description: "Finish a 5-question MCQ drill in Practice",
    xp: 40,
  },
]

const stats = [
  {
    label: "TOTAL XP",
    value: "35",
    sub: "Level 1",
  },
  {
    label: "LEVEL PROGRESS",
    value: "3%",
    sub: "35 / 1k XP",
  },
  {
    label: "CURRENT STREAK",
    value: "1 day",
    sub: "Best: 1 day",
  },
]

export default function Home() {
  const [dismissed, setDismissed] = useState<string[]>([])

  const visibleCards = featureCards.filter((c) => !dismissed.includes(c.id))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {visibleCards.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Explore features</h2>
            <p className="text-sm text-muted-foreground">Discover what you can do with Edquate</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const isDismissed = dismissed.includes(feature.id)
              if (isDismissed) return null
              return (
                <div
                  key={feature.id}
                  className="flex flex-col rounded-lg border overflow-hidden"
                >
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <feature.icon className="size-6" />
                        </div>
                        <div>
                          <p className="text-base font-bold">{feature.title}</p>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDismissed((d) => [...d, feature.id])}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Check className="size-3 text-foreground" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 self-end mt-1">
                      <a
                        href="#"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        Watch demo
                        <ExternalLink className="size-3" />
                      </a>
                      <a
                        href={feature.url}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80"
                      >
                        <feature.icon className="size-3.5" />
                        Try {feature.title}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold">Quick actions</h2>
              <p className="text-sm text-muted-foreground">Jump into your tools</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <a
                  key={action.title}
                  href={action.url}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <action.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daily missions</h2>
              <p className="text-sm text-muted-foreground">Bonus XP for today&apos;s goals</p>
            </div>
            <a href="/achievements" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </a>
          </div>
          <div className="flex flex-col gap-2">
            {dailyMissions.map((mission) => (
              <div
                key={mission.title}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{mission.title}</p>
                    <p className="text-xs text-muted-foreground">{mission.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-amber-500 shrink-0 ml-4">
                  +{mission.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
