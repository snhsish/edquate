"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Loader2 } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import { listBooks } from "@/lib/book-api"
import type { Book } from "@/lib/book-types"
import { cn } from "@/lib/utils"

export function BooksSection() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setBooks(await listBooks())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <SpaceSectionHeader
        icon={BookOpen}
        title="Books"
        description="Your generated books with exploration insights. Open in the book workspace to read or edit."
        onRefresh={load}
        refreshing={loading}
        actions={
          <Link
            href="/books"
            className="rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            Create book
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No books yet.</p>
          <Link
            href="/books"
            className="mt-4 inline-block text-sm text-muted-foreground underline"
          >
            Create your first book
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((book) => {
            const exploration = book.exploration
            return (
              <Link
                key={book.id}
                href={`/books?bookId=${encodeURIComponent(book.id)}`}
                className="block rounded-lg border bg-card p-4 transition hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-foreground">{book.title}</h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase border",
                      book.status === "published" && "border-emerald-500/30 text-emerald-500",
                      book.status === "generating" && "border-amber-500/30 text-amber-500",
                      book.status === "draft" && "bg-muted text-muted-foreground border-transparent",
                    )}
                  >
                    {book.status}
                  </span>
                </div>
                {book.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {book.description}
                  </p>
                ) : null}
                {exploration?.summary ? (
                  <p className="mt-3 line-clamp-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {exploration.summary}
                  </p>
                ) : null}
                {exploration?.candidate_concepts &&
                exploration.candidate_concepts.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {exploration.candidate_concepts.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(book.updated_at).toLocaleDateString()}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
