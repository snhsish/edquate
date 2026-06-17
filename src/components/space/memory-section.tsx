"use client"

import { useCallback, useEffect, useState } from "react"
import { Brain, Loader2, Sparkles } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import {
  clearMemoryFacet,
  consolidateMemory,
  fetchMemory,
  updateMemoryFacet,
  type MemoryFacet,
  type MemorySnapshot,
} from "@/lib/memory-api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

const FACETS: { key: MemoryFacet; label: string; hint: string }[] = [
  { key: "journey", label: "Journey", hint: "Running summary of your learning path and current focus." },
  { key: "strengths", label: "Strengths", hint: "Topics and habits where you are progressing well." },
  { key: "gaps", label: "Gaps", hint: "Areas that need more practice or review." },
  { key: "preferences", label: "Preferences", hint: "Learning style, pace, and goals." },
]

function facetToText(facet: MemoryFacet, snap: MemorySnapshot): string {
  const data = snap[facet]
  if (!data || typeof data !== "object") return ""
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

function textToFacetContent(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    if (parsed && typeof parsed === "object") return parsed
  } catch {
    // fall through
  }
  return { summary: text }
}

export function MemorySection() {
  const [snap, setSnap] = useState<MemorySnapshot | null>(null)
  const [active, setActive] = useState<MemoryFacet>("journey")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consolidating, setConsolidating] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMemory()
      setSnap(data)
      setDraft(facetToText(active, data))
    } finally {
      setLoading(false)
    }
  }, [active])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (snap) setDraft(facetToText(active, snap))
  }, [active, snap])

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateMemoryFacet(active, textToFacetContent(draft))
      setSnap(updated)
    } finally {
      setSaving(false)
    }
  }

  async function handleConsolidate() {
    setConsolidating(true)
    try {
      const updated = await consolidateMemory()
      setSnap(updated)
      setDraft(facetToText(active, updated))
    } finally {
      setConsolidating(false)
    }
  }

  async function handleClear() {
    const updated = await clearMemoryFacet(active)
    setSnap(updated)
    setDraft(facetToText(active, updated))
    setClearConfirm(false)
  }

  const meta = snap?.facets_meta?.[active]?.updated_at

  return (
    <>
      <SpaceSectionHeader
        icon={Brain}
        title="Learner Memory"
        description="Four-facet learner graph consolidated from chats, books, and activity."
        onRefresh={load}
        refreshing={loading}
        actions={
          <Button
            variant="outline"
            onClick={() => handleConsolidate()}
            disabled={consolidating}
          >
            <Sparkles className={cn("h-4 w-4 mr-1", consolidating && "animate-pulse")} />
            Consolidate
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FACETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              active === key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {FACETS.find((f) => f.key === active)?.hint}
        {meta ? (
          <span className="ml-2 text-muted-foreground/50">· Updated {meta}</span>
        ) : null}
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            className="w-full rounded-lg border bg-background px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setClearConfirm(true)}>
              Clear facet
            </Button>
          </div>
        </>
      )}

      <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear {active} memory</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear your {active} memory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => handleClear()}>
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
