"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAuth } from "@/lib/auth-context"
import { useChat } from "@/hooks/use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  ArrowUp,
  Sparkles,
  ChevronDown,
  Paperclip,
  BookOpen,
  GraduationCap,
  Briefcase,
  Zap,
  Lightbulb,
  Check,
  Brain,
  X,
  Share2,
  Download,
  FileJson,
  FileText,
  EyeOff,
} from "lucide-react"

const chatModes = [
  {
    id: "deep_learn",
    label: "Deep Learn",
    description: "Conceptual mastery from ground up",
    icon: BookOpen,
  },
  {
    id: "exam_sprint",
    label: "Exam Sprint",
    description: "High-yield PYQs, definitions, speed",
    icon: GraduationCap,
  },
  {
    id: "placement_prep",
    label: "Placement Prep",
    description: "Algorithms, Big-O, edge cases",
    icon: Briefcase,
  },
  {
    id: "revision_blitz",
    label: "Revision Blitz",
    description: "Fast recap, linking concepts",
    icon: Zap,
  },
  {
    id: "practice_mode",
    label: "Practice Mode",
    description: "Socratic hints, guided problems",
    icon: Lightbulb,
  },
]

const memoryFacetOptions = [
  { id: "journey", label: "Journey", description: "Learning path and current focus" },
  { id: "strengths", label: "Strengths", description: "Topics and habits going well" },
  { id: "gaps", label: "Gaps", description: "Areas needing practice or review" },
  { id: "preferences", label: "Preferences", description: "Style, pace, and goals" },
]

export default function ChatPage() {
  const { user } = useAuth()
  const {
    messages,
    streamingContent,
    isStreaming,
    isLoadingSession,
    statusMessage,
    title,
    setTitle,
    sendMessage,
  } = useChat()
  const [input, setInput] = useState("")
  const [mode, setMode] = useState("deep_learn")
  const [memoryFacets, setMemoryFacets] = useState<string[]>([])
  const [isTemporary, setIsTemporary] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeMode = chatModes.find((m) => m.id === mode) || chatModes[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent, statusMessage])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput("")
    sendMessage(trimmed, mode, memoryFacets)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
            placeholder="Chat title"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                messages.map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`).join("\n\n")
              )
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="size-3.5" />
            Share
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Download className="size-3.5" />
                Download
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const md = messages.map((m) => `### ${m.role === "user" ? "You" : "AI"}\n\n${m.content}`).join("\n\n---\n\n")
                  const blob = new Blob([md], { type: "text/markdown" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${title || "chat"}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <FileText className="mr-2 size-4" />
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const json = JSON.stringify({ title, messages }, null, 2)
                  const blob = new Blob([json], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${title || "chat"}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <FileJson className="mr-2 size-4" />
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setIsTemporary(!isTemporary)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${isTemporary ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <EyeOff className="size-3.5" />
            Temporary chat
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-0">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <MessageSquare className="size-8 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">Chat with Edquate AI</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask anything — I&apos;m here to help you learn.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="mt-0.5 size-8 shrink-0">
                {msg.role === "assistant" ? (
                  <AvatarImage src="/icons/edquate.png" alt="Edquate AI" />
                ) : null}
                <AvatarFallback
                  className={
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground text-xs"
                      : "bg-secondary text-secondary-foreground text-xs"
                  }
                >
                  {msg.role === "user"
                    ? (user?.display_name?.charAt(0)?.toUpperCase() || "U")
                    : "AI"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted prose prose-sm dark:prose-invert max-w-none"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {streamingContent !== null && (
            <div className="flex gap-3">
              <Avatar className="mt-0.5 size-8 shrink-0">
                <AvatarImage src="/icons/edquate.png" alt="Edquate AI" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">AI</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                {streamingContent ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                ) : (
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          )}

          {statusMessage && !streamingContent && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Sparkles className="size-3.5 animate-pulse text-primary" />
              <span className="text-xs text-muted-foreground">{statusMessage}</span>
            </div>
          )}

          {isLoadingSession && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Sparkles className="size-3.5 animate-pulse text-primary" />
              <span className="text-xs text-muted-foreground">Starting chat session...</span>
            </div>
          )}

          <div ref={bottomRef} className="h-40" />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-background/80 shadow-lg backdrop-blur-sm">
            <div className="p-4">
              {memoryFacets.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {memoryFacets.map((facetId) => {
                    const facet = memoryFacetOptions.find((f) => f.id === facetId)
                    if (!facet) return null
                    return (
                      <span
                        key={facetId}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {facet.label}
                        <button
                          onClick={() => setMemoryFacets((prev) => prev.filter((f) => f !== facetId))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              {isStreaming ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="size-3.5 animate-pulse text-primary" />
                    {statusMessage || "Generating response..."}
                  </div>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  disabled={isStreaming}
                />
              )}
            </div>
            {!isStreaming && (
              <div className="flex items-center gap-1 px-3 py-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <Paperclip className="size-3.5" />
                  Attach
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${memoryFacets.length > 0 ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"}`}>
                      <Brain className="size-3.5" />
                      Memory
                      <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 p-2">
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium">Attach memory</div>
                      <div className="text-xs text-muted-foreground">Include facets from your learner memory in this message</div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {memoryFacetOptions.map((facet) => {
                      const isSelected = memoryFacets.includes(facet.id)
                      return (
                        <DropdownMenuItem
                          key={facet.id}
                          onClick={() => {
                            setMemoryFacets((prev) =>
                              isSelected
                                ? prev.filter((f) => f !== facet.id)
                                : [...prev, facet.id]
                            )
                          }}
                          className="flex items-start gap-3 py-2.5"
                        >
                          <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"}`}>
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{facet.label}</div>
                            <div className="text-xs text-muted-foreground">{facet.description}</div>
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <activeMode.icon className="size-3.5" />
                      {activeMode.label}
                      <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    {chatModes.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex items-start gap-3 py-2.5 ${mode === m.id ? "bg-accent" : ""}`}
                      >
                        <m.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{m.label}</span>
                            {mode === m.id && (
                              <Check className="size-3.5 text-primary" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {m.description}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1" />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
