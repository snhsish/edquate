"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft, CheckCircle2, ChevronRight, Clock,
  Loader2, RefreshCw, Sparkles, Target, Trophy, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  checkPracticeAnswer,
  fetchPracticeQuestions,
  fetchPracticeTopics,
  submitPracticeQuiz,
  type PracticeQuestion,
} from "@/lib/practice-api"
import { Button } from "@/components/ui/button"

type QuizState = "idle" | "in_progress" | "show_result" | "completed"
type Difficulty = "easy" | "medium" | "hard"

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
}

type Props = {
  initialTopic?: string
  milestoneId?: string | null
  onClose: () => void
}

function formatTopicLabel(tid: string): string {
  if (tid === "all") return "All topics"
  return tid
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDifficultyLabel(d: string): string {
  if (d === "all") return "All levels"
  return d.charAt(0).toUpperCase() + d.slice(1)
}

export function TopicQuizSession({ initialTopic, milestoneId, onClose }: Props) {
  const [topics, setTopics] = useState<string[]>([])
  const [topicFilter, setTopicFilter] = useState<string>(initialTopic ?? "all")
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all")
  const [pool, setPool] = useState<PracticeQuestion[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [state, setState] = useState<QuizState>("idle")
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ question_id: string; answer: string }[]>([])
  const [reveals, setReveals] = useState<
    Record<string, { correct: string; is_correct: boolean; explanation: string }>
  >({})
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [score, setScore] = useState<{
    correct: number
    total: number
    awarded_xp: number
    percentage: number
  } | null>(null)

  const loadFreshQuiz = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false
      if (!silent) setGenerating(true)
      setError(null)
      try {
        const qs = await fetchPracticeQuestions({
          topic: topicFilter === "all" ? undefined : topicFilter,
          difficulty: diffFilter === "all" ? undefined : diffFilter,
          limit: 5,
          milestone: milestoneId ?? undefined,
        })
        setPool(qs.items)
        setQuizId(qs.quiz_id)
        setOfflineMode(Boolean(qs.offline))
        setReveals({})
      } catch (e) {
        setPool([])
        setQuizId(null)
        setError(e instanceof Error ? e.message : "Failed to generate a fresh quiz.")
      } finally {
        if (!silent) setGenerating(false)
      }
    },
    [diffFilter, milestoneId, topicFilter],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetchPracticeTopics()
        if (!cancelled) setTopics(res)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load topics.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (initialTopic && initialTopic !== "all") {
      setTopicFilter(initialTopic)
    }
  }, [initialTopic])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (state !== "idle" || loading) return
    void loadFreshQuiz()
  }, [topicFilter, diffFilter, state, loading, loadFreshQuiz])

  const current = pool[currentIdx]
  const filterTopics = useMemo(() => ["all", ...topics], [topics])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startQuiz = useCallback(() => {
    stopTimer()
    setCurrentIdx(0)
    setSelected(null)
    setAnswers([])
    setState("in_progress")
    setTimer(0)
    setScore(null)
    setError(null)
    timerRef.current = setInterval(() => setTimer((x) => x + 1), 1000)
  }, [stopTimer])

  const submitAnswer = useCallback(async () => {
    if (!selected || !current || !quizId) return
    setChecking(true)
    setError(null)
    try {
      const reveal = await checkPracticeAnswer({
        quiz_id: quizId,
        question_id: current.id,
        answer: selected,
      })
      setReveals((prev) => ({
        ...prev,
        [current.id]: {
          correct: reveal.correct,
          is_correct: reveal.is_correct,
          explanation: reveal.explanation,
        },
      }))
      setAnswers((prev) => [...prev, { question_id: current.id, answer: selected }])
      setState("show_result")
      stopTimer()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not validate that answer.")
    } finally {
      setChecking(false)
    }
  }, [selected, current, quizId, stopTimer])

  const nextQuestion = useCallback(async () => {
    const next = currentIdx + 1
    if (next >= pool.length) {
      if (!quizId) return
      setSubmitting(true)
      try {
        const result = await submitPracticeQuiz({
          quiz_id: quizId,
          answers,
          duration_seconds: timer,
        })
        setScore({
          correct: result.score.correct,
          total: result.score.total,
          awarded_xp: result.awarded_xp,
          percentage: result.score.percentage,
        })
        setState("completed")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit quiz.")
        setState("idle")
      } finally {
        setSubmitting(false)
      }
    } else {
      setCurrentIdx(next)
      setSelected(null)
      setState("in_progress")
      setTimer(0)
      timerRef.current = setInterval(() => setTimer((x) => x + 1), 1000)
    }
  }, [currentIdx, pool.length, quizId, answers, timer])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading topic quiz…
      </div>
    )
  }

  if (state === "completed" && score) {
    const pct = score.percentage
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-1 text-2xl font-bold text-foreground">Session complete</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {score.correct} / {score.total} correct
          </p>
          <div className="mb-6 flex items-center justify-center gap-6">
            <div>
              <p className={cn("text-4xl font-black", pct >= 80 ? "text-green-600 dark:text-green-400" : "text-primary")}>
                {pct}%
              </p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div>
              <p className="text-4xl font-black text-primary">+{score.awarded_xp}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Back to hub
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                stopTimer()
                setState("idle")
                void loadFreshQuiz()
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (state === "in_progress" || state === "show_result") {
    const reveal = current ? reveals[current.id] : undefined
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Practice hub
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(timer)}
            <span>
              {currentIdx + 1} / {pool.length}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {current ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                    {current.topic}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                      DIFF_STYLE[current.difficulty],
                    )}
                  >
                    {current.difficulty}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">{current.question}</h2>
                <div className="space-y-2">
                  {current.options.map((opt) => {
                    const isSelected = selected === opt.key
                    const isCorrect = reveal?.correct === opt.key
                    const isWrong = reveal && isSelected && !reveal.is_correct
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={state === "show_result"}
                        onClick={() => setSelected(opt.key)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                          isSelected && state !== "show_result" && "border-primary bg-primary/5",
                          isCorrect && state === "show_result" && "border-green-500/40 bg-green-500/10",
                          isWrong && "border-red-500/40 bg-red-500/10",
                          state === "show_result" && !isCorrect && !isWrong && "opacity-60",
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-bold text-muted-foreground">
                          {opt.key}
                        </span>
                        <span className="text-foreground">{opt.text}</span>
                        {isCorrect && state === "show_result" ? (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                        ) : null}
                        {isWrong ? <XCircle className="ml-auto h-4 w-4 text-red-500" /> : null}
                      </button>
                    )
                  })}
                </div>
                {state === "show_result" && reveal ? (
                  <div className="rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    {reveal.explanation}
                  </div>
                ) : null}
                <div className="flex justify-end">
                  {state === "in_progress" ? (
                    <Button
                      disabled={!selected || checking}
                      onClick={() => void submitAnswer()}
                    >
                      {checking ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Check answer
                    </Button>
                  ) : (
                    <Button
                      disabled={submitting}
                      onClick={() => void nextQuestion()}
                    >
                      {submitting ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRight className="mr-1 h-4 w-4" />
                      )}
                      {currentIdx + 1 >= pool.length ? "Finish quiz" : "Next question"}
                    </Button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">Topic quiz</h1>
            <p className="text-xs text-muted-foreground">
              Quick MCQ drills with instant feedback.
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 p-6 lg:grid-cols-5">
          {error ? (
            <div className="col-span-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {offlineMode ? (
            <div className="col-span-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Using offline questions. Regenerate to get a fresh set from AI.
            </div>
          ) : null}

          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configuration</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Topic</label>
                  <select
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer"
                  >
                    {filterTopics.map((tid) => (
                      <option key={tid} value={tid}>
                        {formatTopicLabel(tid)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Difficulty</label>
                  <select
                    value={diffFilter}
                    onChange={(e) => setDiffFilter(e.target.value as Difficulty | "all")}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 cursor-pointer"
                  >
                    <option value="all">All levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void loadFreshQuiz()}
                  disabled={generating}
                  className="mt-1"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", generating && "animate-spin")} />
                  {generating ? "Refreshing…" : "Generate questions"}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-xs text-muted-foreground">
                Questions are generated fresh based on your selections.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {generating && pool.length === 0
                  ? "Generating questions…"
                  : `Preview (${pool.length})`}
              </h2>
            </div>
            {generating && pool.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating questions…</p>
              </div>
            ) : pool.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {pool.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-muted/30"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{q.question}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-md border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {q.topic}
                        </span>
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                            DIFF_STYLE[q.difficulty],
                          )}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Pick a topic and difficulty, then generate some questions.
                </p>
              </div>
            )}

            <Button
              disabled={pool.length === 0 || generating}
              onClick={startQuiz}
            >
              Start quiz ({pool.length} questions)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
