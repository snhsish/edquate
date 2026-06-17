"use client"

import { useCallback, useState } from "react"
import { Heart, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createSoul, deleteSoul, updateSoul } from "@/lib/agent-api"
import type { SoulTemplate } from "@/components/agents/types"

export function SoulsTab({
  souls,
  onReload,
  onToast,
}: {
  souls: SoulTemplate[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")
  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<SoulTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const cancelEdit = () => {
    setEditing(null)
    setEditName("")
    setEditContent("")
  }

  const saveSoul = useCallback(async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateSoul(editing, {
        name: editName.trim(),
        content: editContent,
      })
      onToast(`"${editName.trim()}" updated`)
      cancelEdit()
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to save soul")
    } finally {
      setSaving(false)
    }
  }, [editContent, editName, editing, onReload, onToast])

  const handleCreate = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    if (!id) return
    setSaving(true)
    try {
      await createSoul({ id, name, content: newContent })
      onToast(`"${name}" created`)
      setCreating(false)
      setNewName("")
      setNewContent("")
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to create soul")
    } finally {
      setSaving(false)
    }
  }, [newContent, newName, onReload, onToast])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSoul(deleteTarget.id)
      if (editing === deleteTarget.id) cancelEdit()
      onToast(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      await onReload()
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to delete soul")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Reusable persona templates for creating agents.
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          <Plus className="h-4 w-4" />
          New soul
        </button>
      </div>

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open) {
            setNewName("")
            setNewContent("")
          }
          setCreating(open)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create soul</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Creative Writer"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Content (SOUL.md)
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={10}
                spellCheck={false}
                placeholder="Define the soul in markdown..."
                className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setNewName("")
                  setNewContent("")
                }}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !newName.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
              >
                {saving ? (
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

      {souls.length === 0 && !creating ? (
        <div
          className={cn(
            "flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed bg-card text-center",
          )}
        >
          <Heart className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No souls yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {souls.map((soul) =>
            editing === soul.id ? (
              <div key={soul.id} className="rounded-lg border bg-card p-5">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mb-3 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm leading-6 text-foreground outline-none focus:border-ring"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSoul}
                    disabled={saving || !editName.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={soul.id}
                className={cn(
                  "group flex items-start justify-between rounded-lg border bg-card p-5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{soul.name}</p>
                    <span className="text-xs text-muted-foreground">{soul.id}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {soul.content.replace(/^#.*\n+/g, "").slice(0, 200)}
                  </p>
                </div>
                <div className="ml-4 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(soul.id)
                      setEditName(soul.name)
                      setEditContent(soul.content)
                      setCreating(false)
                    }}
                    className="rounded-full border p-2 text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(soul)}
                    className="rounded-full border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete soul?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>{deleteTarget?.name}</strong>.
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
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 disabled:opacity-40"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
