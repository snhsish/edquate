"use client"

import { useState } from "react"
import type { BookDetail as BookDetailType, BookOutline } from "@/lib/book-types"
import { startBookGeneration, generateOutline, downloadBookExport } from "@/lib/book-api"
import type { ExportFormat } from "@/lib/book-types"
import { Button } from "@/components/ui/button"
import { BookProgressTimeline } from "@/components/book/BookProgressTimeline"
import { BookLiveWriter } from "@/components/book/BookLiveWriter"
import {
  Loader2,
  FileDown,
  FileText,
  ListTree,
  RefreshCw,
} from "lucide-react"

interface Props {
  detail: BookDetailType
  onRefresh: () => void
  onReadChapter: (chapterId: string) => void
  phase?: string
  isGenerating?: boolean
  streamContent?: string
  streamingChapter?: number
  streamingSection?: string
}

const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "markdown", label: "Markdown" },
  { id: "html", label: "HTML" },
  { id: "epub", label: "EPUB" },
  { id: "docx", label: "Word" },
]

export function BookDetailView({
  detail,
  onRefresh,
  onReadChapter,
  phase,
  isGenerating,
  streamContent,
  streamingChapter,
  streamingSection,
}: Props) {
  const [generating, setGenerating] = useState(false)
  const [outlining, setOutlining] = useState(false)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const { book, chapters, outline } = detail
  const canGenerate =
    book.status === "draft" ||
    book.status === "failed" ||
    book.status === "reviewing"
  const canRead = book.status === "published" || book.status === "reviewing"

  const handleGenerateOutline = async () => {
    setOutlining(true)
    try {
      await generateOutline(book.id)
      onRefresh()
    } catch {
      // error handled by caller
    } finally {
      setOutlining(false)
    }
  }

  const handleGenerateBook = async () => {
    setGenerating(true)
    try {
      await startBookGeneration(book.id)
      onRefresh()
    } catch {
      // error handled by caller
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await downloadBookExport(book.id, format)
    } catch {
      // error handled by caller
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between rounded-lg border bg-card p-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{book.title}</h2>
          {book.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {book.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Status: {book.status}</span>
            <span>·</span>
            <span>{book.source_type}</span>
            <span>·</span>
            <span>
              {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
            </span>
            {book.config?.chapters_count && (
              <>
                <span>·</span>
                <span>{book.config.chapters_count} planned</span>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <BookProgressTimeline
        progress={null}
        phase={phase as any}
      />

      {isGenerating && streamContent && (
        <BookLiveWriter
          chapterNum={streamingChapter}
          content={streamContent}
          section={streamingSection}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {!outline && book.status === "draft" && (
          <Button
            variant="secondary"
            onClick={handleGenerateOutline}
            disabled={outlining}
          >
            {outlining ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ListTree className="mr-2 size-4" />
            )}
            Generate Outline
          </Button>
        )}
        {canGenerate && outline && (
          <Button onClick={handleGenerateBook} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            {generating ? "Generating..." : "Generate Book"}
          </Button>
        )}
      </div>

      {outline && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ListTree className="size-4" />
            Outline
          </h3>
          <div className="space-y-2">
            {outline.chapters.map((ch, i) => (
              <div
                key={ch.id}
                className="rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {i + 1}. {ch.title}
                </span>
                {ch.summary && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ch.summary}
                  </p>
                )}
                {ch.sections.length > 0 && (
                  <ol className="mt-1 list-inside list-decimal text-xs text-muted-foreground">
                    {ch.sections.map((sec, j) => (
                      <li key={sec.id || j}>{sec.title}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {chapters.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Chapters</h3>
          <div className="space-y-2">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onReadChapter(ch.id)}
                    className="text-left text-sm font-medium hover:text-primary"
                    disabled={!canRead && ch.status !== "completed"}
                  >
                    {ch.index + 1}. {ch.title}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{ch.word_count} words</span>
                    <span>·</span>
                    <span>{ch.status}</span>
                  </div>
                </div>
                {(canRead || ch.status === "completed") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReadChapter(ch.id)}
                  >
                    <FileText className="mr-1 size-3" />
                    Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {chapters.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Export</h3>
          <div className="flex flex-wrap gap-2">
            {EXPORT_FORMATS.map((f) => (
              <Button
                key={f.id}
                variant="outline"
                size="sm"
                disabled={exporting !== null || book.status !== "published"}
                onClick={() => handleExport(f.id)}
              >
                {exporting === f.id ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <FileDown className="mr-1 size-3" />
                )}
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
