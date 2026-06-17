"use client"

import { useState, useRef, useCallback } from "react"
import {
  type Message,
  type SSEEvent,
  createSession,
  chatStream,
} from "@/lib/api"

interface LocalMessage {
  id?: number
  role: "user" | "assistant"
  content: string
}

interface UseChatOptions {
  onNewSessionComplete?: (sessionId: string) => void
}

interface UseChatReturn {
  messages: LocalMessage[]
  streamingContent: string | null
  isStreaming: boolean
  isLoadingSession: boolean
  sessionId: string | null
  statusMessage: string | null
  title: string
  setTitle: (title: string) => void
  sendMessage: (content: string, mode?: string, memoryFacets?: string[]) => Promise<void>
  clearChat: () => void
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [title, setTitle] = useState<string>("New chat")
  const abortRef = useRef<AbortController | null>(null)
  const isNewSessionRef = useRef(false)
  const onNewSessionCompleteRef = useRef(options?.onNewSessionComplete)
  onNewSessionCompleteRef.current = options?.onNewSessionComplete

  const sendMessage = useCallback(
    async (content: string, mode = "deep_learn", memoryFacets?: string[]) => {
      if (!content.trim() || isStreaming) return

      setIsStreaming(true)
      setStreamingContent("")
      setStatusMessage(null)

      const userMessage: LocalMessage = { role: "user", content }
      setMessages((prev) => [...prev, userMessage])

      let sid = sessionId

      try {
        if (!sid) {
          setIsLoadingSession(true)
          const session = await createSession("New chat", mode)
          sid = session.session_id
          setSessionId(sid)
          setIsLoadingSession(false)
          isNewSessionRef.current = true
        }

        const abortController = new AbortController()
        abortRef.current = abortController

        let fullResponse = ""

        await chatStream(
          { message: content, session_id: sid, mode, ...(memoryFacets && memoryFacets.length > 0 ? { memory_facets: memoryFacets } : {}) },
          (event: SSEEvent) => {
            switch (event.type) {
              case "status":
                setStatusMessage(event.message)
                break
              case "stream":
                fullResponse += event.content
                setStreamingContent(fullResponse)
                break
              case "done":
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: fullResponse },
                ])
                setStreamingContent(null)
                setStatusMessage(null)
                break
              case "error":
                setStreamingContent(null)
                setStatusMessage(null)
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Error: ${event.message}`,
                  },
                ])
                break
              case "upgrade_required":
                setStreamingContent(null)
                setStatusMessage(null)
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Upgrade required: ${event.message}`,
                  },
                ])
                break
            }
          },
          abortController.signal,
        )
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setStreamingContent(null)
        setStatusMessage(null)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
          },
        ])
      } finally {
        setIsStreaming(false)
        abortRef.current = null
        if (isNewSessionRef.current && sid) {
          isNewSessionRef.current = false
          onNewSessionCompleteRef.current?.(sid)
        }
      }
    },
    [isStreaming, sessionId],
  )

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreamingContent(null)
    setIsStreaming(false)
    setSessionId(null)
    setStatusMessage(null)
  }, [])

  return {
    messages,
    streamingContent,
    isStreaming,
    isLoadingSession,
    sessionId,
    statusMessage,
    title,
    setTitle,
    sendMessage,
    clearChat,
  }
}
