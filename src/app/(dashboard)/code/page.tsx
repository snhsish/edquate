"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Flame,
  Keyboard,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react"
import {
  fetchCodingProblem,
  fetchCodingToolchains,
  runCodingSnippet,
  submitCodingSolution,
  type CodingProblemPayload,
  type CodingRunResult,
  type CodingSubmitResult,
  type CodingToolchainsResponse,
} from "@/lib/coding-practice-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const TOPICS = ["python", "algorithms", "ml", "react", "math", "db", "general"] as const
const LANGUAGES = ["python", "javascript", "cpp", "c", "java"] as const
const DIFFS = ["easy", "medium", "hard"] as const

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  cpp: "C++",
  c: "C",
  java: "Java",
}

const TOPIC_LABEL: Record<string, string> = {
  python: "Python",
  algorithms: "Algorithms",
  ml: "ML",
  react: "React",
  math: "Math",
  db: "DB",
  general: "General",
}

const SOLVE_LIMIT_SEC: Record<string, number> = { easy: 180, medium: 150, hard: 120 }

function solveLimitSeconds(difficulty: string): number {
  return SOLVE_LIMIT_SEC[difficulty.toLowerCase()] ?? SOLVE_LIMIT_SEC.medium
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, "0")}`
}

function stripMarkdownLite(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

type ScorecardGrade = "A" | "B" | "C" | "D" | "F"

function computeScorecardGrade(
  allPassed: boolean,
  passedCount: number,
  totalCount: number,
  solveSeconds: number | null | undefined,
  limitSec: number,
): ScorecardGrade {
  if (!allPassed || totalCount === 0) {
    const ratio = totalCount > 0 ? passedCount / totalCount : 0
    if (ratio >= 0.75) return "D"
    return "F"
  }
  const elapsed = solveSeconds ?? limitSec
  if (elapsed <= limitSec * 0.45) return "A"
  if (elapsed <= limitSec * 0.75) return "B"
  return "C"
}

function SolveCountdown({ limitSec, elapsedSec }: { limitSec: number; elapsedSec: number }) {
  const remaining = Math.max(0, limitSec - elapsedSec)
  const expired = remaining === 0 && elapsedSec > 0
  const pct = limitSec > 0 ? Math.min(100, (elapsedSec / limitSec) * 100) : 0
  const urgent = !expired && remaining <= 30
  const barClass = expired || urgent ? "bg-destructive" : remaining <= 60 ? "bg-amber-500" : "bg-primary"

  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
          <Clock className="size-3.5 shrink-0" />
          {expired ? "Time target reached" : `${formatClock(remaining)} left`}
        </span>
        <span className="text-muted-foreground">Elapsed {formatClock(elapsedSec)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-[width] duration-1000 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function LanguageSelect({
  languages,
  labels,
  value,
  onChange,
}: {
  languages: readonly string[]
  labels: Record<string, string>
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
      >
        {labels[value] ?? value}
        <svg className="size-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border bg-popover p-1 shadow-md">
          {languages.map((lid) => (
            <button
              key={lid}
              type="button"
              onClick={() => { onChange(lid); setOpen(false) }}
              className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                lid === value ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-muted"
              }`}
            >
              {labels[lid]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TopicSelect({
  topics,
  value,
  onChange,
}: {
  topics: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
      >
        {TOPIC_LABEL[value] ?? value}
        <svg className="size-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border bg-popover p-1 shadow-md">
          {topics.map((tid) => (
            <button
              key={tid}
              type="button"
              onClick={() => { onChange(tid); setOpen(false) }}
              className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                tid === value ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-muted"
              }`}
            >
              {TOPIC_LABEL[tid] ?? tid}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CodeLabPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState(() => searchParams.get("topic") || "algorithms")
  const [language, setLanguage] = useState<string>("python")
  const [difficulty, setDifficulty] = useState(() => searchParams.get("difficulty") || "medium")
  const [problem, setProblem] = useState<CodingProblemPayload | null>(null)
  const [code, setCode] = useState("")
  const [loadingProblem, setLoadingProblem] = useState(true)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [runOut, setRunOut] = useState<CodingRunResult | null>(null)
  const [submitOut, setSubmitOut] = useState<CodingSubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalXp, setTotalXp] = useState<number | null>(null)
  const [streakCurrent, setStreakCurrent] = useState<number | null>(null)
  const [solveSeconds, setSolveSeconds] = useState(0)
  const [toolchains, setToolchains] = useState<CodingToolchainsResponse | null>(null)
  const [scorecardOpen, setScorecardOpen] = useState(false)
  const [scorecardResult, setScorecardResult] = useState<CodingSubmitResult | null>(null)
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loadSeqRef = useRef(0)
  const loadAbortRef = useRef<AbortController | null>(null)
  const runAbortRef = useRef<AbortController | null>(null)
  const submitAbortRef = useRef<AbortController | null>(null)
  const submitAttemptRef = useRef(0)

  useEffect(() => {
    fetchCodingToolchains().then(setToolchains).catch(() => setToolchains(null))
    return () => {
      loadAbortRef.current?.abort()
      runAbortRef.current?.abort()
      submitAbortRef.current?.abort()
    }
  }, [])

  const toolchainWarning = useMemo(() => {
    const info = toolchains?.languages?.[language]
    if (!info || info.available) return null
    return info.message
  }, [language, toolchains])

  useEffect(() => {
    runAbortRef.current?.abort()
    submitAbortRef.current?.abort()
  }, [problem?.problem_id])

  const loadProblem = useCallback(async () => {
    const seq = ++loadSeqRef.current
    loadAbortRef.current?.abort()
    const ac = new AbortController()
    loadAbortRef.current = ac
    setLoadingProblem(true)
    setError(null)
    setRunOut(null)
    setSubmitOut(null)
    setSolveSeconds(0)
    try {
      const p = await fetchCodingProblem(
        { topic, difficulty, language, nonce: `${Date.now()}_${seq}` },
        { signal: ac.signal },
      )
      if (seq !== loadSeqRef.current) return
      setProblem(p)
      setCode(p.starter_code)
      submitAttemptRef.current = 0
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      if (seq !== loadSeqRef.current) return
      setProblem(null)
      const msg = e instanceof Error ? e.message : "Failed to load problem"
      if (msg.toLowerCase().includes("daily coding problems limit")) {
        setPlanLimitMessage(msg)
      } else {
        setError(msg)
      }
    } finally {
      if (seq === loadSeqRef.current) setLoadingProblem(false)
    }
  }, [difficulty, language, topic])

  useEffect(() => {
    loadProblem()
  }, [loadProblem])

  const problemKey = problem?.problem_id
  useEffect(() => {
    if (!problemKey || loadingProblem) return
    setSolveSeconds(0)
    const id = window.setInterval(() => setSolveSeconds((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [problemKey, loadingProblem])

  const solveLimitSec = useMemo(
    () => solveLimitSeconds(problem?.difficulty ?? difficulty),
    [difficulty, problem?.difficulty],
  )

  const handleRun = useCallback(async () => {
    if (!problem) return
    runAbortRef.current?.abort()
    const ac = new AbortController()
    runAbortRef.current = ac
    setRunning(true)
    setError(null)
    setRunOut(null)
    try {
      setRunOut(await runCodingSnippet({ problem_id: problem.problem_id, code }, { signal: ac.signal }))
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "Run failed")
    } finally {
      setRunning(false)
    }
  }, [code, problem])

  const handleSubmit = useCallback(async () => {
    if (!problem) return
    submitAbortRef.current?.abort()
    const ac = new AbortController()
    submitAbortRef.current = ac
    setSubmitting(true)
    setError(null)
    setSubmitOut(null)
    try {
      submitAttemptRef.current += 1
      const r = await submitCodingSolution(
        { problem_id: problem.problem_id, code, solve_seconds: solveSeconds, submit_attempt: submitAttemptRef.current },
        { signal: ac.signal },
      )
      setSubmitOut(r)
      setScorecardResult(r)
      setScorecardOpen(true)
      if (r.total_xp != null) setTotalXp(r.total_xp)
      if (r.streak_current != null) setStreakCurrent(r.streak_current)
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }, [code, problem, solveSeconds])

  const dismissScorecard = useCallback(() => {
    setScorecardOpen(false)
    setScorecardResult(null)
  }, [])

  const loadNextFromScorecard = useCallback(() => {
    setScorecardOpen(false)
    setScorecardResult(null)
    setRunOut(null)
    setSubmitOut(null)
    loadProblem()
  }, [loadProblem])

  const diffLabel = problem?.difficulty ?? difficulty
  const diffBadgeClass =
    diffLabel === "easy"
      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      : diffLabel === "hard"
        ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"

  const scorecardGrade = useMemo(() => {
    if (!scorecardResult) return null
    const total = scorecardResult.tests.length
    const passed = scorecardResult.tests.filter((x) => x.ok).length
    return computeScorecardGrade(scorecardResult.all_passed, passed, total, scorecardResult.solve_seconds, solveLimitSec)
  }, [scorecardResult, solveLimitSec])

  const scorecardGradeColor =
    scorecardGrade === "A" ? "text-emerald-500" :
    scorecardGrade === "B" ? "text-sky-500" :
    scorecardGrade === "C" ? "text-amber-500" :
    scorecardGrade === "D" ? "text-orange-500" :
    "text-red-500"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Code2 className="size-4" strokeWidth={1.6} />
            </span>
            <div>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">Code Lab</h1>
              <p className="text-xs text-muted-foreground">Practice coding challenges</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Keyboard className="size-3" />
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">^Enter</kbd>
              <span className="hidden sm:inline">run</span>
              <span className="mx-0.5 text-muted-foreground/50">&middot;</span>
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">^⇧Enter</kbd>
              <span className="hidden sm:inline">submit</span>
            </span>
            {(totalXp != null || streakCurrent != null) && (
              <span className="hidden h-4 w-px bg-border sm:block" />
            )}
            {totalXp != null && (
              <span className="inline-flex items-center gap-1 rounded-md border bg-amber-500/5 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Zap className="size-3" />
                {totalXp} XP
              </span>
            )}
            {streakCurrent != null && (
              <span className="inline-flex items-center gap-1 rounded-md border bg-orange-500/5 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                <Flame className="size-3" />
                {streakCurrent}d
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">

          {/* Compact toolbar - LeetCode-style */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border bg-card px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Language:</span>
              <LanguageSelect
                languages={LANGUAGES}
                labels={LANG_LABEL}
                value={language}
                onChange={(v) => setLanguage(v)}
              />
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Topic:</span>
              <TopicSelect topics={TOPICS} value={topic} onChange={setTopic} />
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Difficulty:</span>
              <div className="flex items-center gap-1">
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize transition ${
                      difficulty === d
                        ? d === "easy"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : d === "hard"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto">
              <Button
                variant="outline"
                size="xs"
                onClick={() => loadProblem()}
                disabled={loadingProblem}
              >
                <RotateCcw className={`size-3 ${loadingProblem ? "animate-spin" : ""}`} />
                New problem
              </Button>
            </div>
          </div>

          {toolchainWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              {toolchainWarning}
            </div>
          )}

          {error && !planLimitMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Main two-column layout */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">

            {/* Problem panel */}
            <section className="flex min-h-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5">
              {loadingProblem && !problem ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating problem&hellip;</p>
                </div>
              ) : problem ? (
                <>
                  {submitOut ? (
                    <SolveCountdown limitSec={solveLimitSec} elapsedSec={solveSeconds} />
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-col overflow-y-auto rounded-lg border bg-background p-4">
                      <h2 className="text-base font-semibold text-foreground">{problem.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                        <span className={`rounded-md border px-2 py-0.5 font-medium capitalize ${diffBadgeClass}`}>
                          {diffLabel}
                        </span>
                        <span className="rounded-md border bg-muted px-2 py-0.5 text-muted-foreground">
                          {TOPIC_LABEL[problem.topic] ?? problem.topic}
                        </span>
                        <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-muted-foreground">
                          {LANG_LABEL[problem.language] ?? problem.language}
                        </span>
                        {problem.offline && (
                          <span className="rounded-md border border-dashed px-2 py-0.5 text-muted-foreground">
                            Offline
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-violet-500">{problem.entrypoint}()</p>

                      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {stripMarkdownLite(problem.description)}
                      </div>

                      {problem.sample_tests && problem.sample_tests.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sample I/O</p>
                          <ul className="mt-2 space-y-2 text-xs font-mono">
                            {problem.sample_tests.map((st, i) => (
                              <li key={i} className="rounded-lg border bg-muted p-2">
                                <div className="text-muted-foreground">args: <span className="text-foreground">{JSON.stringify(st.args)}</span></div>
                                <div className="text-muted-foreground">expected: <span className="text-foreground">{JSON.stringify(st.expected)}</span></div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {problem.hints && problem.hints.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hints</p>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                            {problem.hints.map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            {/* Editor panel */}
            <section className="flex min-h-[420px] flex-col gap-3 rounded-xl border bg-card p-4 sm:min-h-[480px] sm:p-5">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Editor &middot; {LANG_LABEL[language]}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(code)}
                    disabled={!problem || !code}
                    className="rounded-lg border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => problem && setCode(problem.starter_code)}
                    disabled={!problem}
                    className="rounded-lg border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
              </div>

              {problem && submitOut ? (
                <SolveCountdown limitSec={solveLimitSec} elapsedSec={solveSeconds} />
              ) : null}

              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault()
                    if (e.shiftKey) handleSubmit()
                    else handleRun()
                  }
                }}
                spellCheck={false}
                className="min-h-[200px] flex-1 resize-y rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/60 sm:min-h-[260px] disabled:opacity-60"
                disabled={!problem || loadingProblem}
                placeholder={loadingProblem ? "Loading problem\u2026" : problem ? "Write your solution here\u2026" : "Select filters and click New problem"}
              />

              <div className="flex flex-wrap gap-2">
                {!submitOut ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleRun()}
                      disabled={!problem || running || loadingProblem}
                    >
                      {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                      Run
                    </Button>
                    <Button
                      onClick={() => handleSubmit()}
                      disabled={!problem || submitting || loadingProblem}
                    >
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Submit
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => (submitOut.all_passed ? loadNextFromScorecard() : dismissScorecard())}
                  >
                    {submitOut.all_passed ? (
                      <><ChevronRight className="size-4" /> Next problem</>
                    ) : (
                      "Try again"
                    )}
                  </Button>
                )}
              </div>

              {/* Run output */}
              {runOut && (
                <div className={`rounded-lg border px-3 py-3 text-xs ${runOut.all_passed ? "border-green-500/30 bg-green-500/5" : "bg-background"}`}>
                  <p className="font-semibold text-foreground">
                    {runOut.all_passed ? "Sample tests passed" : "Sample test results"}
                  </p>
                  <p className="mt-0.5 font-mono text-muted-foreground">
                    exit {runOut.exit_code} &middot; {runOut.elapsed_ms.toFixed(0)} ms
                  </p>
                  {runOut.tests?.map((tr) => (
                    <div key={tr.index} className={tr.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      #{tr.index + 1} {tr.ok ? "\u2713" : "\u2717"} {tr.error ?? `${tr.got} vs ${tr.expected}`}
                    </div>
                  ))}
                  {runOut.stdout && (
                    <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-background p-2">
                      {runOut.stdout}
                    </pre>
                  )}
                  {runOut.stderr && (
                    <pre className="mt-2 max-h-36 overflow-auto rounded-lg border border-red-500/30 bg-red-500/5 p-2">
                      {runOut.stderr}
                    </pre>
                  )}
                </div>
              )}

              {submitOut && !scorecardOpen && (
                <div className={`rounded-lg border px-3 py-3 text-sm ${submitOut.all_passed ? "border-green-500/30 bg-green-500/5" : "bg-background"}`}>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {submitOut.all_passed ? <Trophy className="size-4 text-emerald-500" /> : <Sparkles className="size-4" />}
                    {submitOut.all_passed ? "Solved!" : "Tests ran"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    +{submitOut.awarded_xp} XP &middot; streak {submitOut.streak_current} &middot; total {submitOut.total_xp} XP
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Submit scorecard dialog */}
      <Dialog open={scorecardOpen} onOpenChange={(open) => { if (!open) dismissScorecard() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-4">
              {scorecardGrade && (
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-card text-3xl font-black ${scorecardGradeColor}`}>
                  {scorecardGrade}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle>
                  {scorecardResult?.all_passed ? "Submission complete" : "Submission recorded"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {scorecardResult && (
                    <>{scorecardResult.tests.filter((x) => x.ok).length}/{scorecardResult.tests.length} hidden tests passed &middot; {scorecardResult.tests.length > 0 ? Math.round((scorecardResult.tests.filter((x) => x.ok).length / scorecardResult.tests.length) * 100) : 0}% score</>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-background px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Zap className="size-3.5 text-amber-500" />
                XP earned
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">+{scorecardResult?.awarded_xp ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Flame className="size-3.5 text-orange-500" />
                Streak
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{scorecardResult?.streak_current ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Trophy className="size-3.5 text-emerald-500" />
                Total XP
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{scorecardResult?.total_xp ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="size-3.5 text-sky-500" />
                Solve time
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                {scorecardResult?.solve_seconds != null && scorecardResult.solve_seconds >= 0 ? formatClock(scorecardResult.solve_seconds) : "\u2014"}
              </p>
            </div>
          </div>

          {scorecardResult && (
            <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border bg-background px-3 py-2 text-xs">
              {scorecardResult.tests.map((tr) => (
                <li key={tr.index} className={tr.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  #{tr.index + 1} {tr.ok ? "\u2713" : "\u2717"} {tr.error ?? (tr.got != null ? `${tr.got} vs ${tr.expected ?? ""}` : "")}
                </li>
              ))}
            </ul>
          )}

          {scorecardResult?.newly_unlocked && scorecardResult.newly_unlocked.length > 0 && (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                New achievements
              </p>
              {scorecardResult.newly_unlocked.map((b) => (
                <div key={b.badge_id} className="flex items-center gap-2">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {scorecardResult?.all_passed && (
              <Button className="flex-1" onClick={loadNextFromScorecard}>
                <Send className="size-4" />
                Next problem
              </Button>
            )}
            {!scorecardResult?.all_passed && (
              <Button className="flex-1" onClick={dismissScorecard}>
                Try again
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={dismissScorecard}>
              Review &amp; edit code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Uncloseable plan limit modal */}
      {planLimitMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <svg className="size-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Daily limit reached</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {planLimitMessage}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <a
                  href="/billing"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Upgrade plan
                </a>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
