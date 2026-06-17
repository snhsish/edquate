"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { listBooks, getBookDetail, getGenerationProgress, subscribeBookProgress } from "@/lib/book-api"
import type { Book, BookDetail } from "@/lib/book-types"
import { BookCreator } from "@/components/book/BookCreator"
import { BookLibrary } from "@/components/book/BookLibrary"
import { BookDetailView } from "@/components/book/BookDetail"
import { ChapterReader } from "@/components/book/ChapterReader"
import type { GenerationPhase } from "@/components/book/BookProgressTimeline"
import { BookOpen, Loader2 } from "lucide-react"

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<BookDetail | null>(null)
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readingChapterId, setReadingChapterId] = useState<string | null>(null)
  const [phase, setPhase] = useState<GenerationPhase>("idle")
  const [streamContent, setStreamContent] = useState("")
  const [streamingChapter, setStreamingChapter] = useState<number | undefined>()
  const [streamingSection, setStreamingSection] = useState<string | undefined>()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true)
    try {
      const data = await listBooks()
      setBooks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load books", err)
    } finally {
      setLoadingBooks(false)
    }
  }, [])

  const loadDetail = useCallback(async (bookId: string) => {
    setLoadingDetail(true)
    setError(null)
    try {
      const data = await getBookDetail(bookId)
      setDetail(data)

      if (
        data.book.status === "generating" ||
        data.book.status === "outlining"
      ) {
        watchProgress(bookId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load book")
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const watchProgress = useCallback((bookId: string) => {
    unsubscribeRef.current?.()

    let cancelled = false
    const poll = async () => {
      try {
        const prog = await getGenerationProgress(bookId)
        if (cancelled) return

        if (prog) {
          setPhase("generating")
          if (prog.stream_content) setStreamContent(prog.stream_content)
          if (prog.chapter) setStreamingChapter(prog.chapter)
          if (prog.current_section) setStreamingSection(prog.current_section)
        }

        if (
          prog &&
          prog.status !== "completed" &&
          prog.status !== "failed"
        ) {
          setTimeout(poll, 2000)
        } else {
          loadDetail(bookId)
        }
      } catch {
        // ignore poll errors
      }
    }
    poll()

    const unsub = subscribeBookProgress(bookId, {
      onProgress: (evt) => {
        if (cancelled) return
        setPhase("generating")
        if (evt.stream_content) setStreamContent(evt.stream_content)
        if (evt.chapter) setStreamingChapter(evt.chapter)
        if (evt.current_section) setStreamingSection(evt.current_section)
      },
      onDone: () => {
        if (cancelled) return
        setPhase("complete")
        loadDetail(bookId)
      },
      onError: () => {
        if (cancelled) return
        setPhase("failed")
      },
    })

    unsubscribeRef.current = () => {
      cancelled = true
      unsub()
    }
  }, [loadDetail])

  useEffect(() => {
    loadBooks()
    return () => {
      unsubscribeRef.current?.()
    }
  }, [loadBooks])

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId)
      setReadingChapterId(null)
      setStreamContent("")
      setPhase("idle")
    } else {
      setDetail(null)
    }
  }, [selectedId, loadDetail])

  const handleCreated = (bookId: string) => {
    loadBooks()
    setSelectedId(bookId)
  }

  const handleRefresh = () => {
    if (selectedId) loadDetail(selectedId)
  }

  const isGenerating =
    phase === "generating" ||
    phase === "exploration" ||
    phase === "outline" ||
    phase === "ingesting"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Books</h1>
          <p className="text-sm text-muted-foreground">
            Generate and learn from AI-powered books
          </p>
        </div>
        <BookCreator onCreated={handleCreated} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!selectedId ? (
          <div className="mx-auto max-w-6xl p-6">
            {loadingBooks ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : books.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <BookOpen className="size-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">No books yet</h2>
                <p className="text-sm text-muted-foreground">
                  Create your first AI-generated book to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setSelectedId(book.id)}
                    className="flex flex-col rounded-lg border bg-card p-5 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <BookOpen className="size-5" />
                    </div>
                    <h3 className="mt-3 font-semibold">{book.title}</h3>
                    {book.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {book.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
                      <span>{book.status}</span>
                      <span>·</span>
                      <span>{book.source_type}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Your Books
                </h2>
              </div>
              <BookLibrary
                books={books}
                selectedId={selectedId}
                onSelect={setSelectedId}
                loading={loadingBooks}
              />
            </aside>

            <section className="min-w-0 space-y-4">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : readingChapterId && detail ? (
                <ChapterReader
                  bookId={selectedId}
                  chapterId={readingChapterId}
                  onClose={() => setReadingChapterId(null)}
                />
              ) : detail ? (
                <BookDetailView
                  detail={detail}
                  onRefresh={handleRefresh}
                  onReadChapter={setReadingChapterId}
                  phase={phase}
                  isGenerating={isGenerating}
                  streamContent={streamContent}
                  streamingChapter={streamingChapter}
                  streamingSection={streamingSection}
                />
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
