"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Code2,
  GraduationCap,
  HelpCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchPracticeHub,
  type PracticeHighlight,
  type PracticeHubResponse,
} from "@/lib/practice-api"
import { TopicQuizSession } from "@/components/practice/TopicQuizSession"
import { Button } from "@/components/ui/button"

type Props = {
  focus?: PracticeHighlight | null
  milestoneId?: string | null
  initialTopic?: string | null
}

function highlightClass(highlight: PracticeHighlight | undefined, active: PracticeHighlight) {
  return highlight === active
    ? "ring-2 ring-primary/50 border-primary/40"
    : "border-border"
}

export function PracticeHubView({ focus, milestoneId, initialTopic }: Props) {
  const [hub, setHub] = useState<PracticeHubResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookSessionOpen, setBookSessionOpen] = useState(false)
  const [quizSessionOpen, setQuizSessionOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPracticeHub()
      setHub(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load practice hub")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (focus === "book") setBookSessionOpen(true)
    if (focus === "quiz") setQuizSessionOpen(true)
  }, [focus])

  const recommended = hub?.recommended ?? []
  const booksArray = hub?.books?.books ?? []
  const totalItems = hub?.books?.total_items ?? 0
  const revisionDueCount = hub?.revision?.due_count ?? 0
  const codingSolves = hub?.coding?.solves_today ?? 0
  const codingStreak = hub?.coding?.streak_current ?? 0
  const suggestedTopic =
    initialTopic ?? hub?.quizzes?.suggested_topic ?? hub?.coding?.suggested_topic ?? "algorithms"
  const quizzesToday = hub?.quizzes?.completed_today ?? 0
  const activeMilestone = hub?.active_milestone ?? null
  const kindIcon: Record<string, typeof GraduationCap> = {
    codelab: Code2,
    book: BookOpen,
    chat: MessageSquare,
    revision: RotateCcw,
    quiz: Target,
    exam: ClipboardCheck,
  }

  const chatTopic =
    activeMilestone?.skills?.join(" ") ??
    (milestoneId ? milestoneId.replace(/_/g, " ") : "general concepts")

  if (quizSessionOpen) {
    return (
      <TopicQuizSession
        initialTopic={suggestedTopic}
        milestoneId={milestoneId}
        onClose={() => {
          setQuizSessionOpen(false)
          void load()
        }}
      />
    )
  }

  if (bookSessionOpen) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-1 text-2xl font-bold text-foreground">Book drills</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Review flashcards and quizzes from your books.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Head to Books to create one with exercises, then come back here.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setBookSessionOpen(false); setSelectedBookId(undefined) }}>
              Back
            </Button>
            <Link href="/books">
              <Button className="flex-1">Go to Books</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="border-b px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Practice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice coding, take quizzes, and test your skills.
        </p>
      </header>

      <div className="space-y-6 p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your practice hub…
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {recommended.length > 0 ? (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommended for you
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((rec, i) => {
                const Icon = kindIcon[rec.kind] ?? GraduationCap
                return (
                  <Link
                    key={`${rec.kind}-${i}`}
                    href={rec.href}
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      {rec.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {rec.description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href={`/code?topic=${encodeURIComponent(suggestedTopic)}`}
            className={cn(
              "rounded-xl border bg-card p-5 transition hover:bg-accent/50",
              highlightClass(focus ?? undefined, "codelab"),
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Code Lab</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Solve problems, run tests, and earn XP.
            </p>
            <p className="mt-3 text-xs font-medium text-foreground">
              {codingSolves} solves today
              {codingStreak > 0 ? ` · ${codingStreak}d streak` : ""}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Suggested topic: {suggestedTopic}
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setQuizSessionOpen(true)}
            className={cn(
              "rounded-xl border bg-card p-5 text-left transition hover:bg-accent/50",
              highlightClass(focus ?? undefined, "quiz"),
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Topic quiz</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Quick MCQ drills with instant feedback.
            </p>
            <p className="mt-3 text-xs font-medium text-foreground">
              {quizzesToday} completed today
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Suggested topic: {suggestedTopic}
            </p>
          </button>

          <Link
            href={`/mock-exam?topic=${encodeURIComponent(suggestedTopic)}`}
            className={cn(
              "rounded-xl border bg-card p-5 transition hover:bg-accent/50",
              highlightClass(focus ?? undefined, "exam"),
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Mock exam</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Timed 15-question exam. Results at the end.
            </p>
            <p className="mt-3 text-xs font-medium text-foreground">Exam-style practice</p>
          </Link>

          <button
            type="button"
            onClick={() => setBookSessionOpen(true)}
            className={cn(
              "rounded-xl border bg-card p-5 text-left transition hover:bg-accent/50",
              highlightClass(focus ?? undefined, "book"),
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Book drills</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Flashcards and quizzes from your books.
            </p>
            <p className="mt-3 text-xs font-medium text-foreground">
              {totalItems} cards ready
            </p>
            {booksArray.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {booksArray.map((b) => (
                  <li key={b.id} className="text-[10px] text-muted-foreground">
                    {b.title} · {b.item_count} items
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Create a book with exercises to get started.
              </p>
            )}
          </button>

          <Link
            href={`/chat?mode=practice_mode&topic=${encodeURIComponent(chatTopic)}`}
            className={cn(
              "rounded-xl border bg-card p-5 transition hover:bg-accent/50",
              highlightClass(focus ?? undefined, "chat"),
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Socratic practice</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Step-by-step guidance in Chat without giving away answers.
            </p>
            <p className="mt-3 text-xs font-medium text-foreground">Opens in practice mode</p>
          </Link>
        </section>

        {booksArray.length > 1 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Practice by book</h2>
            <div className="flex flex-wrap gap-2">
              {booksArray.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBookId(b.id)
                    setBookSessionOpen(true)
                  }}
                  className="rounded-xl border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/50"
                >
                  {b.title} ({b.item_count})
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Revision queue</h2>
            {revisionDueCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {revisionDueCount} due
              </span>
            ) : null}
          </div>
          <div className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
            Do book drills and quizzes to build your revision queue.
          </div>
        </section>

        {milestoneId && activeMilestone ? (
          <section className="rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Active milestone: {activeMilestone.title}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
