"use client"

import type { ProgressEvent } from "@/lib/book-types"

export type GenerationPhase =
  | "idle"
  | "ingesting"
  | "exploration"
  | "outline"
  | "approval"
  | "generating"
  | "complete"
  | "failed"

function phaseFromProgress(evt: ProgressEvent | null): GenerationPhase {
  if (!evt) return "idle"
  switch (evt.status) {
    case "generating":
      if (evt.current_step === "exploration") return "exploration"
      if (
        evt.current_step === "outline" ||
        evt.current_step === "outline_complete"
      )
        return "outline"
      if (evt.current_step === "retrieval") return "ingesting"
      return "generating"
    case "awaiting_approval":
      return "approval"
    case "completed":
      return "complete"
    case "failed":
      return "failed"
    default:
      return "generating"
  }
}

function progressLabel(evt: ProgressEvent | null): string {
  if (!evt) return "Ready"
  if (evt.current_step === "streaming") return "Writing live…"
  if (evt.message) return evt.message
  if (evt.current_section) return `Writing: ${evt.current_section}`
  if (evt.chapter) return `Chapter ${evt.chapter}`
  return evt.current_step ?? "Processing..."
}

const PIPELINE_STEPS = [
  { id: "explore", label: "Source Exploration" },
  { id: "outline", label: "Outline Planner" },
  { id: "generate", label: "Chapter Writer" },
  { id: "compile", label: "Compile Book" },
] as const

function activeStepIndex(phase: GenerationPhase): number {
  switch (phase) {
    case "ingesting":
    case "exploration":
      return 0
    case "outline":
    case "approval":
      return 1
    case "generating":
      return 2
    case "complete":
      return 3
    default:
      return 0
  }
}

interface Props {
  progress: ProgressEvent | null
  phase?: GenerationPhase
}

export function BookProgressTimeline({ progress, phase: phaseProp }: Props) {
  const phase = phaseProp ?? phaseFromProgress(progress)
  const activeIdx = activeStepIndex(phase)
  const pct = progress?.progress ?? 0

  if (phase === "idle") return null

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Generation Pipeline</h3>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {progressLabel(progress)}
      </p>
      <div className="grid gap-2 sm:grid-cols-4">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < activeIdx
          const active = i === activeIdx
          return (
            <div
              key={step.id}
              className={`rounded-lg px-2 py-1.5 text-xs ${
                active
                  ? "border bg-accent font-medium text-accent-foreground"
                  : done
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              {step.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
