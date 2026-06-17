"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Library, Loader2, Plus, Search, Trash2, Upload } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  listKbFiles,
  listKnowledgeBases,
  searchKnowledgeBase,
  uploadKbDocument,
  type KnowledgeBaseSummary,
  type KbSearchChunk,
} from "@/lib/knowledge-api"
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

export function KnowledgeSection() {
  const searchParams = useSearchParams()
  const initialKb = searchParams.get("kb")

  const [kbs, setKbs] = useState<KnowledgeBaseSummary[]>([])
  const [selected, setSelected] = useState<string | null>(initialKb)
  const [files, setFiles] = useState<{ name: string; size: number; preview_url?: string }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KbSearchChunk[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const loadKbs = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listKnowledgeBases()
      setKbs(list)
      setSelected((prev) =>
        prev && list.some((k) => k.name === prev) ? prev : list[0]?.name ?? null,
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKbs()
  }, [loadKbs])

  useEffect(() => {
    if (!selected) {
      setFiles([])
      return
    }
    listKbFiles(selected)
      .then((f) =>
        setFiles(
          f.map((x) => ({
            name: x.name,
            size: x.size,
            preview_url: x.preview_url,
          })),
        ),
      )
      .catch(() => setFiles([]))
  }, [selected])

  async function refreshAll() {
    await loadKbs()
  }

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      await createKnowledgeBase(createName.trim())
      setSelected(createName.trim())
      setCreateDialogOpen(false)
      setCreateName("")
      await loadKbs()
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteKnowledgeBase(deleteTarget)
    if (selected === deleteTarget) setSelected(null)
    setDeleteTarget(null)
    await loadKbs()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    const kb = kbs.find((k) => k.name === selected)
    if (!kb) return
    setUploading(true)
    setUploadError(null)
    try {
      await uploadKbDocument(kb.id, file)
      await loadKbs()
      e.target.value = ""
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      setUploadError(msg)
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  async function handleSearch() {
    if (!selected || !searchQuery.trim()) return
    setSearching(true)
    try {
      setSearchResults(await searchKnowledgeBase(selected, searchQuery.trim()))
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <SpaceSectionHeader
        icon={Library}
        title="Knowledge"
        description="HashEmbed + pgvector knowledge bases. Upload documents and preview retrieval."
        onRefresh={refreshAll}
        refreshing={loading}
        actions={
          <Button variant="outline" onClick={() => { setCreateDialogOpen(true); setCreateName("") }}>
            <Plus className="h-4 w-4 mr-1" />
            New KB
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : kbs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No knowledge bases yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1">
            {kbs.map((kb) => (
              <li key={kb.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelected(kb.name)}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm",
                    selected === kb.name
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-card",
                  )}
                >
                  {kb.name}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(kb.name)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-foreground">{selected}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Indexed with HashEmbed feature hashing into pgvector
                </p>
              </div>

              <div>
                <label className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-card px-4 py-6 text-sm text-muted-foreground hover:bg-accent",
                  uploading && "pointer-events-none opacity-50",
                )}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload document (.pdf, .txt, .md)"}
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.docx"
                    className="hidden"
                    onChange={(e) => handleUpload(e)}
                    disabled={uploading}
                  />
                </label>
                {uploadError ? (
                  <p className="mt-2 text-xs text-destructive">{uploadError}</p>
                ) : null}
              </div>

              {files.length > 0 ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {files.map((f) => (
                    <li key={f.name} className="rounded-lg bg-card px-3 py-2">
                      {f.preview_url ? (
                        <a
                          href={f.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {f.name}
                        </a>
                      ) : (
                        f.name
                      )}{" "}
                      <span className="text-muted-foreground/50">
                        ({Math.round(f.size / 1024)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
              )}

              <div>
                <div className="flex gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search preview (pgvector)…"
                    className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleSearch()}
                    disabled={searching}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                </div>
                {searchResults.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {searchResults.map((chunk) => (
                      <li
                        key={chunk.id}
                        className="rounded-lg border bg-card p-3 text-sm"
                      >
                        {chunk.summary ? (
                          <p className="font-medium text-foreground">
                            {chunk.summary}
                          </p>
                        ) : null}
                        <p className="mt-1 line-clamp-3 text-muted-foreground">
                          {chunk.content}
                        </p>
                        {chunk.book_id ? (
                          <p className="mt-2 text-xs text-emerald-500">
                            Linked to book {chunk.book_id}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create knowledge base</DialogTitle>
            <DialogDescription>Enter a name for your new knowledge base.</DialogDescription>
          </DialogHeader>
          <input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Knowledge base name"
            className="rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleCreate()} disabled={creating || !createName.trim()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete knowledge base</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget}&rdquo;? This action cannot be undone.
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
