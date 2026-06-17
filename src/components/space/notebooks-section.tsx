"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, NotebookPen, Plus, Trash2 } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import {
  createNotebookNote,
  deleteNotebookNote,
  listNotebookNotes,
  updateNotebookNote,
  type NotebookNote,
  type NotebookSourceType,
} from "@/lib/notebook-api"
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

const SOURCE_TYPES: NotebookSourceType[] = [
  "manual",
  "chat",
  "book",
  "code_lab",
  "agent",
]

export function NotebooksSection() {
  const [notes, setNotes] = useState<NotebookNote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotebookSourceType | "all">("all")
  const [editing, setEditing] = useState<NotebookNote | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setNotes(await listNotebookNotes())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === "all") return notes
    return notes.filter((n) => (n.source_type ?? "manual") === filter)
  }, [filter, notes])

  function startCreate() {
    setEditing({ id: "", title: "", content: "" })
    setTitle("")
    setContent("")
  }

  function startEdit(note: NotebookNote) {
    setEditing(note)
    setTitle(note.title)
    setContent(note.content)
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return
    if (editing?.id) {
      await updateNotebookNote(editing.id, title.trim(), content.trim())
    } else {
      await createNotebookNote({
        title: title.trim(),
        content: content.trim(),
        source_type: "manual",
      })
    }
    setEditing(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteNotebookNote(deleteTarget)
    if (editing?.id === deleteTarget) setEditing(null)
    setDeleteTarget(null)
    await load()
  }

  return (
    <>
      <SpaceSectionHeader
        icon={NotebookPen}
        title="Notebooks"
        description="Source-tagged notes from chat, books, code lab, and agents."
        onRefresh={load}
        refreshing={loading}
        actions={
          <Button variant="outline" onClick={startCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New note
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs",
            filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          All
        </button>
        {SOURCE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs capitalize",
              filter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {editing !== null ? (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            rows={6}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => handleSave()}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((note) => (
            <li
              key={note.id}
              className="group flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <button
                type="button"
                onClick={() => startEdit(note)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{note.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                    {note.source_type ?? "manual"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {note.content}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDeleteTarget(note.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
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
      </Dialog>
    </>
  )
}
