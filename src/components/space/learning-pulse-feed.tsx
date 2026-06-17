"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { LayoutList, Loader2, Search } from "lucide-react"
import { SpaceSectionHeader } from "@/components/space/space-section-header"
import {
  fetchSpaceFeed,
  fetchSpaceStats,
  searchSpace,
  type SpaceFeedItem,
  type SpaceStats,
} from "@/lib/space-api"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  chat: "Chat",
  book: "Book",
  knowledge: "Knowledge",
  notebook: "Notebook",
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function LearningPulseFeed() {
  const [items, setItems] = useState<SpaceFeedItem[]>([])
  const [stats, setStats] = useState<SpaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchSpace>>>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [feed, st] = await Promise.all([
        fetchSpaceFeed(30),
        fetchSpaceStats(),
      ])
      setItems(feed)
      setStats(st)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      searchSpace(query.trim()).then(setSearchResults).catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <SpaceSectionHeader
          icon={LayoutList}
          title="Activity"
          description="Recent activity across chats, books, knowledge bases, and notebooks."
          onRefresh={load}
          refreshing={loading}
        />

        {stats ? (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Chats", value: stats.sessions },
              { label: "Books", value: stats.books },
              { label: "KBs", value: stats.knowledge_bases },
              { label: "Notes", value: stats.notebooks },
              { label: "Memory", value: stats.memory_fresh ? "Fresh" : "Stale" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border bg-card px-4 py-3"
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across Space…"
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.trim() && searchResults.length > 0 ? (
          <ul className="mb-8 space-y-2">
            {searchResults.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <Link
                  href={r.link}
                  className="block rounded-lg border bg-card px-4 py-3 transition hover:bg-accent"
                >
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {r.type}
                  </span>
                  <p className="font-medium text-foreground">{r.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No activity yet. Start a chat or create a book.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.link ?? "#"}
                  className="flex items-start gap-4 rounded-lg border bg-card px-4 py-3 transition hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border",
                          item.type === "chat" && "border-blue-500/30 text-blue-500",
                          item.type === "book" && "border-amber-500/30 text-amber-500",
                          item.type === "knowledge" && "border-emerald-500/30 text-emerald-500",
                          item.type === "notebook" && "border-purple-500/30 text-purple-500",
                        )}
                      >
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(item.updated_at)}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{item.title}</p>
                    {item.subtitle ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
