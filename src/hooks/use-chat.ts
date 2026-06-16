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

interface UseChatReturn {
  messages: LocalMessage[]
  streamingContent: string | null
  isStreaming: boolean
  isLoadingSession: boolean
  sessionId: string | null
  statusMessage: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      setIsStreaming(true)
      setStreamingContent("")
      setStatusMessage(null)

      const userMessage: LocalMessage = { role: "user", content }
      setMessages((prev) => [...prev, userMessage])

      try {
        let sid = sessionId

        if (!sid) {
          setIsLoadingSession(true)
          const session = await createSession()
          sid = session.session_id
          setSessionId(sid)
          setIsLoadingSession(false)
        }

        const abortController = new AbortController()
        abortRef.current = abortController

        let fullResponse = ""

        await chatStream(
          { message: content, session_id: sid },
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
    sendMessage,
    clearChat,
  }
}
