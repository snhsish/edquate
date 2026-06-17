"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Bot,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  Square,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  createAgent,
  destroyAgent,
  startAgent,
  stopAgent,
} from "@/lib/agent-api"
import type { BotInfo, SoulTemplate } from "@/components/agents/types"

export function BotsTab({
  bots,
  souls,
  loading,
  onReload,
  onToast,
}: {
  bots: BotInfo[]
  souls: SoulTemplate[]
  loading: boolean
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formSoulId, setFormSoulId] = useState("_custom")
  const [formSoul, setFormSoul] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<BotInfo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const botId = useMemo(() => {
    const trimmed = formName.trim()
    if (!trimmed) return ""
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    if (slug) return slug
    let h = 0
    for (let i = 0; i < trimmed.length; i++) {
      h = (h << 5) - h + trimmed.charCodeAt(i)
      h |= 0
    }
    return `bot-${Math.abs(h).toString(36).padStart(6, "0").slice(0, 8)}`
  }, [formName])

  const resetForm = () => {
    setFormName("")
    setFormDesc("")
    setFormSoulId("_custom")
    setFormSoul("")
  }

  const selectSoul = (id: string) => {
    setFormSoulId(id)
    if (id !== "_custom") {
      const soul = souls.find((s) => s.id === id)
      if (soul) setFormSoul(soul.content)
    }
  }

  const handleCreate = useCallback(async () => {
    if (!botId || !formName.trim()) return
    setCreating(true)
    try {
      await createAgent({
        bot_id: botId,
        name: formName.trim(),
        description: formDesc.trim(),
        persona: formSoul.trim(),
        soul_template_id: formSoulId !== "_custom" ? formSoulId : undefined,
      })
      onToast(`${formName.trim()} created`)
      setShowCreate(false)
      resetForm()
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to create bot")
    } finally {
      setCreating(false)
    }
  }, [botId, formDesc, formName, formSoul, formSoulId, onReload, onToast])

  const handleStart = async (id: string) => {
    try {
      await startAgent(id)
      onToast("Agent started")
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to start bot")
    }
  }

  const handleStop = async (id: string) => {
    try {
      await stopAgent(id)
      onToast("Agent stopped")
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to stop bot")
    }
  }

  const handleDestroy = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await destroyAgent(deleteTarget.bot_id)
      onToast(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to delete bot")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create custom tutoring agents with their own personality.
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          <Plus className="h-4 w-4" />
          New agent
        </button>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete agent?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{deleteTarget?.name}</strong> and all its messages. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDestroy}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 disabled:opacity-40"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setShowCreate(open)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create agent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Physics Helper"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              {botId ? (
                <p className="mt-1 text-xs text-muted-foreground">ID: {botId}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional short description"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Soul template
              </label>
              <select
                value={formSoulId}
                onChange={(e) => selectSoul(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="_custom">Custom persona</option>
                {souls.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Persona (SOUL.md)
              </label>
              <textarea
                value={formSoul}
                onChange={(e) => setFormSoul(e.target.value)}
                rows={8}
                spellCheck={false}
                placeholder="Define the bot's personality in markdown..."
                className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  resetForm()
                }}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !formName.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {bots.length === 0 ? (
        <div
          className={cn(
            "flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed bg-card text-center",
          )}
        >
          <div className="mb-3 rounded-lg bg-muted p-3 text-muted-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No agents yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first agent to get a personalized learning companion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {bots.map((bot) => (
            <div
              key={bot.bot_id}
              className="group flex flex-col rounded-lg border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground truncate">{bot.name}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
                    bot.running
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                    {bot.running ? "Active" : "Inactive"}
                </span>
              </div>
              {bot.description ? (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{bot.description}</p>
              ) : null}
              <p className="mt-auto pt-3 text-xs text-muted-foreground">
                {bot.message_count ?? 0} messages &middot; {bot.bot_id}
              </p>
              <div className="mt-5 flex items-center gap-2">
                {bot.running ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/agents/${bot.bot_id}/chat`)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat with agent
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStart(bot.bot_id)}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Activate
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {bot.running ? (
                    <button
                      type="button"
                      onClick={() => handleStop(bot.bot_id)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop agent
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(bot)}
                    className="inline-flex items-center justify-center rounded-full border p-1.5 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
