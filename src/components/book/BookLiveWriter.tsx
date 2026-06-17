"use client"

import { useEffect, useRef } from "react"

interface Props {
  title?: string
  chapterNum?: number
  content: string
  section?: string
}

export function BookLiveWriter({ title, chapterNum, content, section }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [content])

  if (!content) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="animate-pulse text-sm text-muted-foreground">
          Waiting for first tokens...
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-card/80">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-emerald-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Writing live
        </div>
        <h3 className="mt-1 font-medium">
          {chapterNum != null ? `Chapter ${chapterNum}` : "Chapter"}
          {title ? `: ${title}` : ""}
        </h3>
        {section && (
          <p className="text-xs text-muted-foreground">Section: {section}</p>
        )}
      </div>
      <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed text-muted-foreground">
        {content}
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-emerald-500/80 align-middle" />
        <div ref={bottomRef} />
      </pre>
    </div>
  )
}
