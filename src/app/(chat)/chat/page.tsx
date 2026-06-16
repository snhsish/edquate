"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAuth } from "@/lib/auth-context"
import { useChat } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Sparkles, Square } from "lucide-react"

export default function ChatPage() {
  const { user } = useAuth()
  const {
    messages,
    streamingContent,
    isStreaming,
    isLoadingSession,
    statusMessage,
    sendMessage,
    clearChat,
  } = useChat()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent, statusMessage])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput("")
    sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
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
        <div className="border-t p-4">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="h-10 flex-1 rounded-xl border bg-muted/50 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-0">
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

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="h-10 flex-1 rounded-xl border bg-muted/50 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                clearChat()
              }}
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
