"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { History, Loader2, Search, Trash2 } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import {
  deleteChatSession,
  listChatSessions,
  updateSessionTitle,
  type ChatSessionSummary,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Dialog as DialogRoot,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

const MODE_LABELS: Record<string, string> = {
  deep_learn: "Deep Learn",
  high_yield: "High Yield",
  interviewer: "Interviewer",
  auto: "Auto",
}

export function ChatHistorySection() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const [renameTarget, setRenameTarget] = useState<ChatSessionSummary | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionSummary | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSessions(await listChatSessions(100, 0))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sessions
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        (s.last_message ?? "").toLowerCase().includes(needle),
    )
  }, [query, sessions])

  async function handleRename() {
    if (!renameTarget || !renameValue.trim() || renameValue.trim() === renameTarget.title) {
      setRenameTarget(null)
      return
    }
    await updateSessionTitle(renameTarget.session_id ?? renameTarget.id, renameValue.trim())
    setRenameTarget(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteChatSession(deleteTarget.session_id ?? deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  return (
    <>
      <SpaceSectionHeader
        icon={History}
        title="Chat History"
        description="Review and reopen previous conversations with mode context."
        onRefresh={load}
        refreshing={loading}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats…"
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No chats found.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((session) => {
            const mode =
              session.preferences?.mode ??
              (session as { mode?: string }).mode ??
              "deep_learn"
            const id = session.session_id ?? session.id
            return (
              <li
                key={id}
                className="group flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/chat?session=${encodeURIComponent(id)}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{session.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {MODE_LABELS[mode] ?? mode}
                    </span>
                    {session.message_count ? (
                      <span className="text-xs text-muted-foreground">
                        {session.message_count} msgs
                      </span>
                    ) : null}
                  </div>
                  {session.last_message ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {session.last_message}
                    </p>
                  ) : null}
                </button>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => { setRenameTarget(session); setRenameValue(session.title) }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteTarget(session)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <DialogRoot open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Enter a new name for this chat session.</DialogDescription>
          </DialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Chat name"
            className="rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleRename()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  )
}
