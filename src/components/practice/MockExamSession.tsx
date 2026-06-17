"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, Clock,
  Flag, Grid3x3, Loader2, Target, Trophy, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  startMockExam,
  submitMockExam,
  type PracticeQuestion,
  type MockExamReviewItem,
} from "@/lib/practice-api"
import { Button } from "@/components/ui/button"

type Phase = "setup" | "active" | "review"

type Props = {
  initialTopic?: string
  milestoneId?: string | null
}

function QuestionPalette({
  questions,
  current,
  selected,
  flagged,
  onSelect,
  className,
}: {
  questions: PracticeQuestion[]
  current: number
  selected: Record<string, string>
  flagged: Set<string>
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Questions
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-3">
        {questions.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "relative rounded-lg border py-1.5 text-xs font-medium",
              current === i && "border-primary bg-primary/10",
              selected[item.id] && "bg-green-500/10",
              flagged.has(item.id) && "ring-1 ring-amber-400",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MockExamSession({ initialTopic, milestoneId }: Props) {
  const [phase, setPhase] = useState<Phase>("setup")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [timerSec, setTimerSec] = useState(20 * 60)
  const [timeLeft, setTimeLeft] = useState(20 * 60)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [review, setReview] = useState<MockExamReviewItem[]>([])
  const [score, setScore] = useState<{ percentage: number; correct: number; total: number; xp: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const beginExam = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await startMockExam({
        topic: initialTopic,
        milestone: milestoneId ?? undefined,
        timer_sec: 20 * 60,
        limit: 15,
      })
      setQuizId(res.quiz_id)
      setQuestions(res.items)
      setTimerSec(res.timer_sec)
      setTimeLeft(res.timer_sec)
      setSelected({})
      setFlagged(new Set())
      setCurrent(0)
      setPhase("active")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start mock exam.")
    } finally {
      setLoading(false)
    }
  }, [initialTopic, milestoneId])

  const finishExam = useCallback(async () => {
    if (!quizId) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    setError(null)
    try {
      const answers = questions.map((q) => ({
        question_id: q.id,
        answer: selected[q.id] ?? "",
      }))
      const elapsed = timerSec - timeLeft
      const result = await submitMockExam({
        quiz_id: quizId,
        answers,
        duration_seconds: elapsed > 0 ? elapsed : timerSec,
      })
      setReview(result.review ?? [])
      setScore({
        percentage: result.score.percentage,
        correct: result.score.correct,
        total: result.score.total,
        xp: result.awarded_xp,
      })
      setPhase("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit mock exam.")
    } finally {
      setSubmitting(false)
    }
  }, [quizId, questions, selected, timeLeft, timerSec])

  const finishExamRef = useRef(finishExam)
  finishExamRef.current = finishExam

  useEffect(() => {
    if (phase !== "active") return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          void finishExamRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const seconds = String(timeLeft % 60).padStart(2, "0")
  const q = questions[current]
  const answeredCount = Object.keys(selected).length

  const toggleFlag = (id: string) => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (phase === "setup") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <Link href="/practise" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Practice hub
          </Link>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border bg-card">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Mock exam</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            15 questions with a timer. No feedback until you submit.
          </p>
          {error ? (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Questions", value: "15" },
              { label: "Time limit", value: "20 min" },
              { label: "Feedback", value: "At end" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mb-6 rounded-xl border border-green-500/25 bg-green-500/5 p-4">
            <div className="flex items-start gap-2 text-xs text-green-800 dark:text-green-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Select one answer per question. Flag items to revisit. The timer starts when you begin. Submitting is final.
              </span>
            </div>
          </div>
          <Button
            className="w-full py-6 text-sm font-bold"
            disabled={loading}
            onClick={() => void beginExam()}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing exam…
              </span>
            ) : (
              "Begin mock exam →"
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "review" && score) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <h1 className="font-bold text-foreground">Mock exam results</h1>
            <div className={cn("text-2xl font-black", score.percentage >= 70 ? "text-green-600" : "text-red-500")}>
              {score.percentage}%
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <div
              className={cn(
                "rounded-2xl border p-6 text-center",
                score.percentage >= 70 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5",
              )}
            >
              <Trophy className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="text-5xl font-black text-foreground">{score.percentage}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {score.correct} / {score.total} correct · +{score.xp} XP
              </p>
            </div>
            {review.map((item, i) => (
              <div key={item.question_id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  Q{i + 1}
                  {item.is_correct ? (
                    <span className="text-green-600">Correct</span>
                  ) : (
                    <span className="text-red-500">Incorrect</span>
                  )}
                </div>
                <p className="mb-2 text-sm font-medium text-foreground">{item.question}</p>
                <p className="text-xs text-muted-foreground">{item.explanation}</p>
              </div>
            ))}
            <div className="flex gap-3">
              <Link href="/practise" className="inline-flex flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                Practice hub
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setPhase("setup")
                  setScore(null)
                  setReview([])
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {minutes}:{seconds}
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
        >
          <Grid3x3 className="h-3.5 w-3.5" />
          Q{current + 1}/{questions.length}
        </button>
        <div className="hidden text-xs text-muted-foreground sm:block">
          {answeredCount}/{questions.length} answered
        </div>
        <Button
          size="sm"
          disabled={submitting}
          onClick={() => void finishExam()}
        >
          {submitting ? "Submitting…" : "Submit exam"}
        </Button>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="hidden w-48 shrink-0 border-r p-4 md:block">
          <QuestionPalette
            questions={questions}
            current={current}
            selected={selected}
            flagged={flagged}
            onSelect={setCurrent}
          />
        </aside>
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          {error ? (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {q ? (
            <div className="mx-auto w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Question {current + 1} of {questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFlag(q.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                    flagged.has(q.id) ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "text-muted-foreground",
                  )}
                >
                  <Flag className="h-3 w-3" />
                  Flag
                </button>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{q.question}</h2>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [q.id]: opt.key }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      selected[q.id] === opt.key && "border-primary bg-primary/5",
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-bold text-muted-foreground">
                      {opt.key}
                    </span>
                    <span className="text-foreground">{opt.text}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current >= questions.length - 1}
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {paletteOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close question palette"
            onClick={() => setPaletteOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border bg-card p-4 shadow-xl md:hidden"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Jump to question</p>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <QuestionPalette
              questions={questions}
              current={current}
              selected={selected}
              flagged={flagged}
              onSelect={(index) => {
                setCurrent(index)
                setPaletteOpen(false)
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
