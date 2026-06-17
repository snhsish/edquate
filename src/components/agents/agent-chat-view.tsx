"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUp, Bot, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import {
  getBotHistory,
  getAgent,
  streamAgentMessage,
} from "@/lib/agent-api"
import type { BotHistoryMessage, BotInfo } from "@/components/agents/types"

type ChatMsg = BotHistoryMessage & { id: string; streaming?: boolean }

function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function AgentChatView({ botId }: { botId: string }) {
  const [bot, setBot] = useState<BotInfo | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    })
  }, [])

  const botIdRef = useRef(botId)

  useEffect(() => {
    let cancelled = false

    if (botId !== botIdRef.current) {
      botIdRef.current = botId
      setLoading(true)
      setError(null)
    }

    Promise.all([getAgent(botId), getBotHistory(botId)])
      .then(([botData, history]) => {
        if (cancelled) return
        setBot(botData)
        setMessages(
          history.map((m) => ({
            ...m,
            id: makeId(),
          })),
        )
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load bot")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [botId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = () => {
    const text = input.trim()
    if (!text || streaming || !bot?.running) return

    const userMsg: ChatMsg = { id: makeId(), role: "user", content: text }
    const assistantId = makeId()

    setInput("")
    setStreaming(true)
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ])

    let accumulated = ""

    streamAgentMessage(botId, text, {
      onToken: (token) => {
        accumulated += token
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulated, streaming: true }
              : m,
          ),
        )
      },
      onError: (msg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: msg || "Something went wrong.",
                  streaming: false,
                }
              : m,
          ),
        )
        setStreaming(false)
      },
      onComplete: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        )
        setStreaming(false)
        inputRef.current?.focus()
      },
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">{error ?? "Bot not found"}</p>
        <Link
          href="/agents"
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Back to Agents
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Link
          href="/agents"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-foreground">
              {bot.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {bot.running ? "Active" : "Inactive — activate from Agents to chat"}
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Start a conversation with {bot.name}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card text-foreground",
                  )}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : msg.streaming ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 border-t bg-background/60 backdrop-blur-xl">
        <div className="p-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border bg-background/60 shadow-lg backdrop-blur-xl">
              <div className="p-4">
                {streaming ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="size-3.5 animate-pulse text-primary" />
                      Generating response...
                    </div>
                  </div>
                ) : (
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      const el = e.target
                      el.style.height = "auto"
                      el.style.height = Math.min(el.scrollHeight, 200) + "px"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={
                      bot.running
                        ? "Message your agent..."
                        : "Activate this agent from Agents to chat"
                    }
                    rows={1}
                    className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    disabled={!bot.running || streaming}
                  />
                )}
              </div>
              {!streaming && (
                <div className="flex items-center gap-1 px-3 py-2">
                  <div className="flex-1" />
                  <button
                    onClick={handleSend}
                    disabled={!bot.running || !input.trim()}
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
    </div>
  )
}
