"use client"

import { useEffect, useState } from "react"
import { getChapterBlocks } from "@/lib/book-api"
import type { ChapterBlocks } from "@/lib/book-types"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Loader2, ArrowLeft } from "lucide-react"

interface Props {
  bookId: string
  chapterId: string
  onClose: () => void
}

export function ChapterReader({ bookId, chapterId, onClose }: Props) {
  const [data, setData] = useState<ChapterBlocks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getChapterBlocks(bookId, chapterId)
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load chapter"),
      )
      .finally(() => setLoading(false))
  }, [bookId, chapterId])

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          {data && (
            <>
              <div className="text-xs text-muted-foreground">
                Chapter {(data.index ?? 0) + 1}
              </div>
              <h2 className="truncate font-semibold">{data.title}</h2>
            </>
          )}
          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {data && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {data.blocks.map((block) => {
              switch (block.type) {
                case "heading": {
                  const level = block.level ?? 2
                  const Tag = level <= 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4"
                  return (
                    <Tag key={block.id} className="scroll-mt-20">
                      {block.content}
                    </Tag>
                  )
                }
                case "code":
                  return (
                    <pre key={block.id} className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                      <code>{block.content}</code>
                    </pre>
                  )
                case "callout":
                  return (
                    <div
                      key={block.id}
                      className="rounded-lg border-l-4 border-primary bg-muted/50 px-4 py-3 text-sm"
                    >
                      {block.content}
                    </div>
                  )
                case "list":
                  return (
                    <ul key={block.id} className="list-inside list-disc space-y-1">
                      {(block.items ?? block.content.split("\n")).map(
                        (item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ),
                      )}
                    </ul>
                  )
                case "quote":
                  return (
                    <blockquote
                      key={block.id}
                      className="border-l-4 border-muted-foreground/30 pl-4 italic"
                    >
                      {block.content}
                    </blockquote>
                  )
                default:
                  return (
                    <div key={block.id}>
                      <MarkdownRenderer content={block.content} />
                    </div>
                  )
              }
            })}
          </div>
        )}
        {data?.sources && data.sources.length > 0 && (
          <div className="mt-8 border-t pt-4">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Sources
            </h3>
            <ol className="list-inside list-decimal text-xs text-muted-foreground">
              {data.sources.map((src) => (
                <li key={src.id}>
                  {src.title}{" "}
                  <span className="italic">({src.source})</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
