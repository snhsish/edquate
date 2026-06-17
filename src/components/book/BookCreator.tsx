"use client"

import { useState } from "react"
import { createBook } from "@/lib/book-api"
import { DEFAULT_BOOK_CONFIG, type BookSourceType, type CreateBookRequest } from "@/lib/book-types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BookOpen, Loader2 } from "lucide-react"

interface Props {
  onCreated: (bookId: string) => void
}

export function BookCreator({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [topics, setTopics] = useState("")
  const [sourceType, setSourceType] = useState<BookSourceType>("curriculum")
  const [audience, setAudience] = useState(DEFAULT_BOOK_CONFIG.target_audience)
  const [depth, setDepth] = useState(DEFAULT_BOOK_CONFIG.depth)
  const [style, setStyle] = useState(DEFAULT_BOOK_CONFIG.style)
  const [chaptersCount, setChaptersCount] = useState(DEFAULT_BOOK_CONFIG.chapters_count)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const req: CreateBookRequest = {
      title: title.trim(),
      description: description.trim(),
      source_type: sourceType,
      config: {
        ...DEFAULT_BOOK_CONFIG,
        target_audience: audience,
        depth,
        style,
        curriculum_topics: topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        chapters_count: chaptersCount,
      },
    }

    try {
      const book = await createBook(req)
      onCreated(book.id)
      setOpen(false)
      setTitle("")
      setDescription("")
      setTopics("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="mr-2 size-4" />
          New Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>
              Generate a structured educational book from your topics.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Machine Learning"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="A comprehensive guide covering fundamentals through applications"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Topics (comma-separated)</label>
              <Input
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="linear algebra, gradient descent, neural networks"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as typeof audience)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Depth</label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value as typeof depth)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="overview">Overview</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="deep-dive">Deep Dive</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as typeof style)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="academic">Academic</option>
                  <option value="conversational">Conversational</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Number of Chapters</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={chaptersCount}
                onChange={(e) =>
                  setChaptersCount(
                    Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Source Type</label>
              <select
                value={sourceType}
                onChange={(e) =>
                  setSourceType(e.target.value as BookSourceType)
                }
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="curriculum">Curriculum / Topics</option>
                <option value="upload">Uploaded Documents</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          {error && (
            <p className="px-4 pb-2 text-sm text-red-500">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loading ? "Creating..." : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
