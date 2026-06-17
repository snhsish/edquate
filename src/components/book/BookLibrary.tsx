"use client"

import type { Book } from "@/lib/book-types"
import { cn } from "@/lib/utils"

interface Props {
  books: Book[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  outlining: "Outlining",
  outlining_complete: "Outline Ready",
  generating: "Generating",
  reviewing: "Reviewing",
  published: "Published",
  failed: "Failed",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  outlining: "text-amber-500",
  outlining_complete: "text-blue-500",
  generating: "text-amber-500",
  reviewing: "text-blue-500",
  published: "text-emerald-500",
  failed: "text-red-500",
}

export function BookLibrary({ books, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No books yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          onClick={() => onSelect(book.id)}
          className={cn(
            "w-full rounded-lg border px-4 py-3 text-left transition-colors",
            selectedId === book.id
              ? "border-primary bg-accent"
              : "border-border bg-background hover:bg-muted",
          )}
        >
          <div className="truncate text-sm font-medium">{book.title}</div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={STATUS_COLORS[book.status] ?? "text-muted-foreground"}>
              {STATUS_LABELS[book.status] ?? book.status}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{book.source_type}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
